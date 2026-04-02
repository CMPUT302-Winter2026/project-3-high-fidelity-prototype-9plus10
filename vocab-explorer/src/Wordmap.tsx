// boilerplate and some reformatting made by claude.ai.
import { useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape, { type ElementDefinition, type StylesheetJsonBlock } from "cytoscape";
import Corpus from "./WordType";

const elements: ElementDefinition[] = [
  ...Corpus.Words.map((w) => ({
    data: {
      id: w.id,
      label: [w.english, w.cree].filter(Boolean).join("\n"),
    },
  })),
  ...Corpus.Words.flatMap((w) =>
    w.hypo.map((h) => ({ data: { id: w.id + h, source: w.id, target: h, label: "" } }))
  ),
];



function setupCy(cy: Cytoscape.Core, cyRef: React.RefObject<Cytoscape.Core | null>) {
    cyRef.current = cy;
    cy.minZoom(1);
    cy.maxZoom(5);
    // anything else...
  }


export default function CytoscapeGraph() {
  const cyRef = useRef<Cytoscape.Core | null>(null);

  
  
  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={stylesheet}
      layout={{ name: "cose", padding: 40 }}
      cy={(cy) => { setupCy(cy, cyRef) }}
      style={{ width: "100%", height: "100vh", background: "#0f172a" }}
    />
  );
}

const stylesheet: StylesheetJsonBlock[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      width: "label",             // ✅ size node to fit label width
      height: "label",            // ✅ size node to fit label height
      "background-color": "#6366f1",
      color: "#fff",
      "text-valign": "center",
      "text-halign": "center",
      "text-wrap": "wrap",
      "padding": "10px",
      "border-width": 2,
      "border-color": "#818cf8",
      shape: "round-rectangle",
      "line-height": 1,
    },
  },
  {
    selector: "node:selected",
    style: { "background-color": "#f59e0b", "border-color": "#fbbf24" },
  },
  {
    selector: "edge",
    style: {
      label: "data(label)",
      width: 2,
      "line-color": "#4f46e5",
      "target-arrow-color": "#4f46e5",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      "font-size": 11,
      color: "#94a3b8",
      "text-background-color": "#0f172a",
      "text-background-opacity": 0.7,
      "text-background-padding": "3px",
    },
  },
  {
    selector: "edge:selected",
    style: { "line-color": "#f59e0b", "target-arrow-color": "#f59e0b" },
  },
];
