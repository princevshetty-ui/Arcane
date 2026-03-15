/**
 * GraphCanvas.jsx — Arcane
 * Clean version: no bloom, natural emissive glow, readable labels
 */

import { useRef, useCallback, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

const NODE_COLORS = {
  concept: "#818cf8",
  entity:  "#c084fc",
  event:   "#34d399",
  default: "#94a3b8",
};

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

export default function GraphCanvas({ graphData, selectedNode, onNodeClick }) {
  const fgRef = useRef();

  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force("charge").strength(-200);
  }, [graphData]);

  const handleNodeClick = useCallback(
    (node) => {
      onNodeClick?.(node);
      const distance  = 80;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      fgRef.current?.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        1000
      );
    },
    [onNodeClick]
  );

  const nodeThreeObject = useCallback(
    (node) => {
      const isSelected = selectedNode?.id === node.id;
      const color      = NODE_COLORS[node.type] ?? NODE_COLORS.default;
      const radius     = getNodeRadius(node, graphData);
      const group      = new THREE.Group();

      // Outer glow shell (selected only)
      if (isSelected) {
        const glowGeo = new THREE.SphereGeometry(radius * 1.5, 16, 16);
        const glowMat = new THREE.MeshStandardMaterial({
          color,
          emissive:          color,
          emissiveIntensity: 0.3,
          transparent:       true,
          opacity:           0.12,
          side:              THREE.BackSide,
          toneMapped:        false,
        });
        group.add(new THREE.Mesh(glowGeo, glowMat));
      }

      // Core sphere
      const coreGeo = new THREE.SphereGeometry(radius, 20, 20);
      const coreMat = new THREE.MeshStandardMaterial({
        color,
        emissive:          color,
        emissiveIntensity: isSelected ? 2.0 : 1.2,
        roughness:         0.3,
        metalness:         0.2,
        toneMapped:        false,
      });
      group.add(new THREE.Mesh(coreGeo, coreMat));

      // Text label
      const canvas  = document.createElement("canvas");
      canvas.width  = 256;
      canvas.height = 64;
      const ctx     = canvas.getContext("2d");
      ctx.clearRect(0, 0, 256, 64);

      // Label background pill
      const text     = node.label ?? node.id;
      ctx.font       = "bold 18px Inter, sans-serif";
      const metrics  = ctx.measureText(text);
      const tw       = metrics.width + 20;
      const tx       = (256 - tw) / 2;

      ctx.fillStyle  = "rgba(4,5,13,0.75)";
      ctx.beginPath();
      ctx.roundRect(tx, 16, tw, 28, 6);
      ctx.fill();

      // Label text
      ctx.fillStyle  = isSelected ? "#ffffff" : color;
      ctx.textAlign  = "center";
      ctx.fillText(text, 128, 36);

      const texture   = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map:         texture,
        transparent: true,
        opacity:     isSelected ? 1 : 0.9,
        depthWrite:  false,
        toneMapped:  false,
        sizeAttenuation: true,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(26, 7, 1);
      sprite.position.set(0, radius + 8, 0);
      sprite.renderOrder = 1;
      group.add(sprite);

      return group;
    },
    [selectedNode, graphData]
  );

  const linkColor = useCallback(
    (link) => {
      const sid = link.source?.id ?? link.source;
      const tid = link.target?.id ?? link.target;
      const isActive =
        selectedNode &&
        (sid === selectedNode.id || tid === selectedNode.id);
      return isActive ? "#c4b5fd" : "rgba(148,163,184,0.2)";
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
        : 0.5;
    },
    [selectedNode]
  );

  if (!graphData) return null;

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      backgroundColor="#04050d"
      numDimensions={3}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkDirectionalParticles={4}
      linkDirectionalParticleSpeed={0.006}
      linkDirectionalParticleWidth={1.5}
      linkDirectionalParticleColor={() => "#818cf8"}
      enableNavigationControls={true}
      onNodeClick={handleNodeClick}
      nodeLabel={() => ""}
    />
  );
}