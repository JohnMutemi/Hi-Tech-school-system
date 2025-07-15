import React, { useEffect, useState, useContext } from "react";
import { PromotionWizardContext } from "./PromotionWizard";
import { useToast } from "@/hooks/use-toast";

const schoolCode =
  typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";
const PAGE_SIZE = 10;

export default function PromotionPreviewStep() {
  const { wizardState, setWizardState } = useContext(PromotionWizardContext);
  const {
    selectedAcademicYear,
    selectedTerm,
    criteriaList,
    overrides = {},
    exclusions = {},
  } = wizardState;
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [ineligibleStudents, setIneligibleStudents] = useState([]);
  const [studentBalances, setStudentBalances] = useState({});
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"override" | "exclude" | null>(
    null
  );
  const [modalStudent, setModalStudent] = useState<any>(null);
  const [modalNote, setModalNote] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [eligiblePage, setEligiblePage] = useState(1);
  const [ineligiblePage, setIneligiblePage] = useState(1);

  useEffect(() => {
    fetchCurrentAcademicYearId();
  }, []);

  useEffect(() => {
    console.log("Effect dependencies:", {
      selectedAcademicYear,
      selectedTerm,
      criteriaList,
      currentAcademicYearId,
    });
    if (
      selectedAcademicYear &&
      selectedTerm &&
      criteriaList !== undefined &&
      currentAcademicYearId
    ) {
      fetchStudents();
    }
    // eslint-disable-next-line
  }, [selectedAcademicYear, selectedTerm, criteriaList, currentAcademicYearId]);

  async function fetchCurrentAcademicYearId() {
    try {
      const res = await fetch(
        `/api/schools/${schoolCode}?action=current-academic-year`
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentAcademicYearId(data.id || "");
      }
    } catch {}
  }

  async function fetchStudentBalances(schoolCode, students, academicYearId) {
    const balances = {};
    await Promise.all(
      students.map(async (student) => {
        try {
          // Fetch the fee statement for the student for the selected academic year
          const res = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/fee-statement?academicYearId=${academicYearId}`
          );
          if (res.ok) {
            const data = await res.json();
            // Use the last running balance in the statement
            const lastBalance =
              data.length > 0 ? data[data.length - 1].balance : 0;
            balances[student.id] = lastBalance;
          } else {
            balances[student.id] = 0;
          }
        } catch {
          balances[student.id] = 0;
        }
      })
    );
    return balances;
  }

  async function fetchStudents() {
    setLoading(true);
    setError("");
    try {
      const yearParam =
        selectedAcademicYear?.id ||
        selectedAcademicYear?.name ||
        selectedAcademicYear;
      const termParam = selectedTerm?.id || selectedTerm?.name || selectedTerm;
      const res = await fetch(
        `/api/schools/${schoolCode}/promotions/bulk?action=preview&year=${encodeURIComponent(
          yearParam
        )}&term=${encodeURIComponent(termParam)}`
      );
      const data = await res.json();
      console.log("API response:", data); // DEBUG
      // After fetching eligible students, ensure fromClass and toClass are set
      const eligibleWithNextClass = (data.eligibleStudents || []).map((s) => ({
        ...s,
        fromClass: s.fromClass || s.currentClass || "",
        toClass: s.toClass || s.nextClass || "",
      }));
      setEligibleStudents(eligibleWithNextClass);
      setIneligibleStudents(data.ineligibleStudents || []);
      setWizardState((prev: any) => {
        const newState = {
          ...prev,
          eligibleStudents: eligibleWithNextClass,
          ineligibleStudents: data.ineligibleStudents,
        };
        console.log("Wizard state:", newState); // DEBUG
        return newState;
      });
      // Fetch balances for all students using current academic year
      const allStudents = [
        ...(data.eligibleStudents || []),
        ...(data.ineligibleStudents || []),
      ];
      const balances = await fetchStudentBalances(
        schoolCode,
        allStudents,
        currentAcademicYearId
      );
      setStudentBalances(balances);
    } catch (e) {
      setError("Failed to fetch students.");
      toast({
        title: "Error",
        description: "Failed to fetch students.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openModal(action: "override" | "exclude", student: any) {
    setModalAction(action);
    setModalStudent(student);
    setModalNote("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalAction(null);
    setModalStudent(null);
    setModalNote("");
    setModalLoading(false);
  }

  async function handleModalConfirm() {
    if (!modalStudent) return;
    setModalLoading(true);
    setTimeout(() => {
      if (modalAction === "override") {
        setWizardState((prev: any) => ({
          ...prev,
          overrides: {
            ...prev.overrides,
            [modalStudent.id]: { note: modalNote },
          },
          exclusions: Object.fromEntries(
            Object.entries(prev.exclusions || {}).filter(
              ([id]) => id !== modalStudent.id
            )
          ),
        }));
        toast({
          title: "Override Applied",
          description: `Eligibility overridden for ${modalStudent.name}.`,
          variant: "success",
        });
      } else if (modalAction === "exclude") {
        setWizardState((prev: any) => ({
          ...prev,
          exclusions: {
            ...prev.exclusions,
            [modalStudent.id]: { note: modalNote },
          },
          overrides: Object.fromEntries(
            Object.entries(prev.overrides || {}).filter(
              ([id]) => id !== modalStudent.id
            )
          ),
        }));
        toast({
          title: "Student Excluded",
          description: `${modalStudent.name} has been excluded from promotion.`,
          variant: "warning",
        });
      }
      setModalLoading(false);
      closeModal();
    }, 700);
  }

  // Compute unique class options
  const allStudentsRaw = [...eligibleStudents, ...ineligibleStudents];
  // Apply overrides and exclusions to compute the true lists
  const overriddenIds = Object.keys(overrides || {});
  const excludedIds = Object.keys(exclusions || {});
  const allStudents = allStudentsRaw.filter(
    (s: any, idx, arr) => arr.findIndex((st) => st.id === s.id) === idx
  ); // dedupe
  const actuallyEligible = allStudents.filter(
    (s: any) =>
      !excludedIds.includes(s.id) &&
      (eligibleStudents.some((e) => e.id === s.id) ||
        overriddenIds.includes(s.id))
  );
  const actuallyIneligible = allStudents.filter(
    (s: any) =>
      !overriddenIds.includes(s.id) &&
      (ineligibleStudents.some((i) => i.id === s.id) ||
        excludedIds.includes(s.id))
  );
  const classOptions = Array.from(
    new Set(allStudents.map((s: any) => s.currentClass).filter(Boolean))
  );

  // Filter and paginate eligible students
  const filteredEligible = actuallyEligible.filter((s: any) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || s.currentClass === classFilter;
    return matchesSearch && matchesClass;
  });
  const eligiblePageCount = Math.ceil(filteredEligible.length / PAGE_SIZE) || 1;
  const pagedEligible = filteredEligible.slice(
    (eligiblePage - 1) * PAGE_SIZE,
    eligiblePage * PAGE_SIZE
  );

  // Filter and paginate ineligible students
  const filteredIneligible = actuallyIneligible.filter((s: any) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || s.currentClass === classFilter;
    return matchesSearch && matchesClass;
  });
  const ineligiblePageCount =
    Math.ceil(filteredIneligible.length / PAGE_SIZE) || 1;
  const pagedIneligible = filteredIneligible.slice(
    (ineligiblePage - 1) * PAGE_SIZE,
    ineligiblePage * PAGE_SIZE
  );

  function renderBalanceCell(balance: number) {
    if (balance < 0) {
      return (
        <span className="text-green-700 font-semibold">
          Credit: KES {Math.abs(balance).toLocaleString()}
        </span>
      );
    }
    if (balance > 0) {
      return (
        <span className="text-red-700 font-semibold">
          Outstanding: KES {balance.toLocaleString()}
        </span>
      );
    }
    return <span>Balance: KES 0</span>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">
        Preview Eligible/Ineligible Students
      </h2>
      {(!selectedAcademicYear || !selectedTerm) && (
        <div className="text-red-600 mb-4">
          Please select an academic year and term first.
        </div>
      )}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {/* Search and filter controls */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            className="border rounded px-2 py-1"
            placeholder="Name or Admission #"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setEligiblePage(1);
              setIneligiblePage(1);
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            className="border rounded px-2 py-1"
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setEligiblePage(1);
              setIneligiblePage(1);
            }}
          >
            <option value="">All</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-bold mb-2">Eligible Students</h3>
        <table className="min-w-full border mb-2">
          <thead>
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Admission #</th>
              <th className="border px-2 py-1">From Class</th>
              <th className="border px-2 py-1">To Class</th>
              <th className="border px-2 py-1">Performance Summary</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedEligible.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No eligible students found.
                </td>
              </tr>
            )}
            {pagedEligible.map((s: any) => (
              <tr key={s.id}>
                <td className="border px-2 py-1">{s.name}</td>
                <td className="border px-2 py-1">{s.admissionNumber}</td>
                <td className="border px-2 py-1">
                  {s.fromClass || s.currentClass || "-"}
                </td>
                <td className="border px-2 py-1">{s.toClass || "-"}</td>
                <td className="border px-2 py-1">
                  Grade: {s.grade || "-"} • Attendance: {s.attendance || "-"}% •{" "}
                  {renderBalanceCell(studentBalances[s.id] ?? 0)}
                </td>
                <td className="border px-2 py-1">
                  {/* Only show Exclude for eligible students not already excluded */}
                  {!excludedIds.includes(s.id) && (
                    <button
                      className="text-red-600 underline"
                      onClick={() => openModal("exclude", s)}
                    >
                      Exclude
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination for eligible */}
        <div className="flex gap-2 items-center justify-end mb-4">
          <button
            className="px-2 py-1 border rounded"
            onClick={() => setEligiblePage((p) => Math.max(1, p - 1))}
            disabled={eligiblePage === 1}
          >
            Prev
          </button>
          <span>
            Page {eligiblePage} of {eligiblePageCount}
          </span>
          <button
            className="px-2 py-1 border rounded"
            onClick={() =>
              setEligiblePage((p) => Math.min(eligiblePageCount, p + 1))
            }
            disabled={eligiblePage === eligiblePageCount}
          >
            Next
          </button>
        </div>
        <h3 className="font-bold mb-2">Ineligible Students</h3>
        <table className="min-w-full border mb-2">
          <thead>
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Admission #</th>
              <th className="border px-2 py-1">From Class</th>
              <th className="border px-2 py-1">To Class</th>
              <th className="border px-2 py-1">Performance Summary</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedIneligible.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No ineligible students found.
                </td>
              </tr>
            )}
            {pagedIneligible.map((s: any) => (
              <tr key={s.id}>
                <td className="border px-2 py-1">{s.name}</td>
                <td className="border px-2 py-1">{s.admissionNumber}</td>
                <td className="border px-2 py-1">
                  {s.fromClass || s.currentClass || "-"}
                </td>
                <td className="border px-2 py-1">
                  {s.toClass || s.fromClass || s.currentClass || "-"}
                </td>
                <td className="border px-2 py-1">
                  Grade: {s.grade || "-"} • Attendance: {s.attendance || "-"}% •{" "}
                  {renderBalanceCell(studentBalances[s.id] ?? 0)}
                </td>
                <td className="border px-2 py-1">
                  {/* Only show Override for ineligible students not already overridden */}
                  {!overriddenIds.includes(s.id) && (
                    <button
                      className="text-yellow-600 underline mr-2"
                      onClick={() => openModal("override", s)}
                    >
                      Override
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination for ineligible */}
        <div className="flex gap-2 items-center justify-end">
          <button
            className="px-2 py-1 border rounded"
            onClick={() => setIneligiblePage((p) => Math.max(1, p - 1))}
            disabled={ineligiblePage === 1}
          >
            Prev
          </button>
          <span>
            Page {ineligiblePage} of {ineligiblePageCount}
          </span>
          <button
            className="px-2 py-1 border rounded"
            onClick={() =>
              setIneligiblePage((p) => Math.min(ineligiblePageCount, p + 1))
            }
            disabled={ineligiblePage === ineligiblePageCount}
          >
            Next
          </button>
        </div>
      </div>
      {/* Modal for Override/Exclude */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">
              {modalAction === "override"
                ? "Override Eligibility"
                : "Exclude Student"}
            </h3>
            <div className="mb-2">
              <div className="font-medium">{modalStudent?.name}</div>
              <div className="text-sm text-gray-500">
                Admission #: {modalStudent?.admissionNumber}
              </div>
              <div className="text-sm text-gray-500">
                Class: {modalStudent?.currentClass}
              </div>
            </div>
            <div className="mb-2">
              <label className="block mb-1">Reason/Note</label>
              <textarea
                className="border rounded px-2 py-1 w-full min-h-[60px]"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder={
                  modalAction === "override"
                    ? "Reason for override..."
                    : "Reason for exclusion..."
                }
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded border" onClick={closeModal}>
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  modalAction === "override" ? "bg-yellow-600" : "bg-red-600"
                }`}
                onClick={handleModalConfirm}
                disabled={modalLoading || !modalNote.trim()}
              >
                {modalLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
