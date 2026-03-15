/**
 * NodeSidebar.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * Glassmorphism slide-in panel for selected node details.
 * Shows: type badge, label, description, and all connected edges.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Globe, Zap, ArrowRight } from "lucide-react";
import styles from "./NodeSidebar.module.css";

// ─── Type config ─────────────────────────────────────────────────────────────

const TYPE_META = {
  concept: { icon: Cpu,   color: "#6366f1", label: "Concept" },
  entity:  { icon: Globe, color: "#8b5cf6", label: "Entity"  },
  event:   { icon: Zap,   color: "#06b6d4", label: "Event"   },
};

// ─── Variants ────────────────────────────────────────────────────────────────

const panelVariants = {
  hidden: {
    x: "110%",
    opacity: 0,
    transition: { type: "spring", stiffness: 260, damping: 30 },
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 30 },
  },
  exit: {
    x: "110%",
    opacity: 0,
    transition: { duration: 0.28, ease: "easeInOut" },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, x: 16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function NodeSidebar({ node, graphData, onClose }) {
  const meta = node ? (TYPE_META[node.type] ?? TYPE_META.concept) : null;
  const Icon = meta?.icon ?? Cpu;

  // Collect connected edges for this node
  const connections = useMemo(() => {
    if (!node || !graphData?.links) return [];
    return graphData.links.filter((l) => {
      const sid = l.source?.id ?? l.source;
      const tid = l.target?.id ?? l.target;
      return sid === node.id || tid === node.id;
    });
  }, [node, graphData]);

  // Resolve display name of the other end of a link
  const peerLabel = (link) => {
    const sid    = link.source?.id ?? link.source;
    const tid    = link.target?.id ?? link.target;
    const peerId = sid === node?.id ? tid : sid;
    const peer   = graphData?.nodes?.find((n) => n.id === peerId);
    return peer?.label ?? peerId;
  };

  const isSource = (link) => (link.source?.id ?? link.source) === node?.id;

  return (
    <AnimatePresence>
      {node && (
        <>
          {/* ── Backdrop blur overlay (mobile / small screens) ─────────── */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ── Glassmorphism panel ───────────────────────────────────── */}
          <motion.aside
            className={styles.panel}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="complementary"
            aria-label="Node details"
          >
            {/* Header */}
            <div className={styles.header}>
              <div
                className={styles.typeChip}
                style={{
                  background: `${meta?.color}22`,
                  borderColor: `${meta?.color}55`,
                  color: meta?.color,
                }}
              >
                <Icon size={13} />
                <span>{meta?.label}</span>
              </div>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Node label */}
            <motion.h2
              className={styles.nodeLabel}
              custom={0}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              style={{ color: meta?.color }}
            >
              {node.label}
            </motion.h2>

            {/* Divider */}
            <div
              className={styles.divider}
              style={{ background: `linear-gradient(90deg, ${meta?.color}55, transparent)` }}
            />

            {/* Description */}
            {node.description && (
              <motion.p
                className={styles.description}
                custom={1}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                {node.description}
              </motion.p>
            )}

            {/* Connections */}
            {connections.length > 0 && (
              <motion.div
                custom={2}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <p className={styles.sectionTitle}>
                  Connections
                  <span className={styles.badge}>{connections.length}</span>
                </p>
                <ul className={styles.linkList}>
                  {connections.map((link, i) => (
                    <motion.li
                      key={i}
                      className={styles.linkItem}
                      custom={3 + i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <ArrowRight
                        size={13}
                        className={styles.linkArrow}
                        style={{
                          transform: isSource(link) ? "rotate(0deg)" : "rotate(180deg)",
                          color: meta?.color,
                        }}
                      />
                      <span className={styles.linkVerb}>{link.label}</span>
                      <span className={styles.linkPeer}>{peerLabel(link)}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Node ID — subtle footer */}
            <p className={styles.nodeId}>id: {node.id}</p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
