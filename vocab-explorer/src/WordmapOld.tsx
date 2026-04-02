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
    var label;
    if (words[i].english != null && words[i].cree != null){
      label = words[i].english + "\n" + words[i].cree
    } else if (words[i].english == null) {
      label = words[i].cree
    } else {
      label = words[i].english
    }
    initialElements.push({ data: { id: words[i].id, label: label }})
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
    cy.removeAllListeners(); // ← clears any previously stacked listeners
 
    cy.on("tap", "node, edge", (evt: EventObject) => {
      const el = evt.target ;
      setSelected({ group: el.group() as "nodes" | "edges", data: el.data()})
      cy.animate({
        center: { eles: el },   // pan to center the node
        zoom: 2.2,               // target zoom level
        }, {
          easing: 'ease-in-out-cubic',
          complete: () => console.log('done')
      });
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        setSelected(null);
        cy.animate({ fit: { eles: cy.elements(), padding: 30 } });
      }
    });

  }


  return (
    <div style={{ flex: 1, position: "relative" }}>
      <CytoscapeComponent
        elements={initialElements}
        stylesheet={stylesheet}
        layout={{ name: "cose", padding: 40 }}
        cy={handleCyInit}
        style={{ width: "100%", height: "100vh", background: "#0f172a" }}
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
