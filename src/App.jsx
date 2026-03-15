/**
 * App.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * Arcane — root layout.
 *
 * Three visual states:
 *  1. UPLOAD   — centred UploadZone over the mesh-gradient hero
 *  2. LOADING  — UploadZone shows spinner (GraphCanvas not yet mounted)
 *  3. GRAPH    — full-viewport GraphCanvas + NodeSidebar overlay
 */

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw }              from "lucide-react";

import { useGraphData }  from "./hooks/useGraphData";
import UploadZone        from "./components/UploadZone";
import GraphCanvas       from "./components/GraphCanvas";
import NodeSidebar       from "./components/NodeSidebar";

import styles from "./App.module.css";

// ─── Variants ────────────────────────────────────────────────────────────────

const graphReveal = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
  exit:    { opacity: 0, transition: { duration: 0.3 } },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function App() {
  const { graphData, loading, error, uploadPDF, reset } = useGraphData();
  const [selectedNode, setSelectedNode] = useState(null);

  const handleFile = useCallback(
    (file) => {
      setSelectedNode(null);
      uploadPDF(file);
    },
    [uploadPDF]
  );

  const handleNodeClick = useCallback((node) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedNode(null);
    reset();
  }, [reset]);

  const showUpload = !graphData;

  return (
    <div className={styles.root}>
      {/* ── Mesh-gradient background orbs ──────────────────────────────── */}
      <div className={styles.orbsLayer} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orbBlue}`}   />
        <div className={`${styles.orb} ${styles.orbViolet}`} />
        <div className={`${styles.orb} ${styles.orbCyan}`}   />
      </div>

      {/* ── Topbar (always visible) ─────────────────────────────────────── */}
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoGlyph}>⬡</span>
          <span className={styles.logoText}>Arcane</span>
        </div>

        <AnimatePresence>
          {graphData && (
            <motion.button
              className={styles.resetBtn}
              onClick={handleReset}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Upload a new PDF"
            >
              <RotateCcw size={15} />
              New PDF
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main stage ─────────────────────────────────────────────────── */}
      <main className={styles.stage}>
        <AnimatePresence mode="wait">
          {showUpload ? (
            <motion.div
              key="upload"
              className={styles.uploadWrapper}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
            >
              <UploadZone
                onFile={handleFile}
                loading={loading}
                error={error}
              />
            </motion.div>
          ) : (
            <motion.div
              key="graph"
              className={styles.graphWrapper}
              variants={graphReveal}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <GraphCanvas
                graphData={graphData}
                selectedNode={selectedNode}
                onNodeClick={handleNodeClick}
              />

              {/* Stats chip */}
              <div className={styles.statsChip}>
                <span>{graphData.nodes?.length ?? 0} nodes</span>
                <span className={styles.statsDot} />
                <span>{graphData.links?.length ?? 0} links</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Sidebar overlay ────────────────────────────────────────────── */}
      <NodeSidebar
        node={selectedNode}
        graphData={graphData}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
