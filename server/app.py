"""
Arcane — Flask Backend
Accepts a PDF upload, extracts text via PyMuPDF, and asks Gemini 2.5 Flash Preview
to return a knowledge-graph JSON (nodes + links).
"""

import os
import json
import re
import fitz  # PyMuPDF
import google.generativeai as genai

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ─── Bootstrap ───────────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", allow_headers=["Content-Type"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError(
        "GEMINI_API_KEY is not set. "
        "Copy server/.env.example to server/.env and fill in your key."
    )

genai.configure(api_key=GEMINI_API_KEY)
MODEL_NAME = "gemini-3-flash-preview"
model = genai.GenerativeModel(MODEL_NAME)

# ─── Gemini prompt ──────────────────────────────────────────────────────────
GRAPH_PROMPT = """
You are a knowledge-graph extraction engine.

Given the following text extracted from a PDF document, analyze it and return
a JSON knowledge graph with exactly this structure:

{{
  "nodes": [
    {{
      "id": "<unique_slug>",
      "label": "<short display name>",
      "type": "concept" | "entity" | "event",
      "description": "<one or two sentence summary of this node>"
    }}
  ],
  "links": [
    {{
      "source": "<node_id>",
      "target": "<node_id>",
      "label": "<relationship verb, e.g. 'influences', 'uses', 'leads_to'>"
    }}
  ]
}}

Rules:
- Extract between 12 and 30 nodes — enough to be meaningful, not overwhelming.
- Every node id must be a lowercase ASCII slug (underscores allowed, no spaces).
- Every link must reference existing node ids.
- Return ONLY the raw JSON object — no markdown fences, no explanations.

--- DOCUMENT TEXT ---
{text}
--- END OF DOCUMENT ---
"""

# ─── Helpers ─────────────────────────────────────────────────────────────────

MAX_CHARS = 30_000  # Token budget safety cap (~7 500 tokens)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract and concatenate text from all pages of a PDF."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text("text"))
    doc.close()
    text = "\n\n".join(pages)
    return text[:MAX_CHARS]


def parse_gemini_json(raw: str) -> dict:
    """
    Robustly extract the first JSON object from Gemini's response,
    stripping any accidental markdown fences.
    """
    # Strip ```json … ``` or ``` … ``` wrappers if present
    raw = re.sub(r"```(?:json)?", "", raw).strip()
    # Find the outermost { … }
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in Gemini response.")
    return json.loads(raw[start:end])


def validate_graph(graph: dict) -> dict:
    """
    Light validation — ensure every link references an existing node id,
    and remove any that don't (rather than crash).
    """
    node_ids = {n["id"] for n in graph.get("nodes", [])}
    valid_links = [
        lk for lk in graph.get("links", [])
        if lk.get("source") in node_ids and lk.get("target") in node_ids
    ]
    graph["links"] = valid_links
    return graph


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})


@app.route("/api/upload", methods=["POST"])
def upload_pdf():
    # 1. Validate that a file was sent
    if "file" not in request.files:
        return jsonify({"error": "No file part in request. "
                                 "Send the PDF as form-data key 'file'."}), 400

    pdf_file = request.files["file"]
    if pdf_file.filename == "":
        return jsonify({"error": "Empty filename."}), 400
    if not pdf_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported."}), 415

    # 2. Extract text from PDF
    try:
        file_bytes = pdf_file.read()
        text = extract_text_from_pdf(file_bytes)
    except Exception as exc:
        return jsonify({"error": f"PDF parsing failed: {exc}"}), 422

    if len(text.strip()) < 50:
        return jsonify({"error": "PDF appears to have no extractable text "
                                 "(it may be a scanned image PDF)."}), 422

    # 3. Send to Gemini 2.5 Flash Preview
    try:
        prompt = GRAPH_PROMPT.format(text=text)
        response = model.generate_content(prompt)
        raw_json = response.text
    except Exception as exc:
        import traceback
        traceback.print_exc()  # Full error in Flask console
        return jsonify({"error": f"Gemini API error: {str(exc)}", "model": MODEL_NAME}), 502

    # 4. Parse + validate graph JSON
    try:
        graph = parse_gemini_json(raw_json)
        graph = validate_graph(graph)
    except (ValueError, json.JSONDecodeError) as exc:
        return jsonify({
            "error": f"Could not parse JSON from Gemini: {exc}",
            "raw": raw_json,
        }), 502

    # 5. Return the graph
    return jsonify(graph), 200


# ─── Dev server ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
