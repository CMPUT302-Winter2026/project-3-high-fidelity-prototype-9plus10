import { useMemo } from 'react'
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

const previewPositions: Point[] = [
  { x: 178, y: 42 },
  { x: 88, y: 124 },
  { x: 252, y: 128 },
  { x: 162, y: 170 },
  { x: 54, y: 282 },
]

function buildMapElements(showSemanticGaps: boolean, focusWordId: string): ElementDefinition[] {
  const words = Corpus.Words

  const nodes: ElementDefinition[] = words.map((word) => ({
    data: {
      id: word.id,
      wordId: word.id,
      label: getWordLabel(word),
      sublabel: getWordLabel(word, 'cree'),
      isFocus: word.id === focusWordId ? 'true' : 'false',
      hasGap: showSemanticGaps && (!word.english || !word.cree) ? 'true' : 'false',
    },
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
  const elements = useMemo(
    () => buildMapElements(showSemanticGaps, focusWord.id),
    [focusWord.id, showSemanticGaps],
  )

  return (
    <div className="word-map-canvas word-map-canvas-full">
      <CytoscapeComponent
        key={`${focusWord.id}-${showSemanticGaps ? 'gaps' : 'plain'}`}
        elements={elements}
        layout={{ name: 'cose', padding: 36, animate: false }}
        stylesheet={mapStylesheet}
        cy={(cy: Core) => {
          cy.removeAllListeners()
          cy.minZoom(0.7)
          cy.maxZoom(2.6)

          cy.on('tap', 'node', (event) => {
            const selectedId = event.target.data('wordId') as string | undefined

            if (selectedId) {
              onSelectWord(selectedId)
            }
          })

          cy.one('layoutstop', () => {
            const focusNode = cy.$id(focusWord.id)

            if (focusNode.length > 0) {
              cy.animate(
                {
                  center: { eles: focusNode },
                  zoom: 1.25,
                },
                {
                  duration: 240,
                },
              )
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
      width: 'label',
      height: 'label',
      padding: '12px',
      shape: 'round-rectangle',
      'background-color': '#f7f4ef',
      color: '#11243c',
      'font-size': 17,
      'font-weight': 600,
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'border-width': 3,
      'border-color': '#d9d4cb',
      'line-height': 1,
    },
  },
  {
    selector: 'node[isFocus = "true"]',
    style: {
      'background-color': '#ffffff',
      'border-color': '#97d3d0',
      'border-width': 4,
    },
  },
  {
    selector: 'node[hasGap = "true"]',
    style: {
      'border-style': 'dashed',
      'border-color': '#f4c873',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 3,
      'line-color': '#c2c2c2',
      'target-arrow-shape': 'none',
      'curve-style': 'bezier',
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
      'background-color': '#f7f4ef',
      'border-width': 2,
      'border-color': '#d9d4cb',
      color: 'transparent',
    },
  },
  {
    selector: 'node[hasGap = "true"]',
    style: {
      'border-style': 'dashed',
      'border-color': '#f4c873',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 3,
      'line-color': '#c7c7c7',
      'target-arrow-shape': 'none',
      'curve-style': 'straight',
    },
  },
]
