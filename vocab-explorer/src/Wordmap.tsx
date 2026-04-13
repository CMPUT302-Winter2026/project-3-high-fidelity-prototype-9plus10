import { useEffect, useMemo, useRef } from 'react'
import type {  Core, ElementDefinition, StylesheetJsonBlock} from 'cytoscape'
import CytoscapeComponent from 'react-cytoscapejs'
import cola from 'cytoscape-cola'
import cytoscape from 'cytoscape'
import Corpus, { getWordById, getWordLabel, type Word } from './WordType'

cytoscape.use(cola)
type WordmapProps = {
  focusWord: Word
  onSelectWord: (wordId: string) => void
  onHoverConnection: (details: HoveredConnection | null) => void
  showSemanticGaps: boolean
  hierarchyColor: string
  relatedColor: string
  searchFocusToken: number
}


type Point = {
  x: number
  y: number
}

type SavedViewport = {
  pan: Point
  zoom: number
}

export type HoveredConnection = {
  sourceLabel: string
  targetLabel: string
  relationshipLabel: string
  relationship: 'hierarchy' | 'related'
}

const savedViewports = new Map<string, SavedViewport>()


function buildNodeLabel(word: Word): string {
  const english = word.english?.trim()
  const cree = word.cree?.trim()

  if (english && cree) {
    return `${english}\n\n${cree}`
  }

  return english || cree || getWordLabel(word)
}

function getNodeVariant(wordId: string): 'focus' | 'ellipse' | 'diamond' | 'default' {
  if (wordId === '_dog') {
    return 'focus'
  }

  if (wordId === '_panda') {
    return 'ellipse'
  }

  if (wordId === '_mamahtawisiwin') {
    return 'diamond'
  }

  return 'default'
}

function getFocusContext(wordId: string) {
  const parentIds = new Set<string>()
  const childIds = new Set<string>()

  Corpus.Words.forEach((word) => {
    if (word.id === wordId) {
      word.hypo.forEach((childId) => childIds.add(childId))
    }

    if (word.hypo.includes(wordId)) {
      parentIds.add(word.id)
    }
  })

  const contextIds = new Set([...parentIds, ...childIds])

  return { parentIds, childIds, contextIds }
}

function getEdgeRelationshipLabel(relationship: 'hierarchy' | 'related') {
  if (relationship === 'hierarchy') {
    return 'Hypernym / hyponym relationship'
  }

  return 'Related / associative relationship'
}

function isSemanticGapWord(word: Word) {
  return !word.english || !word.cree
}

function buildMapElements(showSemanticGaps: boolean, focusWordId: string): ElementDefinition[] {
  const words = showSemanticGaps ? Corpus.Words : Corpus.Words.filter((word) => !isSemanticGapWord(word))
  const visibleIds = new Set(words.map((word) => word.id))
  const { contextIds } = getFocusContext(focusWordId)

  const nodes: ElementDefinition[] = words.map((word) => ({
    data: {
      id: word.id,
      wordId: word.id,
      label: buildNodeLabel(word),
      variant: getNodeVariant(word.id),
      isFocus: word.id === focusWordId ? 'true' : 'false',
      isContext: contextIds.has(word.id) && visibleIds.has(word.id) ? 'true' : 'false',
      hasGap: showSemanticGaps && isSemanticGapWord(word) ? 'true' : 'false',
    },
  }))

    const hypoEdges: ElementDefinition[] = words.flatMap((word) =>
    word.hypo.flatMap((childId) => {
      if (!visibleIds.has(childId)) return []
      const childWord = getWordById(childId)
      return [{
        data: {
          id: `${word.id}-${childId}`,
          source: word.id,
          target: childId,
          relationship: 'hierarchy' as const,
          relationshipLabel: getEdgeRelationshipLabel('hierarchy'),
          sourceLabel: getWordLabel(word),
          targetLabel: childWord ? getWordLabel(childWord) : childId,
          isFocusConnection: word.id === focusWordId || childId === focusWordId ? 'true' : 'false',
        },
      }]
    }),
  )

    const relatedEdges: ElementDefinition[] = words.flatMap((word) =>
    word.related.flatMap((relatedId) => {
      if (!visibleIds.has(relatedId)) return []
      const relatedWord = getWordById(relatedId)
      return [{
        data: {
          id: `${word.id}-${relatedId}`,
          source: word.id,
          target: relatedId,
          relationship: 'related' as const,
          relationshipLabel: getEdgeRelationshipLabel('related'),
          sourceLabel: getWordLabel(word),
          targetLabel: relatedWord ? getWordLabel(relatedWord) : relatedId,
          isFocusConnection: word.id === focusWordId || relatedId === focusWordId ? 'true' : 'false',
        },
      }]
    }),
  )

  return [...nodes, ...hypoEdges, ...relatedEdges]
}


function syncMapViewport(cy: Core, focusWordId: string) {
  cy.resize()


  const focusNode = cy.$id(focusWordId)

  if (focusNode.length === 0) {
    cy.fit(cy.elements(), 18)
    return
  }

  // const focusCluster = focusNode.closedNeighborhood().union(focusNode)
  // cy.fit(focusCluster, zoomMode === 'search' ? 54 : 96)
  cy.center(focusNode)

  // if (zoomMode === 'search') {
  //   cy.zoom(Math.min(cy.maxZoom(), cy.zoom() * 1.22))
  //   cy.center(focusNode)
  // }

  // cy.panBy({ x: 0, y: zoomMode === 'search' ? 26 : 52 })
}

function saveMapViewport(cy: Core, viewKey: string) {
  savedViewports.set(viewKey, {
    pan: cy.pan(),
    zoom: cy.zoom(),
  })
}

function restoreMapViewport(cy: Core, viewport: SavedViewport) {
  cy.resize()
  cy.zoom(Math.max(cy.minZoom(), Math.min(cy.maxZoom(), viewport.zoom)))
  cy.pan(viewport.pan)
}

export default function Wordmap({
  focusWord,
  onSelectWord,
  onHoverConnection,
  showSemanticGaps,
  hierarchyColor,
  relatedColor,
  searchFocusToken,
}: WordmapProps) {
  const cyRef = useRef<Core | null>(null)
  const elements = useMemo(
    () => buildMapElements(showSemanticGaps, focusWord.id),
    [focusWord.id, showSemanticGaps],
  )
  const mapStylesheet = useMemo(
    () => createMapStylesheet({ hierarchyColor, relatedColor }),
    [hierarchyColor, relatedColor],
  )
  const viewKey = useMemo(
    () => `${focusWord.id}-${showSemanticGaps ? 'gaps' : 'plain'}`,
    [focusWord.id, showSemanticGaps],
  )

  function applyViewport(cy: Core) {
    const savedViewport = savedViewports.get(viewKey)
    // const hasFreshSearch = searchFocusToken > 0 && appliedSearchTokens.get(viewKey) !== searchFocusToken

    // if (hasFreshSearch) {
    //   syncMapViewport(cy, focusWord.id, 'search')
    //   appliedSearchTokens.set(viewKey, searchFocusToken)
    //   saveMapViewport(cy, viewKey)
    //   return
    // }

    if (savedViewport) {
      restoreMapViewport(cy, savedViewport)
      return
    }

    syncMapViewport(cy, focusWord.id)
    saveMapViewport(cy, viewKey)
  }

  useEffect(() => {
    const cy = cyRef.current

    if (!cy) {
      return
    }

    const frame = requestAnimationFrame(() => {
      applyViewport(cy)
    })

    return () => cancelAnimationFrame(frame)
  }, [focusWord.id, searchFocusToken, showSemanticGaps, viewKey])

  return (
    <div className="word-map-canvas word-map-canvas-full">
      <CytoscapeComponent
        key={viewKey}
        elements={elements}
        layout={{ name: 'cola',
                  infinite: false,
                  animate: true,
                  refresh: 1,
                  fit: false,
                  padding: 20,
                  edgeLength: 140,
                  avoidOverlap: true,
                  nodeSpacing: 60,
                  flow: {
                    axis: 'y',
                    minSeparation: 92,
                  },
                } as cytoscape.LayoutOptions}
        stylesheet={mapStylesheet}
        cy={(cy: Core) => {
          cyRef.current = cy
          cy.removeAllListeners()
          cy.minZoom(0.8)
          cy.maxZoom(2.4)
          cy.autoungrabify(false)

          cy.on('tap', 'node', (event) => {
            const selectedId = event.target.data('wordId') as string | undefined

            if (selectedId) {
              onSelectWord(selectedId)
            }
            saveMapViewport(cy, viewKey)
          })

          cy.on('tap', 'edge', (event) => {
            const relationshipLabel = event.target.data('relationshipLabel') as string | undefined
            const sourceLabel = event.target.data('sourceLabel') as string | undefined
            const targetLabel = event.target.data('targetLabel') as string | undefined
            const relationship = event.target.data('relationship') as 'hierarchy' | 'related' | undefined

            if (relationshipLabel && sourceLabel && targetLabel && relationship) {
              onHoverConnection({
                sourceLabel,
                targetLabel,
                relationshipLabel,
                relationship,
              })
            }
          })

          // cy.on('tap', '', () => {
          //   onHoverConnection(null)
          // })

          cy.on('pan zoom', () => {
            saveMapViewport(cy, viewKey)
          })

          requestAnimationFrame(() => {
            applyViewport(cy)
          })
        }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}


function createMapStylesheet({
  hierarchyColor,
  relatedColor,
}: {
  hierarchyColor: string
  relatedColor: string
}): StylesheetJsonBlock[] {
  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        width: "label",
        height: "label",
        "min-width": "62px",
        "min-height": "54px",
        padding: '9px',
        shape: 'round-rectangle',
        'background-color': '#ccb8eb',
        color: '#101422',
        'font-size': 12,
        'font-weight': 500,
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'border-width': 3,
        'border-color': '#9e80cb',
        'text-max-width': '64px',
        'line-height': 1.12,
        'text-outline-width': 0,
      },
    },
    {
      selector: 'node[variant = "focus"]',
      style: {
        'background-color': '#cdb8ee',
        'border-color': '#8a6bc8',
        'border-width': 5,
        'padding': '10px'
      },
    },
    {
      selector: 'node[variant = "ellipse"]',
      style: {
        shape: 'ellipse',
        width: "label",
        height: "label",
        'background-color': '#a7c8ec',
        'border-color': '#4e90d4',
      },
    },
    {
      selector: 'node[variant = "diamond"]',
      style: {
        shape: 'diamond',
        width: "label",
        height: "label",
        'background-color': '#dea1c4',
        'border-color': '#b96596',
        'font-size': 11,
        'text-max-width': '94px',
      },
    },
    {
      selector: 'node[isFocus = "true"]',
      style: {
        width: "label",
        height: "label",
        "min-width": "74px",
        "min-height": "62px",
        padding: '11px',
        'border-width': 5,
        'font-size': 14,
        'font-weight': 700,
        'text-max-width': '76px',
      },
    },
    {
      selector: 'node[isContext = "true"][isFocus = "false"]',
      style: {
        'border-width': 3.5,
        opacity: 0.96,
      },
    },
    {
      selector: 'node[isContext = "false"][isFocus = "false"]',
      style: {
        opacity: 0.72,
      },
    },
    {
      selector: 'node[hasGap = "true"]',
      style: {
        'border-style': 'solid',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 4,
        'line-color': 'rgba(214, 220, 227, 0.54)',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': 'rgba(214, 220, 227, 0.54)',
        'arrow-scale': 1.25,
        opacity: 0.7,
        'curve-style': 'bezier',
        'control-point-step-size': 60,
      },
    },
    {
      selector: 'edge[relationship = "hierarchy"]',
      style: {
        'line-color': hierarchyColor,
        'target-arrow-color': hierarchyColor,
        'target-arrow-shape': 'triangle',
      },
    },
    {
      selector: 'edge[relationship = "related"]',
      style: {
        'line-color': relatedColor,
        'curve-style': 'unbundled-bezier',
        'control-point-distance': 72,
        'control-point-weight': 0.42,
        'target-arrow-shape': 'none',
        'target-arrow-color': relatedColor,
        'line-style': 'dashed',
      },
    },
    {
      selector: 'edge[isFocusConnection = "true"]',
      style: {
        opacity: 1,
      },
    },
    {
      selector: 'edge[relationship = "related"][isFocusConnection = "true"]',
      style: {
        'target-arrow-shape': 'none',
        'line-style': 'dashed',
      },
    },
  ]
}

