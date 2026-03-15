/**
 * UploadZone.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * High-polish drag-and-drop PDF uploader.
 *
 *  • Breathing dashed border (scale + opacity loop via framer-motion)
 *  • Glow halo on hover / drag-over
 *  • Spinner + status text while loading
 *  • Error display with shake animation
 */

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, AlertCircle, Loader2 } from "lucide-react";
import styles from "./UploadZone.module.css";

// ─── Variants ────────────────────────────────────────────────────────────────

const wrapperVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 180, damping: 22, delay: 0.1 },
  },
  exit: {
    opacity: 0, scale: 0.9, y: -20,
    transition: { duration: 0.35, ease: "easeInOut" },
  },
};

const borderPulse = {
  animate: {
    opacity:   [0.4, 1, 0.4],
    scale:     [1, 1.012, 1],
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
};

const shakeVariants = {
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5 },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function UploadZone({ onFile, loading, error }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.name.toLowerCase().endsWith(".pdf")) return;
      setFileName(file.name);
      onFile(file);
    },
    [onFile]
  );

  // ── Drag events ────────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };
  const onInputChange = (e) => handleFile(e.target.files?.[0]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.outer}>
      {/* ── Hero wordmark ─────────────────────────────────────────────── */}
      <motion.div
        className={styles.wordmark}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.6, ease: "easeOut" }}
      >
        <span className={styles.wordmarkGlyph}>⬡</span>
        <span className={styles.wordmarkText}>Arcane</span>
      </motion.div>

      <motion.p
        className={styles.tagline}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Upload a PDF — watch it become a living knowledge graph.
      </motion.p>

      {/* ── Drop zone ──────────────────────────────────────────────────── */}
      <motion.div
        variants={wrapperVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={`${styles.zone} ${dragging ? styles.zoneDragging : ""} ${error ? styles.zoneError : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
      >
        {/* Breathing dashed border ring */}
        <motion.div
          className={`${styles.borderRing} ${dragging ? styles.borderRingActive : ""}`}
          variants={borderPulse}
          animate="animate"
        />

        {/* Hover glow */}
        <div className={`${styles.glow} ${dragging ? styles.glowActive : ""}`} />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className={styles.stateBlock}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 size={44} className={styles.spinnerIcon} />
              </motion.div>
              <p className={styles.statusTitle}>Conjuring the graph…</p>
              <p className={styles.statusSub}>
                Gemini is reading <strong>{fileName}</strong>
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className={styles.stateBlock}
              variants={shakeVariants}
              animate="shake"
              initial={{ opacity: 0 }}
            >
              <AlertCircle size={44} className={styles.errorIcon} />
              <p className={styles.statusTitle}>Something went wrong</p>
              <p className={styles.errorMessage}>{error}</p>
              <p className={styles.retryHint}>Drop another PDF to try again.</p>
            </motion.div>
          ) : fileName ? (
            <motion.div
              key="ready"
              className={styles.stateBlock}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FileText size={44} className={styles.fileIcon} />
              <p className={styles.statusTitle}>{fileName}</p>
              <p className={styles.statusSub}>Processing…</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              className={styles.stateBlock}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <UploadCloud size={52} className={styles.uploadIcon} />
              </motion.div>
              <p className={styles.statusTitle}>Drop a PDF here</p>
              <p className={styles.statusSub}>or click to browse</p>
              <span className={styles.badge}>.pdf only</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className={styles.hiddenInput}
        onChange={onInputChange}
      />
    </div>
  );
}
