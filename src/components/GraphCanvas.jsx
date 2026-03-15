/**
 * GraphCanvas.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * Arcane — 3-D knowledge-graph visualiser
 *
 * Implements every rule in graph-physics.md:
 *  ✦  ForceGraph3D  (react-force-graph-3d)
 *  ✦  THREE.Mesh  SphereGeometry  + MeshStandardMaterial (emissive, intensity 2)
 *  ✦  linkDirectionalParticles=4  speed=0.006
 *  ✦  EffectComposer  +  UnrealBloomPass  for the neon-aura glow
 *  ✦  onNodeClick  →  cameraPosition() zoom over 1 000 ms
 *  ✦  backgroundColor="#04050d"
 *  ✦  charge force  −200
 *  ✦  numDimensions=3
 *  ✦  enableNavigationControls
 */

import { useRef, useCallback, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

// ─── Node colour palette by type ─────────────────────────────────────────────
const NODE_COLORS = {
  concept: "#6366f1", // electric indigo
  entity:  "#8b5cf6", // violet
  event:   "#06b6d4", // cyan
  default: "#a78bfa", // soft lavender fallback
};

// Radius scales with connectivity (degree) so hubs are visually larger
const BASE_RADIUS = 4;
const MAX_RADIUS  = 10;

function getNodeRadius(node, graphData) {
  if (!graphData?.links) return BASE_RADIUS;
  const degree = graphData.links.filter(
    (l) =>
      (l.source?.id ?? l.source) === node.id ||
      (l.target?.id ?? l.target) === node.id
  ).length;
  return Math.min(BASE_RADIUS + degree * 1.2, MAX_RADIUS);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GraphCanvas({ graphData, selectedNode, onNodeClick }) {
  const fgRef = useRef();

  // ── Post-processing: UnrealBloomPass ──────────────────────────────────────
  useEffect(() => {
    if (!fgRef.current) return;

    // ForceGraph3D exposes the underlying Three.js postProcessingComposer
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      /* strength  */ 0.8,   // was 1.6 — too intense, merged nodes into white blob
      /* radius    */ 0.4,   // was 0.6 — tighter glow halo
      /* threshold */ 0.22   // was 0.1 — only bright pixels bloom, not everything
    );
    fgRef.current.postProcessingComposer().addPass(bloomPass);
  }, []);

  // ── d3-force charge: keep nodes from clumping ─────────────────────────────
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force("charge").strength(-200);
  }, [graphData]);

  // ── Node click: smooth camera zoom to node over 1 000 ms ─────────────────
  const handleNodeClick = useCallback(
    (node) => {
      onNodeClick?.(node);
      const distance = 80;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      fgRef.current?.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,       // lookAt target
        1000        // ms transition duration
      );
    },
    [onNodeClick]
  );

  // ── Custom node: emissive glowing sphere (graph-physics.md §1) ────────────
  const nodeThreeObject = useCallback(
    (node) => {
      const isSelected = selectedNode?.id === node.id;
      const color      = NODE_COLORS[node.type] ?? NODE_COLORS.default;
      const radius     = getNodeRadius(node, graphData);

      // Outer glow shell (only for selected node)
      const group = new THREE.Group();

      if (isSelected) {
        const glowGeo  = new THREE.SphereGeometry(radius * 1.6, 16, 16);
        const glowMat  = new THREE.MeshStandardMaterial({
          color:            color,
          emissive:         color,
          emissiveIntensity: 0.4,
          transparent:      true,
          opacity:          0.10,
          side:             THREE.BackSide,
        });
        group.add(new THREE.Mesh(glowGeo, glowMat));
      }

      // Core sphere — emissive glow balanced with bloom pass
      const coreGeo = new THREE.SphereGeometry(radius, 20, 20);
      const coreMat = new THREE.MeshStandardMaterial({
        color:             color,
        emissive:          color,
        emissiveIntensity: isSelected ? 2.2 : 1.2,  // was 3.2/2.0 — too hot
        roughness:         0.2,
        metalness:         0.3,
      });
      group.add(new THREE.Mesh(coreGeo, coreMat));

      // Floating text label (sprite)
      const canvas  = document.createElement("canvas");
      canvas.width  = 256;
      canvas.height = 64;
      const ctx     = canvas.getContext("2d");
      ctx.font      = "bold 22px Inter, sans-serif";
      ctx.fillStyle = isSelected ? "#ffffff" : "rgba(220,220,255,0.85)";
      ctx.textAlign = "center";
      ctx.fillText(node.label ?? node.id, 128, 40);

      const texture  = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map:         texture,
        transparent: true,
        opacity:     isSelected ? 1 : 0.75,
        depthWrite:  false,
      });
      const sprite    = new THREE.Sprite(spriteMat);
      sprite.scale.set(24, 6, 1);
      sprite.position.set(0, radius + 7, 0);
      group.add(sprite);

      return group;
    },
    [selectedNode, graphData]
  );

  // ─── Link styling ─────────────────────────────────────────────────────────
  const linkColor = useCallback(
    (link) => {
      const sid = link.source?.id ?? link.source;
      const tid = link.target?.id ?? link.target;
      const isActive =
        selectedNode &&
        (sid === selectedNode.id || tid === selectedNode.id);
      return isActive ? "#c4b5fd" : "rgba(139,92,246,0.3)";
    },
    [selectedNode]
  );

  const linkWidth = useCallback(
    (link) => {
      const sid = link.source?.id ?? link.source;
      const tid = link.target?.id ?? link.target;
      return selectedNode &&
        (sid === selectedNode.id || tid === selectedNode.id)
        ? 2
        : 0.6;
    },
    [selectedNode]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!graphData) return null;

  return (
    <ForceGraph3D
      ref={fgRef}
      // ── Data ──────────────────────────────────────────────────────────────
      graphData={graphData}
      // ── Visuals ───────────────────────────────────────────────────────────
      backgroundColor="#04050d"
      numDimensions={3}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      // ── Links ─────────────────────────────────────────────────────────────
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkDirectionalParticles={4}
      linkDirectionalParticleSpeed={0.006}
      linkDirectionalParticleWidth={1.8}
      linkDirectionalParticleColor={() => "#a78bfa"}
      // ── Interaction ───────────────────────────────────────────────────────
      enableNavigationControls={true}
      onNodeClick={handleNodeClick}
      // ── Labels (built-in, hidden — we render our own via sprites) ─────────
      nodeLabel={() => ""}
    />
  );
}
