import React, { useContext, useState, useEffect } from "react";
import { PromotionWizardContext } from "./PromotionWizard";
import { useToast } from "@/hooks/use-toast";

// Replace with your actual schoolCode prop or context
const schoolCode =
  typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";

export default function PromotionConfirmStep() {
  const { wizardState, setWizardState } = useContext(PromotionWizardContext);
  const {
    selectedAcademicYear,
    selectedTerm,
    eligibleStudents = [],
    ineligibleStudents = [],
    overrides = {},
    exclusions = {},
  } = wizardState;
  const [confirmationInput, setConfirmationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [promotionResult, setPromotionResult] = useState<any>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminSession() {
      const res = await fetch(`/api/schools/${schoolCode}/admin/session`);
      if (res.ok) {
        const data = await res.json();
        setAdminId(data.adminId);
      }
    }
    fetchAdminSession();
  }, [schoolCode]);

  useEffect(() => {
    // Log wizard state when confirmation step is mounted
    console.log("Wizard state on mount (confirmation step):", wizardState);
  }, [wizardState]);

  const { toast } = useToast();

  // Calculate summary
  const numPromoted = eligibleStudents.length - Object.keys(exclusions).length;
  const numExcluded = Object.keys(exclusions).length;
  const numOverrides = Object.keys(overrides).length;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    setSuccess(false);
    // Log the full wizard state for debugging
    console.log("Wizard state at confirmation:", wizardState);
    try {
      // Build students array for bulk promotion
      const students = eligibleStudents
        .filter((s: any) => !exclusions[s.id])
        .map((s: any) => ({
          studentId: s.id,
          fromClass: s.currentClass || s.fromClass || "",
          toClass: s.toClass || s.nextClass || (s.isGraduating ? "Alumni" : ""),
          manualOverride: !!overrides[s.id],
          overrideReason: overrides[s.id]?.note || "",
          notes: "",
          criteriaId: s.criteriaId || undefined,
          outstandingBalance: s.outstandingBalance ?? 0, // Ensure balance is included
        }));
      // Prepare ineligible students array (all, with balances)
      const ineligible = ineligibleStudents.map((s: any) => ({
        studentId: s.id,
        fromClass: s.currentClass || s.fromClass || "",
        toClass: s.toClass || s.nextClass || (s.isGraduating ? "Alumni" : ""),
        outstandingBalance: s.outstandingBalance ?? 0,
      }));
      const body = {
        students,
        ineligibleStudents: ineligible,
        promotedBy: adminId, // Use the real admin user ID
      };
      console.log("Sending students array to backend:", students); // DEBUG
      console.log("Sending ineligibleStudents array to backend:", ineligible); // DEBUG
      const res = await fetch(`/api/schools/${schoolCode}/promotions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Promotion failed");
      setSuccess(true);
      setPromotionResult(result);
      setWizardState((prev: any) => ({ ...prev, promotionResults: result }));
      toast({
        title: "Promotion Complete!",
        description: `Promoted: ${result.promoted?.length ?? 0}, Excluded: ${
          result.excluded?.length ?? 0
        }, Errors: ${result.errors?.length ?? 0}`,
        variant: "success",
      });
    } catch (e: any) {
      setError(e.message || "Failed to execute promotion.");
      toast({
        title: "Promotion Failed",
        description: e.message || "Failed to execute promotion.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">
        Confirm and Execute Promotion
      </h2>
      <div className="mb-4">
        <div>
          Academic Year: <b>{selectedAcademicYear?.name}</b>
        </div>
        <div>
          Term: <b>{selectedTerm?.name}</b>
        </div>
        <div>
          To be promoted: <b>{numPromoted}</b>
        </div>
        <div>
          Excluded: <b>{numExcluded}</b>
        </div>
        <div>
          Overrides: <b>{numOverrides}</b>
        </div>
      </div>
      <div className="mb-4">
        <label className="block mb-2">
          Type <b>CONFIRM</b> to proceed:
        </label>
        <input
          type="text"
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && (
        <div className="text-green-600 mb-2">
          Promotion executed successfully!
        </div>
      )}
      {promotionResult?.excluded?.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Excluded Students:</h4>
          <ul className="text-sm text-red-700">
            {promotionResult.excluded.map((ex: any, i: number) => (
              <li key={i}>
                {ex.studentId}: {ex.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center min-w-[140px]"
        onClick={handleConfirm}
        disabled={loading || confirmationInput !== "CONFIRM" || !adminId}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white mr-2"
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
            Promoting...
          </>
        ) : (
          "Confirm Promotion"
        )}
      </button>
    </div>
  );
}
