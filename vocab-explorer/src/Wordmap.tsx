import { useEffect, useMemo, useRef } from 'react'
import type { Core, ElementDefinition, StylesheetJsonBlock } from 'cytoscape'
import CytoscapeComponent from 'react-cytoscapejs'
import Corpus, { getWordLabel, type Word } from './WordType'

type WordmapProps = {
  focusWord: Word
  onSelectWord: (wordId: string) => void
  showSemanticGaps: boolean
}

type WordmapPreviewProps = {
  showSemanticGaps: boolean
}

type Point = {
  x: number
  y: number
}

const mapPositions: Record<string, Point> = {
  _mamahtawisiwin: { x: 72, y: 112 },
  _animal: { x: 250, y: 112 },
  _dog: { x: 170, y: 254 },
  _panda: { x: 316, y: 188 },
  _bark: { x: 12, y: 392 },
  _puppy: { x: 288, y: 382 },
}

const previewPositions: Point[] = [
  { x: 178, y: 42 },
  { x: 88, y: 124 },
  { x: 252, y: 128 },
  { x: 162, y: 170 },
  { x: 54, y: 282 },
]

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

function buildMapElements(showSemanticGaps: boolean, focusWordId: string): ElementDefinition[] {
  const words = Corpus.Words

  const nodes: ElementDefinition[] = words.map((word) => ({
    data: {
      id: word.id,
      wordId: word.id,
      label: buildNodeLabel(word),
      variant: getNodeVariant(word.id),
      isFocus: word.id === focusWordId ? 'true' : 'false',
      hasGap: showSemanticGaps && (!word.english || !word.cree) ? 'true' : 'false',
    },
    position: mapPositions[word.id] ?? { x: 168, y: 220 },
  }))

  const edges: ElementDefinition[] = words.flatMap((word) =>
    word.hypo.map((childId) => ({
      data: {
        id: `${word.id}-${childId}`,
        source: word.id,
        target: childId,
      },
    })),
  )

  return [...nodes, ...edges]
}

function buildPreviewElements(showSemanticGaps: boolean): ElementDefinition[] {
  const words = Corpus.Words.slice(0, previewPositions.length)
  const visibleIds = new Set(words.map((word) => word.id))

  const nodes: ElementDefinition[] = words.map((word, index) => ({
    data: {
      id: word.id,
      wordId: word.id,
      label: '',
      hasGap: showSemanticGaps && (!word.english || !word.cree) ? 'true' : 'false',
    },
    position: previewPositions[index],
  }))

  const edges: ElementDefinition[] = words.flatMap((word) =>
    word.hypo
      .filter((childId) => visibleIds.has(childId))
      .map((childId) => ({
        data: {
          id: `preview-${word.id}-${childId}`,
          source: word.id,
          target: childId,
        },
      })),
  )

  return [...nodes, ...edges]
}

export default function Wordmap({ focusWord, onSelectWord, showSemanticGaps }: WordmapProps) {
  const cyRef = useRef<Core | null>(null)
  const elements = useMemo(
    () => buildMapElements(showSemanticGaps, focusWord.id),
    [focusWord.id, showSemanticGaps],
  )

  useEffect(() => {
    const cy = cyRef.current

    if (!cy) {
      return
    }

    const frame = requestAnimationFrame(() => {
      cy.resize()
      cy.fit(cy.elements(), 12)
      const focusNode = cy.$id(focusWord.id)

      if (focusNode.length > 0) {
        cy.center(focusNode)
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [focusWord.id, showSemanticGaps])

  return (
    <div className="word-map-canvas word-map-canvas-full">
      <CytoscapeComponent
        key={`${focusWord.id}-${showSemanticGaps ? 'gaps' : 'plain'}`}
        elements={elements}
        layout={{ name: 'preset', fit: true, padding: 18, animate: false }}
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
          })

          requestAnimationFrame(() => {
            cy.resize()
            cy.fit(cy.elements(), 12)
            const focusNode = cy.$id(focusWord.id)

            if (focusNode.length > 0) {
              cy.center(focusNode)
            }
          })
        }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}

export function WordmapPreview({ showSemanticGaps }: WordmapPreviewProps) {
  const elements = useMemo(() => buildPreviewElements(showSemanticGaps), [showSemanticGaps])

  return (
    <div className="word-map-canvas word-map-canvas-preview" aria-hidden="true">
      <CytoscapeComponent
        elements={elements}
        layout={{ name: 'preset', fit: true, padding: 10, animate: false }}
        stylesheet={previewStylesheet}
        cy={(cy: Core) => {
          cy.removeAllListeners()
          cy.userZoomingEnabled(false)
          cy.userPanningEnabled(false)
          cy.boxSelectionEnabled(false)
          cy.autoungrabify(true)
        }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}

const mapStylesheet: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      width: 108,
      height: 60,
      padding: '8px',
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
      'text-max-width': '98px',
      'line-height': 1,
      'text-outline-width': 0,
    },
  },
  {
    selector: 'node[variant = "focus"]',
    style: {
      'background-color': '#cdb8ee',
      'border-color': '#8a6bc8',
      'border-width': 5,
    },
  },
  {
    selector: 'node[variant = "ellipse"]',
    style: {
      shape: 'ellipse',
      width: 94,
      height: 54,
      'background-color': '#a7c8ec',
      'border-color': '#4e90d4',
    },
  },
  {
    selector: 'node[variant = "diamond"]',
    style: {
      shape: 'diamond',
      width: 102,
      height: 56,
      'background-color': '#dea1c4',
      'border-color': '#b96596',
      'font-size': 11,
      'text-max-width': '82px',
    },
  },
  {
    selector: 'node[isFocus = "true"]',
    style: {
      'background-color': '#cdb8ee',
      'border-color': '#8a6bc8',
      'border-width': 4,
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
      width: 3,
      'line-color': '#d6dce3',
      'target-arrow-shape': 'none',
      'curve-style': 'straight',
    },
  },
]

const previewStylesheet: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      width: 72,
      height: 36,
      shape: 'ellipse',
      'background-color': 'rgba(247, 244, 239, 0.64)',
      'border-width': 1.5,
      'border-color': 'rgba(217, 212, 203, 0.22)',
      color: 'transparent',
      opacity: 0.7,
    },
  },
  {
    selector: 'node[hasGap = "true"]',
    style: {
      'border-style': 'dashed',
      'border-color': 'rgba(244, 200, 115, 0.42)',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2.2,
      'line-color': 'rgba(231, 231, 231, 0.48)',
      'target-arrow-shape': 'none',
      'curve-style': 'straight',
      opacity: 0.62,
    },
  },
]
