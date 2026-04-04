import { frontendWordList } from './WordData'

export interface Word {
  id: string
  english: string
  cree: string
  hypo: string[]
  related: string[]
  type: string
  info: string
}

type RawWord = {
  id: string
  english?: string | null
  cree?: string | null
  hypo?: string[] | null
  related?: string[] | null
  type?: string | null
  info?: string | null
}

const rawWords = frontendWordList as RawWord[]

function normalizeWord(rawWord: RawWord): Word {
  const english = rawWord.english?.trim() ?? ''
  const cree = rawWord.cree?.trim() ?? ''

  return {
    id: rawWord.id,
    english,
    cree,
    hypo: Array.isArray(rawWord.hypo) ? rawWord.hypo : [],
    related: Array.isArray(rawWord.related) ? rawWord.related : [],
    type: rawWord.type?.trim() || 'Vocabulary',
    info:
      rawWord.info?.trim() ||
      `${english || cree || rawWord.id.replace(/^_/, '')} is part of the vocabulary explorer demo.`,
  }
}

const normalizedWords = rawWords.map(normalizeWord)

function toSearchable(value: string): string {
  return value.trim().toLowerCase()
}

export function getWordById(wordId: string): Word | undefined {
  return normalizedWords.find((word) => word.id === wordId)
}

export function getWordLabel(word: Word, preferredLanguage: 'english' | 'cree' = 'english'): string {
  if (preferredLanguage === 'english') {
    return word.english || word.cree || word.id.replace(/^_/, '')
  }

  return word.cree || word.english || word.id.replace(/^_/, '')
}

export function getNodeShapeLabel(word: Word): 'Rounded box' | 'Diamond' | 'Circle' {
  if (word.english && word.cree) {
    return 'Rounded box'
  }

  if (word.cree && !word.english) {
    return 'Diamond'
  }

  return 'Circle'
}

export function getNodeShapeMeaning(word: Word): string {
  const shape = getNodeShapeLabel(word)

  if (shape === 'Rounded box') {
    return 'Rounded box: this word exists in both English and Cree.'
  }

  if (shape === 'Diamond') {
    return 'Diamond: this word exists only in Cree.'
  }

  return 'Circle: this word exists only in English.'
}

export function findWordByQuery(query: string): Word | undefined {
  const searchTerm = toSearchable(query)

  if (!searchTerm) {
    return undefined
  }

  return normalizedWords.find((word) => {
    const values = [word.english, word.cree, word.id.replace(/^_/, '')]
    return values.some((value) => toSearchable(value).includes(searchTerm))
  })
}

export function getChildWords(wordId: string): Word[] {
  const word = getWordById(wordId)

  if (!word) {
    return []
  }

  return word.hypo
    .map((childId) => getWordById(childId))
    .filter((child): child is Word => Boolean(child))
}

export function getParentWords(wordId: string): Word[] {
  return normalizedWords.filter((word) => word.hypo.includes(wordId))
}

export function getSiblingWords(wordId: string): Word[] {
  const siblingMap = new Map<string, Word>()

  getParentWords(wordId).forEach((parent) => {
    parent.hypo
      .filter((siblingId) => siblingId !== wordId)
      .map((siblingId) => getWordById(siblingId))
      .filter((sibling): sibling is Word => Boolean(sibling))
      .forEach((sibling) => {
        siblingMap.set(sibling.id, sibling)
      })
  })

  return [...siblingMap.values()]
}

export default class Corpus {
  private static _instance: Corpus

  wordData: Word[]

  private constructor() {
    this.wordData = normalizedWords
  }

  public static get Words() {
    const instance = this._instance || (this._instance = new this())
    return instance.wordData
  }
}
