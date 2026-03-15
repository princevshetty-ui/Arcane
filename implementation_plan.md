# Arcane — PDF Knowledge Graph

Build a full-stack application that transforms a PDF into an interactive knowledge graph using PyMuPDF + Gemini 1.5 Flash on the backend and a React force-directed graph on the frontend.

## Proposed Changes

---

### Backend — `server/`

#### [NEW] `server/requirements.txt`
Flask, Flask-Cors, PyMuPDF (fitz), google-generativeai, python-dotenv, gunicorn.

#### [NEW] `server/.env.example`
Template for `GEMINI_API_KEY`.

#### [NEW] `server/app.py`
- `POST /api/upload` — accepts a PDF file via `multipart/form-data`.
- Uses `fitz.open()` to extract all pages of text.
- Sends extracted text to **Gemini 1.5 Flash** with a strict prompt that returns a JSON object:
  ```json
  {
    "nodes": [{ "id": "string", "label": "string", "type": "concept|entity|event", "description": "string" }],
    "links": [{ "source": "string", "target": "string", "label": "string" }]
  }
  ```
- Returns the parsed JSON to the client.
- CORS-enabled for `http://localhost:5173`.

---

### Frontend — `client/` (Vite + React)

#### [NEW] `client/` — Vite React scaffold
Initialized with `npx create-vite@latest client --template react`.

#### [NEW] `client/src/index.css`
Design system tokens — dark glass aesthetic:
- Background: deep space `#04050d` with a subtle radial purple/blue mesh gradient
- Glass surfaces: `rgba(255,255,255,0.05)` + `backdrop-filter: blur(20px)`
- Accent: electric indigo `#6366f1` and violet `#8b5cf6`
- Font: Inter (Google Fonts)
- Animated gradient orbs in the background

#### [NEW] `client/src/App.jsx`
Main layout with three zones:
1. **Header** — app name "Arcane" with gradient wordmark
2. **Upload Zone** — centered drag-and-drop PDF uploader (hidden when graph is loaded)
3. **Graph Stage** — full-viewport `GraphCanvas` + glassmorphism `NodeSidebar`

#### [NEW] `client/src/components/UploadZone.jsx`
- Drag-and-drop or click-to-browse for `.pdf` files
- Animated dashed border with hover glow
- Shows upload progress / loading spinner while fetching
- Framer Motion entrance animation

#### [NEW] `client/src/components/GraphCanvas.jsx`
- Wraps `react-force-graph-2d`
- Custom `nodeCanvasObject` for styled nodes (glowing circles with labels)
- Node color by `type`: concept=indigo, entity=violet, event=cyan
- Clicking a node → calls `onNodeClick(node)` prop → triggers sidebar
- Highlighted node rendered with larger glow ring
- Dark canvas background matching app theme

#### [NEW] `client/src/components/NodeSidebar.jsx`
- Glassmorphism panel sliding in from the right (Framer Motion)
- Shows: node `label`, `type` badge, `description`, and all connected links
- Close button (X icon via lucide-react)
- `backdrop-filter: blur(24px)`, inner border `rgba(255,255,255,0.1)`

#### [NEW] `client/src/hooks/useGraphData.js`
Custom hook to POST PDF to `/api/upload`, manage loading/error/data states.

---

## Verification Plan

### Manual Testing Steps
1. **Start the backend**:
   ```
   cd server
   pip install -r requirements.txt
   # Create server/.env with GEMINI_API_KEY=your_key
   python app.py
   ```
2. **Start the frontend**:
   ```
   cd client
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in browser.
4. Drag a PDF onto the upload zone → confirm loading spinner appears.
5. After processing, confirm force-graph renders with nodes and links.
6. Click a node → confirm glassmorphism sidebar slides in with node details.
7. Click close (X) → confirm sidebar dismisses.

### API Smoke Test (curl)
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@sample.pdf" \
  -H "Accept: application/json"
```
Expected: `200 OK` with `{ "nodes": [...], "links": [...] }`.
