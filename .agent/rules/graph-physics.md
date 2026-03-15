---
trigger: always_on
---

# 3D Graph Physics & Cinematic Rendering Rules

### 1. The "Starfield" Aesthetic (WebGL)
- **Component:** Use `ForceGraph3D` exclusively.
- **Custom Geometries:** Use `nodeThreeObject` to return a `THREE.Mesh` with a `SphereGeometry`.
- **Emissive Glow:** Apply `THREE.MeshStandardMaterial` with an `emissive` color and `emissiveIntensity` set to `2` to create a light-source effect.
- **Link Particles:** Enable `linkDirectionalParticles={4}` and `linkDirectionalParticleSpeed={0.006}` to show active data flow.

### 2. Immersive Interaction
- **Bloom Effect:** If possible, wrap the graph in a post-processing `EffectComposer` with a `UnrealBloomPass` for a true neon aura.
- **Camera Animation:** Implement `onNodeClick` to use `Graph.cameraPosition()` to smoothly zoom into the selected node over 1000ms.
- **Background:** Set `backgroundColor` to a very deep space black (`#04050d`).

### 3. 3D Physics (d3-force-3d)
- **Charge:** Set `d3Force('charge').strength(-200)` to prevent 3D overlapping.
- **Dimensions:** Ensure `numDimensions` is set to `3` (default for 3D-force-graph).
- **Orbit:** Enable `enableNavigationControls={true}` for orbit, zoom, and pan.