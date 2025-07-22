import React, { useEffect, useState } from "react";

export function AcademicYearTermSelector({ schoolCode, onSelect }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showYearModal, setShowYearModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd, setNewYearEnd] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newTermStart, setNewTermStart] = useState("");
  const [newTermEnd, setNewTermEnd] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdYear, setCreatedYear] = useState(null);

  useEffect(() => {
    fetchAcademicYears();
  }, [schoolCode]);

  async function fetchAcademicYears() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/schools/${schoolCode}/academic-years`);
      const data = await res.json();
      setYears(data);
    } catch (e) {
      setError("Failed to fetch academic years.");
    } finally {
      setLoading(false);
    }
  }

  // Defensive: ensure years is always an array
  const safeYears = Array.isArray(years) ? years : [];
  const current = safeYears[safeYears.length - 1];
  const nextYear = current ? (parseInt(current.name) + 1).toString() : "";
  const nextTerm = current ? "Term 1" : "";

  // Enhanced existence checks
  const yearExists = safeYears.some((y) => y.name === nextYear);
  const yearObj = safeYears.find((y) => y.name === nextYear);
  const termExists = yearObj && yearObj.terms?.some((t) => t.name === nextTerm);

  const currentDisplay = current
    ? `${current.name} ${current.terms?.[current.terms.length - 1]?.name || ""}`
    : "None";
  const nextDisplay = `${nextYear} ${nextTerm}`;

  // Sequential modal logic
  function openCreateFlow() {
    setShowYearModal(true);
    setNewYear(nextYear);
    setNewYearStart(nextYear ? `${nextYear}-01-01` : "");
    setNewYearEnd(nextYear ? `${nextYear}-12-31` : "");
    setError("");
  }

  async function handleCreateYear(e) {
    e.preventDefault();
    if (!newYear || !newYearStart || !newYearEnd) {
      setError("All year fields are required.");
      return;
    }
    setError("");
    setCreating(true);
    try {
      const yearRes = await fetch(`/api/schools/${schoolCode}/academic-years`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newYear,
          startDate: newYearStart,
          endDate: newYearEnd,
        }),
      });
      if (!yearRes.ok) throw new Error("Failed to create academic year");
      const yearData = await yearRes.json();
      setCreatedYear(yearData);
      setShowYearModal(false);
      setShowTermModal(true);
      setNewTerm(nextTerm);
      setNewTermStart(newYearStart);
      setNewTermEnd(newYearStart ? `${newYearStart.slice(0, 4)}-04-30` : "");
    } catch (e) {
      setError(e.message || "Failed to create academic year.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateTerm(e) {
    e.preventDefault();
    if (!newTerm || !newTermStart || !newTermEnd || !createdYear) {
      setError("All term fields are required.");
      return;
    }
    setError("");
    setCreating(true);
    try {
      const termRes = await fetch(`/api/schools/${schoolCode}/terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTerm,
          startDate: newTermStart,
          endDate: newTermEnd,
          academicYearId: createdYear.id,
        }),
      });
      if (!termRes.ok) throw new Error("Failed to create term");
      const termData = await termRes.json();
      setShowTermModal(false);
      setCreatedYear(null);
      await fetchAcademicYears(); // Ensure UI refreshes with new year/term
      onSelect(createdYear, termData);
    } catch (e) {
      setError(e.message || "Failed to create term.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">
        Select Academic Year & Term
      </h2>
      <div className="mb-4">
        <div className="text-sm text-gray-700 mb-2">
          <b>Current:</b> {currentDisplay} <br />
          <b>Next:</b> {nextDisplay}{" "}
          {termExists ? (
            <span className="text-green-600">(Exists)</span>
          ) : yearExists ? (
            <span className="text-yellow-600">(Year exists, no terms)</span>
          ) : (
            <span className="text-red-600">(Not found)</span>
          )}
        </div>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {termExists ? (
        // Both year and term exist: allow selection
        <>
          <div className="mb-4">
            <label className="block mb-2">Academic Year</label>
            <select
              onChange={(e) => {
                const year = years.find((y) => y.name === e.target.value);
                onSelect(year, year?.terms?.[0]);
              }}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Select year</option>
              {years.map((y) => (
                <option key={y.id} value={y.name}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : yearExists ? (
        // Year exists, but no terms: prompt to create first term
        <>
          <div className="mb-4 text-yellow-700">
            The next academic year ({nextYear}) exists, but no terms were found.
            Please create the first term for this year.
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
            onClick={() => {
              setCreatedYear(yearObj);
              setShowTermModal(true);
              setNewTerm(nextTerm);
              setNewTermStart(yearObj.startDate);
              setNewTermEnd(
                yearObj.startDate
                  ? `${yearObj.startDate.slice(0, 4)}-04-30`
                  : ""
              );
            }}
            disabled={creating}
          >
            {creating ? "Creating..." : `Create First Term for ${nextYear}`}
          </button>
        </>
      ) : (
        // Neither year nor term exist: prompt to create both
        <>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
            onClick={openCreateFlow}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Next Academic Year & Term"}
          </button>
        </>
      )}
      {/* Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-2">Create Academic Year</h3>
            <form onSubmit={handleCreateYear}>
              <div className="mb-2">
                <label className="block mb-1">Year Name</label>
                <input
                  type="text"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="e.g. 2026"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Year Start Date</label>
                <input
                  type="date"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Year End Date</label>
                <input
                  type="date"
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded border"
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-2">Create First Term</h3>
            <form onSubmit={handleCreateTerm}>
              <div className="mb-2">
                <label className="block mb-1">Term Name</label>
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="e.g. Term 1"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Term Start Date</label>
                <input
                  type="date"
                  value={newTermStart}
                  onChange={(e) => setNewTermStart(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="mb-2">
                <label className="block mb-1">Term End Date</label>
                <input
                  type="date"
                  value={newTermEnd}
                  onChange={(e) => setNewTermEnd(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded border"
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Term"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
