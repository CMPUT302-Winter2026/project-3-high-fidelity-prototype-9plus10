// The boilerplate for the file was generated in claude: https://claude.ai/share/eebba5c9-0eae-462f-ba48-bacaf6ac0e80

import { useState, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import Cytoscape, { type ElementDefinition, type StylesheetJsonBlock, type EventObject} from "cytoscape";
import Corpus from "./WordType";
// ─── Types ─────────────────────────────────────────────────────────────────────
interface SelectedElement {
  group: "nodes" | "edges";
  data: Record<string, unknown>;
}

// ─── Import words into ElementDefinition array ------------------------------
  let initialElements: ElementDefinition[] = [];
  let words = Corpus.Words
  for (let i = 0; i< words.length; i++) {
    initialElements.push({ data: { id: words[i].id, label: words[i].english + "\n" + words[i].cree }})
  }

  for  (let i = 0; i< words.length; i++) {
    for (let j = 0; j< words[i].hypo.length; j++)
    initialElements.push({ data: { id: words[i].id + words[i].hypo[j], source: words[i].id, target: words[i].hypo[j], label: "" } })
  }

// ─── Sample Data ───────────────────────────────────────────────────────────────
// const initialElements: ElementDefinition[] = [
//   { data: { id: "a", label: "D" } },
//   { data: { id: "b", label: "Node B" } },
//   { data: { id: "c", label: "Node C" } },
//   { data: { id: "d", label: "Unconnected" } },
//   { data: { id: "ab", source: "a", target: "b", label: "A→B" } },
//   { data: { id: "bc", source: "b", target: "c", label: "B→C" } },
//   { data: { id: "ac", source: "a", target: "c", label: "A→C" } },
// ];


// ─── Component ─────────────────────────────────────────────────────────────────
export default function CytoscapeGraph() {
  const cyRef = useRef<Cytoscape.Core | null>(null);
  const [selected, setSelected] = useState<SelectedElement | null>(null);

  const handleCyInit = (cy: Cytoscape.Core) => {
    cyRef.current = cy;

    cy.on("tap", "node, edge", (evt: EventObject) => {
      const el = evt.target ;
      setSelected({ group: el.group() as "nodes" | "edges", data: el.data()})
      cy.animate({
        center: { eles: el },   // pan to center the node
        zoom: 2.2,               // target zoom level
        }, {
          duration: 450,
          easing: 'ease-in-out-cubic',
          complete: () => console.log('done')
      });
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        setSelected(null);
        cy.animate({ fit: { eles: cy.elements(), padding: 30 } }, { duration: 400 });
      }
    });

    cy.on("drag", "node, edge", (evt: EventObject) => {
      
    })
  }

  const fitGraph = () => cyRef.current?.fit(undefined, 40);
  const resetZoom = () =>
    cyRef.current?.zoom({ level: 1, renderedPosition: { x: 300, y: 200 } });

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <span style={styles.title}>Cytoscape Graph</span>
        <div style={styles.controls}>
          <button style={styles.btn} onClick={fitGraph}>Fit</button>
          <button style={styles.btn} onClick={resetZoom}>Reset Zoom</button>
        </div>
      </header>

      <CytoscapeComponent
        elements={initialElements}
        stylesheet={stylesheet}
        layout={{ name: "cose", padding: 40 }}
        cy={handleCyInit}
        style={styles.canvas}
      />

      {selected && (
        <div style={styles.panel}>
          <strong style={{ color: "#f59e0b" }}>
            {selected.group === "nodes" ? "Node" : "Edge"}
          </strong>
          <pre style={styles.pre}>{JSON.stringify(selected.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}






// ─── Stylesheet ────────────────────────────────────────────────────────────────
const stylesheet: StylesheetJsonBlock[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      height: "label",
      width: "label",
      "background-color": "#6366f1",
      color: "#fff",
      "text-valign": "center",
      "text-halign": "center",
      "text-wrap": "wrap",
      "border-width": 2,
      "border-color": "#818cf8",
      "shape": "round-rectangle",
      "line-height": 1,
      
    },
  },
  {
    selector: "node:selected",
    style: {
      "background-color": "#f59e0b",
      "border-color": "#fbbf24",
    },
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
    style: {
      "line-color": "#f59e0b",
      "target-arrow-color": "#f59e0b",
    },
  },
];


// ─── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    fontFamily: "'IBM Plex Mono', monospace",
    background: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    height: 500,
    minWidth: 400,
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  title: {
    color: "#e2e8f0",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.05em",
  },
  controls: { display: "flex", gap: 8 },
  btn: {
    background: "#334155",
    color: "#94a3b8",
    border: "1px solid #475569",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  canvas: { flex: 1, background: "#0f172a" },
  panel: {
    position: "absolute",
    bottom: 16,
    right: 16,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#cbd5e1",
    maxWidth: 220,
    pointerEvents: "none",
  },
  pre: { margin: "6px 0 0", color: "#94a3b8", whiteSpace: "pre-wrap" },
};
