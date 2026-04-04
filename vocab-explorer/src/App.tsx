import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import './App.css'
import Wordmap from './Wordmap'
import Corpus, {
  findWordByQuery,
  getChildWords,
  getParentWords,
  getSiblingWords,
  getWordById,
  getWordLabel,
  type Word,
} from './WordType'

type Screen = 'login' | 'register' | 'search' | 'map' | 'detail' | 'settings' | 'groups' | 'help'
type HelpSection = 'how' | 'legend' | 'web' | 'groups' | 'about'

type Swatch = {
  label: string
  value: string
}

type WordGroup = {
  id: string
  name: string
  wordIds: string[]
  notes: string
}

const semanticSwatches: Swatch[] = [
  { label: 'Rose', value: '#ef7b7b' },
  { label: 'Sun', value: '#f7b85d' },
  { label: 'Gold', value: '#f6d268' },
  { label: 'Leaf', value: '#a8d27f' },
  { label: 'Sky', value: '#7ea6e9' },
  { label: 'Blush', value: '#d8b0c8' },
]

const initialGroups: WordGroup[] = [
  {
    id: 'animals',
    name: 'Animals',
    wordIds: ['_dog'],
    notes: '',
  },
]

const matchScores: Record<string, number> = {
  _animal: 91,
  _dog: 67,
  _puppy: 84,
  _bark: 72,
  _panda: 79,
  '_mamÃ¢htÃ¢wisiwin': 68,
}

function App() {
  const fallbackWord = Corpus.Words[0]
  const defaultWord = findWordByQuery('dog') ?? fallbackWord

  const [screen, setScreen] = useState<Screen>('login')
  const [previousScreen, setPreviousScreen] = useState<Screen>('search')
  const [helpReturnScreen, setHelpReturnScreen] = useState<Screen>('search')
  const [helpSection, setHelpSection] = useState<HelpSection>('how')
  const [searchValue, setSearchValue] = useState('')
  const [activeWordId, setActiveWordId] = useState(defaultWord.id)
  const [semanticGaps, setSemanticGaps] = useState(true)
  const [fontSize, setFontSize] = useState(18)
  const [contrastColor, setContrastColor] = useState(semanticSwatches[0].value)
  const [hierarchyColor, setHierarchyColor] = useState(semanticSwatches[4].value)
  const [relatedColor, setRelatedColor] = useState(semanticSwatches[3].value)
  const [groups, setGroups] = useState<WordGroup[]>(initialGroups)
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroups[0].id)
  const [groupsView, setGroupsView] = useState<'overview' | 'detail'>('overview')
  const [groupSearchValue, setGroupSearchValue] = useState('')
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showAddWordsModal, setShowAddWordsModal] = useState(false)
  const [groupWordSearch, setGroupWordSearch] = useState('')
  const [notesByWordId, setNotesByWordId] = useState<Record<string, string>>({})

  const activeWord = getWordById(activeWordId) ?? defaultWord
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0]
  const relatedWords = useMemo(() => {
    const deduped = new Map<string, Word>()
    ;[...getParentWords(activeWord.id), ...getSiblingWords(activeWord.id), ...getChildWords(activeWord.id)].forEach(
      (word) => {
        deduped.set(word.id, word)
      },
    )

    return [...deduped.values()].slice(0, 3)
  }, [activeWord.id])

  const groupWords = useMemo(
    () =>
      (selectedGroup?.wordIds ?? [])
        .map((wordId) => getWordById(wordId))
        .filter((word): word is Word => Boolean(word)),
    [selectedGroup],
  )

  const filteredGroups = useMemo(() => {
    const searchTerm = groupSearchValue.trim().toLowerCase()

    if (!searchTerm) {
      return groups
    }

    return groups.filter((group) => group.name.toLowerCase().includes(searchTerm))
  }, [groupSearchValue, groups])

  const addableWords = useMemo(() => {
    const searchTerm = groupWordSearch.trim().toLowerCase()
    const selectedIds = new Set(selectedGroup?.wordIds ?? [])

    return Corpus.Words.filter((word) => !selectedIds.has(word.id)).filter((word) => {
      if (!searchTerm) {
        return true
      }

      return [word.english, word.cree]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(searchTerm))
    })
  }, [groupWordSearch, selectedGroup])

  const shellStyle = useMemo(
    () =>
      ({
        '--font-scale': `${fontSize}px`,
        '--semantic-color-1': contrastColor,
        '--semantic-color-2': hierarchyColor,
        '--semantic-color-3': relatedColor,
      }) as CSSProperties,
    [contrastColor, fontSize, hierarchyColor, relatedColor],
  )

  function openSettings(from: Screen) {
    setPreviousScreen(from)
    setScreen('settings')
  }

  function openHelp(from: Screen, nextSection: HelpSection = 'how') {
    setHelpReturnScreen(from)
    setHelpSection(nextSection)
    setScreen('help')
  }

  function openSearchResult(query: string) {
    const nextWord = findWordByQuery(query) ?? defaultWord
    setSearchValue(getWordLabel(nextWord))
    setActiveWordId(nextWord.id)
    setScreen('map')
  }

  function openSearchScreen() {
    setSearchValue('')
    setScreen('search')
  }

  function openGroupsOverview() {
    setScreen('groups')
    setGroupsView('overview')
    setShowCreateGroupModal(false)
    setShowAddWordsModal(false)
    setGroupWordSearch('')
  }

  function openGroupDetail(groupId: string) {
    setSelectedGroupId(groupId)
    setGroupsView('detail')
    setScreen('groups')
    setShowCreateGroupModal(false)
    setShowAddWordsModal(false)
    setGroupWordSearch('')
  }

  function openWordDetail(wordId: string) {
    setActiveWordId(wordId)
    setScreen('detail')
  }

  function addWordToGroup(groupId: string, wordId: string) {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId && !group.wordIds.includes(wordId)
          ? { ...group, wordIds: [...group.wordIds, wordId] }
          : group,
      ),
    )
  }

  function handleSelectGroup(groupId: string) {
    setSelectedGroupId(groupId)
    addWordToGroup(groupId, activeWord.id)
  }

  function handleCreateGroup() {
    const trimmedName = newGroupName.trim()

    if (!trimmedName) {
      return
    }

    const baseId = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    let nextId = baseId || `group-${groups.length + 1}`
    let counter = 2

    while (groups.some((group) => group.id === nextId)) {
      nextId = `${baseId || 'group'}-${counter}`
      counter += 1
    }

    const nextGroup: WordGroup = {
      id: nextId,
      name: trimmedName,
      wordIds: [],
      notes: '',
    }

    setGroups((currentGroups) => [...currentGroups, nextGroup])
    setNewGroupName('')
    openGroupDetail(nextGroup.id)
  }

  function updateGroupNotes(notes: string) {
    if (!selectedGroup) {
      return
    }

    setGroups((currentGroups) =>
      currentGroups.map((group) => (group.id === selectedGroup.id ? { ...group, notes } : group)),
    )
  }

  function removeWordFromSelectedGroup(wordId: string) {
    if (!selectedGroup) {
      return
    }

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === selectedGroup.id
          ? { ...group, wordIds: group.wordIds.filter((groupWordId) => groupWordId !== wordId) }
          : group,
      ),
    )
  }

  function deleteSelectedGroup() {
    if (!selectedGroup) {
      return
    }

    const remainingGroups = groups.filter((group) => group.id !== selectedGroup.id)
    setGroups(remainingGroups)

    if (remainingGroups[0]) {
      setSelectedGroupId(remainingGroups[0].id)
    }

    setGroupsView('overview')
    setShowAddWordsModal(false)
  }

  function renderPage() {
    switch (screen) {
      case 'login':
        return (
          <AuthPage
            mode="login"
            onOpenSettings={() => openSettings('login')}
            onPrimaryAction={() => setScreen('search')}
            onSwitchMode={() => setScreen('register')}
          />
        )
      case 'register':
        return (
          <AuthPage
            mode="register"
            onOpenSettings={() => openSettings('register')}
            onPrimaryAction={() => setScreen('search')}
            onSwitchMode={() => setScreen('login')}
          />
        )
      case 'search':
        return (
          <SearchPage
            searchValue={searchValue}
            onSearchValueChange={setSearchValue}
            onSearch={() => openSearchResult(searchValue)}
            onOpenSettings={() => openSettings('search')}
            onOpenHelp={() => openHelp('search')}
            onOpenGroups={openGroupsOverview}
            onOpenHome={openSearchScreen}
          />
        )
      case 'map':
        return (
          <MapPage
            word={activeWord}
            searchValue={searchValue}
            semanticGaps={semanticGaps}
            hierarchyColor={hierarchyColor}
            relatedColor={relatedColor}
            onSearchValueChange={setSearchValue}
            onSearch={() => openSearchResult(searchValue)}
            onOpenSettings={() => openSettings('map')}
            onOpenHelp={() => openHelp('map', 'web')}
            onOpenWord={openWordDetail}
            onOpenGroups={openGroupsOverview}
            onOpenHome={openSearchScreen}
          />
        )
      case 'detail':
        return (
          <WordDetailPage
            word={activeWord}
            relatedWords={relatedWords}
            groups={groups}
            selectedGroupId={selectedGroupId}
            noteValue={notesByWordId[activeWord.id] ?? ''}
            matchScore={matchScores[activeWord.id] ?? 78}
            onBack={() => setScreen('map')}
            onOpenSettings={() => openSettings('detail')}
            onSelectGroup={handleSelectGroup}
            onNoteChange={(value) =>
              setNotesByWordId((current) => ({ ...current, [activeWord.id]: value }))
            }
            onOpenGroups={openGroupsOverview}
            onOpenHome={openSearchScreen}
          />
        )
      case 'settings':
        return (
          <SettingsPage
            semanticGaps={semanticGaps}
            fontSize={fontSize}
            contrastColor={contrastColor}
            hierarchyColor={hierarchyColor}
            relatedColor={relatedColor}
            onBack={() => setScreen(previousScreen)}
            onToggleSemanticGaps={() => setSemanticGaps((current) => !current)}
            onFontSizeChange={setFontSize}
            onSelectContrastColor={setContrastColor}
            onSelectHierarchyColor={setHierarchyColor}
            onSelectRelatedColor={setRelatedColor}
            onLogOut={() => {
              setScreen('login')
            }}
            onOpenGroups={openGroupsOverview}
            onOpenHome={openSearchScreen}
          />
        )
      case 'help':
        return (
          <HelpPage
            activeSection={helpSection}
            contrastColor={contrastColor}
            hierarchyColor={hierarchyColor}
            relatedColor={relatedColor}
            onBack={() => setScreen(helpReturnScreen)}
            onSelectSection={setHelpSection}
            onOpenGroups={openGroupsOverview}
            onOpenHome={openSearchScreen}
          />
        )
      case 'groups':
        return (
          <GroupsPage
            groups={filteredGroups}
            selectedGroup={selectedGroup}
            groupWords={groupWords}
            groupsView={groupsView}
            groupSearchValue={groupSearchValue}
            newGroupName={newGroupName}
            groupWordSearch={groupWordSearch}
            showCreateGroupModal={showCreateGroupModal}
            showAddWordsModal={showAddWordsModal}
            addableWords={addableWords}
            onBack={openGroupsOverview}
            onOpenGroup={openGroupDetail}
            onOpenWord={(wordId) => {
              setActiveWordId(wordId)
              setScreen('detail')
            }}
            onGroupSearchChange={setGroupSearchValue}
            onNewGroupNameChange={setNewGroupName}
            onOpenCreateGroup={() => setShowCreateGroupModal(true)}
            onCloseCreateGroup={() => {
              setShowCreateGroupModal(false)
              setNewGroupName('')
            }}
            onCreateGroup={handleCreateGroup}
            onOpenAddWords={() => setShowAddWordsModal(true)}
            onCloseAddWords={() => {
              setShowAddWordsModal(false)
              setGroupWordSearch('')
            }}
            onGroupWordSearchChange={setGroupWordSearch}
            onAddWord={(wordId) => {
              if (selectedGroup) {
                addWordToGroup(selectedGroup.id, wordId)
              }

              setShowAddWordsModal(false)
              setGroupWordSearch('')
            }}
            onRemoveWord={removeWordFromSelectedGroup}
            onGroupNotesChange={updateGroupNotes}
            onDeleteGroup={deleteSelectedGroup}
            onOpenGroups={openGroupsOverview}
            onOpenHome={openSearchScreen}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app-shell" style={shellStyle}>
      <div className="phone-shell">
        <div className="phone-overlay" aria-hidden="true">
          <span className="phone-camera" />
          <span className="phone-speaker" />
          <span className="phone-button phone-button-top" />
          <span className="phone-button phone-button-bottom" />
        </div>

        <div className="phone-frame">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

type AuthPageProps = {
  mode: 'login' | 'register'
  onPrimaryAction: () => void
  onSwitchMode: () => void
  onOpenSettings: () => void
}

function AuthPage({ mode, onPrimaryAction, onSwitchMode, onOpenSettings }: AuthPageProps) {
  const isRegister = mode === 'register'

  return (
    <section className="page auth-page">
      <div className="top-actions top-actions-single">
        <CircleIconButton label="Settings" onClick={onOpenSettings}>
          <SettingsIcon />
        </CircleIconButton>
      </div>

      <div className="brand-lockup">
        <div>
          <h1>Vocabulary Explorer</h1>
          <p className="screen-subtitle">
            Explore English and Cree vocabulary through search, maps, and word cards.
          </p>
        </div>
        <div className="logo-tile" aria-hidden="true">
          <SearchIcon />
        </div>
      </div>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          onPrimaryAction()
        }}
      >
        <label className="field-label">
          <span>Email:</span>
          <input type="email" defaultValue="your-email@app.com" />
        </label>

        <label className="field-label">
          <span>Password:</span>
          <input type="password" defaultValue="************" />
        </label>

        {isRegister ? (
          <label className="field-label">
            <span>Confirm Password:</span>
            <input type="password" defaultValue="************" />
          </label>
        ) : (
          <button type="button" className="text-link align-left">
            Forgot your password?
          </button>
        )}

        <button type="submit" className="primary-button auth-button">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>

      <p className="switch-copy">
        {isRegister ? 'Already have an account?' : 'New User?'}{' '}
        <button type="button" className="text-link inline-link" onClick={onSwitchMode}>
          {isRegister ? 'Login!' : 'Register here!'}
        </button>
      </p>
    </section>
  )
}

type SearchPageProps = {
  searchValue: string
  onSearchValueChange: (value: string) => void
  onSearch: () => void
  onOpenSettings: () => void
  onOpenHelp: () => void
  onOpenGroups: () => void
  onOpenHome: () => void
}

function SearchPage({
  searchValue,
  onSearchValueChange,
  onSearch,
  onOpenSettings,
  onOpenHelp,
  onOpenGroups,
  onOpenHome,
}: SearchPageProps) {
  return (
    <section className="page search-page has-footer">
      <div className="top-actions">
        <CircleIconButton label="Help" onClick={onOpenHelp}>
          <HelpIcon />
        </CircleIconButton>
        <CircleIconButton label="Settings" onClick={onOpenSettings}>
          <SettingsIcon />
        </CircleIconButton>
      </div>

      <div className="search-stage">
        <div className="search-preview-stack">
          <form
            className="search-form search-form-centered"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch()
            }}
          >
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Search for an English or Cree word"
            />
            <button type="submit" className="search-submit search-submit-inline" aria-label="Search">
              <SearchIcon />
            </button>
          </form>

          <div className="search-preview-panel">
            <FancyWebmapArtwork />
          </div>
        </div>
      </div>

      <FooterNav active="home" onOpenGroups={onOpenGroups} onOpenHome={onOpenHome} />
    </section>
  )
}

type MapPageProps = {
  word: Word
  searchValue: string
  semanticGaps: boolean
  hierarchyColor: string
  relatedColor: string
  onSearchValueChange: (value: string) => void
  onSearch: () => void
  onOpenSettings: () => void
  onOpenHelp: () => void
  onOpenWord: (wordId: string) => void
  onOpenGroups: () => void
  onOpenHome: () => void
}

function MapPage({
  word,
  searchValue,
  semanticGaps,
  hierarchyColor,
  relatedColor,
  onSearchValueChange,
  onSearch,
  onOpenSettings,
  onOpenHelp,
  onOpenWord,
  onOpenGroups,
  onOpenHome,
}: MapPageProps) {
  return (
    <section className="page map-page has-footer">
      <div className="map-stage">
        <Wordmap
          focusWord={word}
          onSelectWord={onOpenWord}
          showSemanticGaps={semanticGaps}
          hierarchyColor={hierarchyColor}
          relatedColor={relatedColor}
        />

        <div className="map-top-bar">
          <form
            className="search-form map-search-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch()
            }}
          >
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Search for an English or Cree word"
            />
            <button type="submit" className="search-submit search-submit-inline" aria-label="Search">
              <SearchIcon />
            </button>
          </form>

          <div className="page-header-actions map-header-actions">
            <CircleIconButton label="Help" onClick={onOpenHelp}>
              <HelpIcon />
            </CircleIconButton>
            <CircleIconButton label="Settings" onClick={onOpenSettings}>
              <SettingsIcon />
            </CircleIconButton>
          </div>
        </div>
      </div>

      <FooterNav onOpenGroups={onOpenGroups} onOpenHome={onOpenHome} />
    </section>
  )
}

type WordDetailPageProps = {
  word: Word
  relatedWords: Word[]
  groups: WordGroup[]
  selectedGroupId: string
  noteValue: string
  matchScore: number
  onBack: () => void
  onOpenSettings: () => void
  onSelectGroup: (groupId: string) => void
  onNoteChange: (value: string) => void
  onOpenGroups: () => void
  onOpenHome: () => void
}

function WordDetailPage({
  word,
  relatedWords,
  groups,
  selectedGroupId,
  noteValue,
  matchScore,
  onBack,
  onOpenSettings,
  onSelectGroup,
  onNoteChange,
  onOpenGroups,
  onOpenHome,
}: WordDetailPageProps) {
  return (
    <section className="page detail-page has-footer">
      <div className="page-header">
        <IconButton label="Back" onClick={onBack}>
          <BackIcon />
        </IconButton>

        <CircleIconButton label="Settings" onClick={onOpenSettings}>
          <SettingsIcon />
        </CircleIconButton>
      </div>

      <div className="chip-row">
        <WordChip tone="english" text={getWordLabel(word, 'english')} />
        <WordChip tone="cree" text={getWordLabel(word, 'cree')} />
      </div>

      <div className="word-art-panel">
        <WordArtwork word={word} />
      </div>

      <div className="info-panel">
        <strong>{word.type}</strong>
        <p>{word.info}</p>

        {relatedWords.length > 0 ? (
          <>
            <span className="info-label">{getWordLabel(word, 'cree')} connects to:</span>
            <ul className="info-list">
              {relatedWords.map((relatedWord) => (
                <li key={relatedWord.id}>{getWordLabel(relatedWord)}</li>
              ))}
            </ul>
          </>
        ) : null}

        <p>
          Cree to English match: <strong>{matchScore}%</strong>
        </p>
      </div>

      <div className="group-picker">
        <span>Add to group?</span>
        <select value={selectedGroupId} onChange={(event) => onSelectGroup(event.target.value)}>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <label className="notes-panel">
        <span>Notes:</span>
        <textarea
          value={noteValue}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="Add pronunciation notes, examples, or classroom reminders."
        />
      </label>

      <FooterNav onOpenGroups={onOpenGroups} onOpenHome={onOpenHome} />
    </section>
  )
}

type SettingsPageProps = {
  semanticGaps: boolean
  fontSize: number
  contrastColor: string
  hierarchyColor: string
  relatedColor: string
  onBack: () => void
  onToggleSemanticGaps: () => void
  onFontSizeChange: (value: number) => void
  onSelectContrastColor: (value: string) => void
  onSelectHierarchyColor: (value: string) => void
  onSelectRelatedColor: (value: string) => void
  onLogOut: () => void
  onOpenGroups: () => void
  onOpenHome: () => void
}

function SettingsPage({
  semanticGaps,
  fontSize,
  contrastColor,
  hierarchyColor,
  relatedColor,
  onBack,
  onToggleSemanticGaps,
  onFontSizeChange,
  onSelectContrastColor,
  onSelectHierarchyColor,
  onSelectRelatedColor,
  onLogOut,
  onOpenGroups,
  onOpenHome,
}: SettingsPageProps) {
  return (
    <section className="page settings-page has-footer">
      <div className="page-header">
        <IconButton label="Back" onClick={onBack}>
          <BackIcon />
        </IconButton>

        <div className="settings-title">Settings</div>
      </div>

      <div className="settings-card toggle-card">
        <span>Semantic Gaps</span>
        <button
          type="button"
          className={`toggle-switch ${semanticGaps ? 'toggle-switch-on' : ''}`}
          onClick={onToggleSemanticGaps}
          aria-pressed={semanticGaps}
        >
          <span>{semanticGaps ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="settings-card colors-card">
        <span>Connection Colors</span>

        <div className="swatch-row">
          <div className="swatch-copy">
            <strong>Color 1</strong>
            <small>Synonyms / Antonyms</small>
          </div>
          <div className="swatch-list">
            {semanticSwatches.map((swatch) => (
              <SwatchButton
                key={`contrast-${swatch.label}`}
                swatch={swatch}
                selected={swatch.value === contrastColor}
                onSelect={onSelectContrastColor}
              />
            ))}
          </div>
        </div>

        <div className="swatch-row">
          <div className="swatch-copy">
            <strong>Color 2</strong>
            <small>Hypernyms / Hyponyms</small>
          </div>
          <div className="swatch-list">
            {semanticSwatches.map((swatch) => (
              <SwatchButton
                key={`hierarchy-${swatch.label}`}
                swatch={swatch}
                selected={swatch.value === hierarchyColor}
                onSelect={onSelectHierarchyColor}
              />
            ))}
          </div>
        </div>

        <div className="swatch-row">
          <div className="swatch-copy">
            <strong>Color 3</strong>
            <small>Related / Associative</small>
          </div>
          <div className="swatch-list">
            {semanticSwatches.map((swatch) => (
              <SwatchButton
                key={`related-${swatch.label}`}
                swatch={swatch}
                selected={swatch.value === relatedColor}
                onSelect={onSelectRelatedColor}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="setting-row">
          <span>Text Size</span>
          <div className="font-slider">
            <span className="font-small">A</span>
            <input
              type="range"
              min="16"
              max="24"
              step="1"
              value={fontSize}
              onChange={(event) => onFontSizeChange(Number(event.target.value))}
            />
            <span className="font-large">A</span>
          </div>
        </div>
      </div>

      <div className="settings-card password-card">
        <strong>Change Password</strong>

        <div className="password-grid">
          <label className="field-label compact-field">
            <span>Old Password:</span>
            <input type="password" defaultValue="********" />
          </label>

          <label className="field-label compact-field">
            <span>New Password:</span>
            <input type="password" defaultValue="**********" />
          </label>
        </div>

        <div className="password-grid password-grid-reset">
          <label className="field-label compact-field">
            <span>Confirm Password:</span>
            <input type="password" defaultValue="**********" />
          </label>

          <button type="button" className="danger-button">
            Submit
          </button>
        </div>
      </div>

      <button type="button" className="logout-button" onClick={onLogOut}>
        Log Out
      </button>

      <FooterNav onOpenGroups={onOpenGroups} onOpenHome={onOpenHome} />
    </section>
  )
}

type HelpPageProps = {
  activeSection: HelpSection
  contrastColor: string
  hierarchyColor: string
  relatedColor: string
  onBack: () => void
  onSelectSection: (section: HelpSection) => void
  onOpenGroups: () => void
  onOpenHome: () => void
}

function HelpPage({
  activeSection,
  contrastColor,
  hierarchyColor,
  relatedColor,
  onBack,
  onSelectSection,
  onOpenGroups,
  onOpenHome,
}: HelpPageProps) {
  const tabs: Array<{ id: HelpSection; label: string }> = [
    { id: 'how', label: 'How to use' },
    { id: 'legend', label: 'Legend' },
    { id: 'web', label: 'Word Web' },
    { id: 'groups', label: 'Groups' },
    { id: 'about', label: 'About Us' },
  ]

  return (
    <section className="page help-page has-footer">
      <div className="page-header">
        <IconButton label="Back" onClick={onBack}>
          <BackIcon />
        </IconButton>

        <div className="settings-title">Help</div>
      </div>

      <div className="help-tab-grid">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`help-tab ${activeSection === tab.id ? 'help-tab-active' : ''}`}
            onClick={() => onSelectSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="help-sheet">
        {activeSection === 'how' ? (
          <>
            <p>
              Vocabulary Explorer helps you understand how English and Cree words connect.
            </p>
            <p>
              Start on the Home page to search for a word, then open the Word Web to see nearby
              meanings and relationships.
            </p>
            <p>
              Tap any node in the web to open the detailed word page, where you can review the word,
              add notes, and place it into a group.
            </p>
            <p>
              Use Groups to organize saved words for lesson plans, revision, or classroom activities.
            </p>
          </>
        ) : null}

        {activeSection === 'legend' ? (
          <>
            <div className="help-legend-shapes">
              <div className="help-shape help-shape-both">English &amp; Cree</div>
              <div className="help-shape help-shape-cree">Cree Only</div>
              <div className="help-shape help-shape-english">English Only</div>
            </div>

            <p>
              Rounded boxes show words available in both languages. Diamonds show Cree-only words,
              and circles show English-only words.
            </p>

            <div className="help-connection-list">
              <div className="help-connection-item">
                <span className="help-connection-line" style={{ ['--sample-color' as string]: contrastColor }} />
                <span>Color 1: synonyms / antonyms</span>
              </div>
              <div className="help-connection-item">
                <span
                  className="help-connection-line help-connection-line-arrow"
                  style={{ ['--sample-color' as string]: hierarchyColor }}
                />
                <span>Color 2: hypernyms / hyponyms</span>
              </div>
              <div className="help-connection-item">
                <span
                  className="help-connection-line help-connection-line-dashed"
                  style={{ ['--sample-color' as string]: relatedColor }}
                />
                <span>Color 3: related / associative links</span>
              </div>
            </div>

            <p>
              In the Word Web, arrows indicate hierarchical parent-to-child links. Dashed lines
              mark related words that are connected but not part of that hierarchy.
            </p>
          </>
        ) : null}

        {activeSection === 'web' ? (
          <>
            <p>
              The Word Web is the core feature of the app. It shows semantic connections between
              words in a single interactive view.
            </p>
            <p>
              The searched word is emphasized so it is easier to track, while connected nodes help
              you compare parents, children, and other related terms.
            </p>
            <p>
              Tap any node to open its detail page and read more information, add notes, or save it
              into a group.
            </p>
          </>
        ) : null}

        {activeSection === 'groups' ? (
          <>
            <p>Groups are how you organize words you want to keep together.</p>
            <p>Groups can be used for lesson planning, study notes, and custom word collections.</p>
            <p>
              You can create and delete groups, then open each group to review the saved words and
              add notes.
            </p>
          </>
        ) : null}

        {activeSection === 'about' ? (
          <>
            <p>
              Vocabulary Explorer was developed for learning and exploring semantic connections
              between English and Cree words.
            </p>
            <p>
              The concept is based on work associated with the Alberta Language Technology Lab at
              the University of Alberta, with a focus on Indigenous language technology and language
              learning.
            </p>
            <p>
              This prototype is designed to make vocabulary relationships easier to search, browse,
              and organize on mobile.
            </p>
          </>
        ) : null}
      </div>

      <FooterNav onOpenGroups={onOpenGroups} onOpenHome={onOpenHome} />
    </section>
  )
}

type GroupsPageProps = {
  groups: WordGroup[]
  selectedGroup?: WordGroup
  groupWords: Word[]
  groupsView: 'overview' | 'detail'
  groupSearchValue: string
  newGroupName: string
  groupWordSearch: string
  showCreateGroupModal: boolean
  showAddWordsModal: boolean
  addableWords: Word[]
  onBack: () => void
  onOpenGroup: (groupId: string) => void
  onOpenWord: (wordId: string) => void
  onGroupSearchChange: (value: string) => void
  onNewGroupNameChange: (value: string) => void
  onOpenCreateGroup: () => void
  onCloseCreateGroup: () => void
  onCreateGroup: () => void
  onOpenAddWords: () => void
  onCloseAddWords: () => void
  onGroupWordSearchChange: (value: string) => void
  onAddWord: (wordId: string) => void
  onRemoveWord: (wordId: string) => void
  onGroupNotesChange: (value: string) => void
  onDeleteGroup: () => void
  onOpenGroups: () => void
  onOpenHome: () => void
}

function GroupsPage({
  groups,
  selectedGroup,
  groupWords,
  groupsView,
  groupSearchValue,
  newGroupName,
  groupWordSearch,
  showCreateGroupModal,
  showAddWordsModal,
  addableWords,
  onBack,
  onOpenGroup,
  onOpenWord,
  onGroupSearchChange,
  onNewGroupNameChange,
  onOpenCreateGroup,
  onCloseCreateGroup,
  onCreateGroup,
  onOpenAddWords,
  onCloseAddWords,
  onGroupWordSearchChange,
  onAddWord,
  onRemoveWord,
  onGroupNotesChange,
  onDeleteGroup,
  onOpenGroups,
  onOpenHome,
}: GroupsPageProps) {
  const isDetailView = groupsView === 'detail' && selectedGroup

  return (
    <section className="page groups-page has-footer">
      {!isDetailView ? (
        <>
          <div className="groups-top-bar">
            <IconButton label="Back" onClick={onOpenHome}>
              <BackIcon />
            </IconButton>

            <form className="search-form groups-search-form" onSubmit={(event) => event.preventDefault()}>
              <input
                type="text"
                value={groupSearchValue}
                onChange={(event) => onGroupSearchChange(event.target.value)}
                placeholder="Search Groups"
              />
              <button type="button" className="search-submit search-submit-inline" aria-label="Search groups">
                <SearchIcon />
              </button>
            </form>
          </div>

          <div className="groups-overview-list">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className="group-overview-card"
                onClick={() => onOpenGroup(group.id)}
              >
                {group.name} [{group.wordIds.length}]
              </button>
            ))}
          </div>

          <button type="button" className="create-group-button" onClick={onOpenCreateGroup}>
            Create Group +
          </button>
        </>
      ) : (
        <>
            <div className="groups-top-bar">
            <IconButton label="Back" onClick={onBack}>
              <BackIcon />
            </IconButton>

            <div className="group-detail-title">{selectedGroup.name}</div>
          </div>

          <div className="group-detail-list">
            {groupWords.map((word) => (
              <div key={word.id} className="group-word-row">
                <button type="button" className="group-word-open" onClick={() => onOpenWord(word.id)}>
                  {getWordLabel(word)}
                </button>
                <button
                  type="button"
                  className="group-remove-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveWord(word.id)
                  }}
                  aria-label={`Remove ${getWordLabel(word)}`}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="create-group-button add-words-button" onClick={onOpenAddWords}>
            Add More Words +
          </button>

          <label className="group-notes">
            <span>Notes:</span>
            <textarea
              value={selectedGroup.notes}
              onChange={(event) => onGroupNotesChange(event.target.value)}
              placeholder="Tap here to add notes..."
            />
          </label>

          <button type="button" className="delete-group-button" onClick={onDeleteGroup}>
            Delete Group
          </button>
        </>
      )}

      {showCreateGroupModal ? (
        <div className="group-modal-backdrop">
          <div className="group-modal-card">
            <div className="group-modal-header">
              <strong>Add Group</strong>
              <button type="button" className="group-remove-button modal-close-button" onClick={onCloseCreateGroup}>
                X
              </button>
            </div>

            <input
              type="text"
              value={newGroupName}
              onChange={(event) => onNewGroupNameChange(event.target.value)}
              placeholder="Group Name..."
            />

            <button
              type="button"
              className="group-modal-action"
              onClick={onCreateGroup}
              disabled={!newGroupName.trim()}
            >
              Add Group
            </button>
          </div>
        </div>
      ) : null}

      {showAddWordsModal && selectedGroup ? (
        <div className="group-modal-backdrop">
          <div className="group-modal-card group-modal-card-wide">
            <div className="group-modal-header">
              <strong>Add Words</strong>
              <button type="button" className="group-remove-button modal-close-button" onClick={onCloseAddWords}>
                X
              </button>
            </div>

            <input
              type="text"
              value={groupWordSearch}
              onChange={(event) => onGroupWordSearchChange(event.target.value)}
              placeholder="Search words..."
            />

            <div className="group-add-list">
              {addableWords.map((word) => (
                <button
                  key={word.id}
                  type="button"
                  className="group-add-word"
                  onClick={() => onAddWord(word.id)}
                >
                  <span>{getWordLabel(word)}</span>
                  <small>{getWordLabel(word, 'cree')}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <FooterNav active="groups" onOpenGroups={onOpenGroups} onOpenHome={onOpenHome} />
    </section>
  )
}

type FooterNavProps = {
  active?: 'home' | 'groups'
  onOpenGroups: () => void
  onOpenHome: () => void
}

function FooterNav({ active, onOpenGroups, onOpenHome }: FooterNavProps) {
  return (
    <nav className="footer-nav" aria-label="Primary">
      <button
        type="button"
        className={`footer-tab ${active === 'groups' ? 'footer-tab-active' : ''}`}
        onClick={onOpenGroups}
      >
        Groups
      </button>
      <button
        type="button"
        className={`footer-tab ${active === 'home' ? 'footer-tab-active' : ''}`}
        onClick={onOpenHome}
      >
        Home
      </button>
    </nav>
  )
}

type WordChipProps = {
  tone: 'english' | 'cree'
  text: string
}

function WordChip({ tone, text }: WordChipProps) {
  return (
    <div className={`word-chip word-chip-${tone}`}>
      <span>{text}</span>
      <button type="button" className="speaker-button" aria-label={`Play ${text}`}>
        <SpeakerIcon />
      </button>
    </div>
  )
}

type SwatchButtonProps = {
  swatch: Swatch
  selected: boolean
  onSelect: (value: string) => void
}

function SwatchButton({ swatch, selected, onSelect }: SwatchButtonProps) {
  return (
    <button
      type="button"
      className={`swatch-button ${selected ? 'swatch-button-selected' : ''}`}
      style={{ backgroundColor: swatch.value }}
      onClick={() => onSelect(swatch.value)}
      aria-label={swatch.label}
    />
  )
}

type CircleIconButtonProps = {
  label: string
  onClick: () => void
  children: ReactNode
}

function CircleIconButton({ label, onClick, children }: CircleIconButtonProps) {
  return (
    <button type="button" className="circle-icon-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

type IconButtonProps = {
  label: string
  onClick: () => void
  children: ReactNode
}

function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button type="button" className="icon-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

type WordArtworkProps = {
  word: Word
}

function WordArtwork({ word }: WordArtworkProps) {
  if (word.id === '_dog') {
    return (
      <svg viewBox="0 0 320 210" className="word-art" role="img" aria-label="Dog illustration">
        <defs>
          <linearGradient id="dogBg" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#cfb38d" />
            <stop offset="100%" stopColor="#8b694a" />
          </linearGradient>
        </defs>
        <rect width="320" height="210" rx="24" fill="url(#dogBg)" />
        <circle cx="160" cy="104" r="66" fill="#f0d1a6" />
        <path d="M118 84C101 62 84 61 73 88C84 114 109 118 126 102Z" fill="#967052" />
        <path d="M202 84C219 62 236 61 247 88C236 114 211 118 194 102Z" fill="#967052" />
        <ellipse cx="133" cy="96" rx="8" ry="11" fill="#3a2a20" />
        <ellipse cx="187" cy="96" rx="8" ry="11" fill="#3a2a20" />
        <ellipse cx="160" cy="124" rx="18" ry="12" fill="#3a2a20" />
        <path d="M147 145C156 158 164 158 173 145" fill="none" stroke="#3a2a20" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="160" cy="151" rx="12" ry="18" fill="#ff92a4" />
      </svg>
    )
  }

  return (
    <div className="generic-artwork">
      <span>{getWordLabel(word)}</span>
      <small>{getWordLabel(word, 'cree')}</small>
    </div>
  )
}

function FancyWebmapArtwork() {
  return (
    <svg viewBox="0 0 360 320" className="fancy-webmap-art" role="img" aria-label="Decorative word web">
      <defs>
        <linearGradient id="webAmbient" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(163, 214, 233, 0.12)" />
          <stop offset="100%" stopColor="rgba(92, 111, 185, 0.03)" />
        </linearGradient>
        <radialGradient id="webGlowA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(176, 222, 255, 0.28)" />
          <stop offset="100%" stopColor="rgba(176, 222, 255, 0)" />
        </radialGradient>
        <radialGradient id="webGlowB" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(206, 181, 255, 0.22)" />
          <stop offset="100%" stopColor="rgba(206, 181, 255, 0)" />
        </radialGradient>
        <linearGradient id="webNodeFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(248,250,252,0.88)" />
          <stop offset="100%" stopColor="rgba(199,210,223,0.34)" />
        </linearGradient>
        <linearGradient id="webNodeEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.44)" />
          <stop offset="100%" stopColor="rgba(188,203,220,0.14)" />
        </linearGradient>
        <linearGradient id="webLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(244,247,252,0.68)" />
          <stop offset="100%" stopColor="rgba(178,196,218,0.18)" />
        </linearGradient>
        <filter id="webGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <rect width="360" height="320" fill="url(#webAmbient)" />
      <circle cx="110" cy="96" r="92" fill="url(#webGlowA)" filter="url(#softBlur)" />
      <circle cx="252" cy="204" r="104" fill="url(#webGlowB)" filter="url(#softBlur)" />

      <g opacity="0.92">
        <path d="M178 48L112 118" stroke="url(#webLine)" strokeWidth="4" strokeLinecap="round" />
        <path d="M178 48L208 176" stroke="url(#webLine)" strokeWidth="4" strokeLinecap="round" />
        <path d="M178 48L284 124" stroke="url(#webLine)" strokeWidth="4" strokeLinecap="round" />
        <path d="M112 118L208 176" stroke="url(#webLine)" strokeWidth="4" strokeLinecap="round" />
        <path d="M112 118L284 124" stroke="url(#webLine)" strokeWidth="4" strokeLinecap="round" />
        <path d="M112 118L74 274" stroke="url(#webLine)" strokeWidth="4" strokeLinecap="round" />
        <path d="M208 176L284 124" stroke="url(#webLine)" strokeWidth="3.6" strokeLinecap="round" />
        <path d="M208 176L252 230" stroke="url(#webLine)" strokeWidth="3.6" strokeLinecap="round" />
        <path d="M284 124L314 72" stroke="url(#webLine)" strokeWidth="3.2" strokeLinecap="round" opacity="0.5" />
        <path d="M178 48L66 78" stroke="url(#webLine)" strokeWidth="3.2" strokeLinecap="round" opacity="0.42" />
        <path d="M74 274L144 242" stroke="url(#webLine)" strokeWidth="3" strokeLinecap="round" opacity="0.36" />
        <path d="M252 230L312 258" stroke="url(#webLine)" strokeWidth="3" strokeLinecap="round" opacity="0.36" />
        <path d="M66 78C106 34 162 16 228 26" fill="none" stroke="rgba(210,224,241,0.14)" strokeWidth="2.4" strokeDasharray="5 8" />
      </g>

      <g filter="url(#webGlow)">
        <ellipse cx="178" cy="48" rx="38" ry="21" fill="url(#webNodeFill)" stroke="url(#webNodeEdge)" strokeWidth="2" />
        <ellipse cx="112" cy="118" rx="40" ry="22" fill="url(#webNodeFill)" stroke="url(#webNodeEdge)" strokeWidth="2" />
        <ellipse cx="284" cy="124" rx="42" ry="23" fill="url(#webNodeFill)" stroke="url(#webNodeEdge)" strokeWidth="2" />
        <ellipse cx="208" cy="176" rx="38" ry="21" fill="url(#webNodeFill)" stroke="url(#webNodeEdge)" strokeWidth="2" />
        <ellipse cx="74" cy="274" rx="42" ry="23" fill="url(#webNodeFill)" stroke="rgba(244,200,115,0.58)" strokeDasharray="5 5" strokeWidth="2" />
        <ellipse cx="252" cy="230" rx="27" ry="15" fill="rgba(241,246,250,0.42)" stroke="rgba(226,235,244,0.16)" strokeWidth="1.5" />
        <ellipse cx="314" cy="72" rx="19" ry="11" fill="rgba(241,246,250,0.28)" stroke="rgba(226,235,244,0.12)" strokeWidth="1.2" />
        <ellipse cx="66" cy="78" rx="16" ry="9" fill="rgba(241,246,250,0.24)" stroke="rgba(226,235,244,0.1)" strokeWidth="1.1" />
        <circle cx="149" cy="242" r="7" fill="rgba(231,240,247,0.3)" />
        <circle cx="311" cy="257" r="6" fill="rgba(231,240,247,0.24)" />
      </g>

      <g opacity="0.2">
        <circle cx="178" cy="48" r="56" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.4" />
        <circle cx="208" cy="176" r="68" fill="none" stroke="rgba(207,219,236,0.12)" strokeWidth="1.2" />
      </g>
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 32 32" className="svg-icon" aria-hidden="true">
      <path d="M19 7L9 16L19 25" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 16H25" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 32 32" className="svg-icon" aria-hidden="true">
      <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M20 20L27 27" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 10V18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 14H18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 32 32" className="svg-icon" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.8" />
      <path d="M12.5 12.5C13 10.4 14.7 9 17 9C19.6 9 21.5 10.7 21.5 13C21.5 14.8 20.5 15.9 18.5 17.1C17.4 17.7 17 18.3 17 19.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="17" cy="23.4" r="1.8" fill="currentColor" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 32 32" className="svg-icon" aria-hidden="true">
      <circle cx="16" cy="16" r="4.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 5.2V9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 23V26.8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M5.2 16H9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 16H26.8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8.3 8.3L10.9 10.9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21.1 21.1L23.7 23.7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8.3 23.7L10.9 21.1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21.1 10.9L23.7 8.3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 32 32" className="svg-icon speaker-icon" aria-hidden="true">
      <path d="M7 13H12L18 8V24L12 19H7Z" fill="currentColor" />
      <path d="M21 11C23 12.4 24 14 24 16C24 18 23 19.6 21 21" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23.5 8C27 10.5 28.5 13 28.5 16C28.5 19 27 21.5 23.5 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export default App
