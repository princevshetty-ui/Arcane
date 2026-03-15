/**
 * useGraphData.js
 * ────────────────────────────────────────────────────────────────────────────
 * Custom hook — POST a PDF to /api/upload, manage loading / error / data.
 */

import { useState, useCallback } from "react";

const API_URL = "http://localhost:5000/api/upload";

export function useGraphData() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const uploadPDF = useCallback(async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setGraphData(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(API_URL, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Server error ${res.status}`);
      }

      // Normalise: react-force-graph-3d mutates link objects in-place,
      // so we give it a fresh deep-clone on every new upload.
      setGraphData(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      setError(err.message ?? "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setGraphData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { graphData, loading, error, uploadPDF, reset };
}
