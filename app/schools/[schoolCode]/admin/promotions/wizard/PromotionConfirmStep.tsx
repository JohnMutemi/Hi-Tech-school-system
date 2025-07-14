import React, { useContext, useState } from "react";
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

  const { toast } = useToast();

  // Calculate summary
  const numPromoted = eligibleStudents.length - Object.keys(exclusions).length;
  const numExcluded = Object.keys(exclusions).length;
  const numOverrides = Object.keys(overrides).length;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // Prepare student IDs, apply exclusions/overrides as needed
      const studentIds = eligibleStudents
        .filter((s: any) => !exclusions[s.id])
        .map((s: any) => s.id);
      const body = {
        studentIds,
        currentYear: selectedAcademicYear,
        promotedBy: "admin", // TODO: Replace with actual user ID
        overrides,
        exclusions,
      };
      const res = await fetch(`/api/schools/${schoolCode}/promotions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Promotion failed");
      setSuccess(true);
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
          Academic Year: <b>{selectedAcademicYear}</b>
        </div>
        <div>
          Term: <b>{selectedTerm}</b>
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
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center min-w-[140px]"
        onClick={handleConfirm}
        disabled={loading || confirmationInput !== "CONFIRM"}
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
