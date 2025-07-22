import React, { useContext, useEffect, useState } from "react";
import { PromotionWizardContext } from "./PromotionWizard";

// Replace with your actual schoolCode prop or context
const schoolCode =
  typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";

export default function PromotionResultsStep() {
  const { wizardState } = useContext(PromotionWizardContext);
  const { promotionResults } = wizardState;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/schools/${schoolCode}/promotion-logs`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      setError("Failed to fetch promotion logs.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadCSV() {
    // Placeholder: implement CSV download logic
    alert("Download CSV (to implement)");
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Promotion Results & Logs</h2>
      {promotionResults && (
        <div className="mb-4">
          <div>
            Promoted: <b>{promotionResults.promoted?.length ?? 0}</b>
          </div>
          <div>
            Excluded: <b>{promotionResults.excluded?.length ?? 0}</b>
          </div>
          <div>
            Errors: <b>{promotionResults.errors?.length ?? 0}</b>
          </div>
        </div>
      )}
      <div className="mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleDownloadCSV}
        >
          Download Log as CSV
        </button>
      </div>
      <h3 className="font-bold mb-2">Promotion Logs</h3>
      {loading && <div>Loading logs...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Student</th>
            <th className="border px-2 py-1">From Class</th>
            <th className="border px-2 py-1">To Class</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Notes</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-4">
                No logs found.
              </td>
            </tr>
          )}
          {logs.map((log: any) => (
            <tr key={log.id}>
              <td className="border px-2 py-1">
                {log.studentName || log.studentId}
              </td>
              <td className="border px-2 py-1">{log.fromClass}</td>
              <td className="border px-2 py-1">{log.toClass}</td>
              <td className="border px-2 py-1">
                {log.status || log.promotionType || "-"}
              </td>
              <td className="border px-2 py-1">{log.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
