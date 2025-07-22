import React, { useState, createContext, useContext, useEffect } from "react";
// Placeholder imports for steps
import AcademicYearStep from "./AcademicYearStep";
import PromotionCriteriaStep from "./PromotionCriteriaStep";
import PromotionPreviewStep from "./PromotionPreviewStep";
import PromotionConfirmStep from "./PromotionConfirmStep";
import PromotionResultsStep from "./PromotionResultsStep";
import NextClassStep from "./NextClassStep";

// Wizard context for sharing state
export const PromotionWizardContext = createContext(null);

const steps = [
  { label: "Academic Year", component: AcademicYearStep },
  { label: "Criteria", component: PromotionCriteriaStep },
  { label: "Preview", component: PromotionPreviewStep },
  { label: "Class Progression", component: NextClassStep },
  { label: "Confirm", component: PromotionConfirmStep },
  { label: "Results", component: PromotionResultsStep },
];

export default function PromotionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardState, setWizardState] = useState({
    eligibleStudents: [],
    ineligibleStudents: [],
    classList: [],
    schoolCode: "",
    // add other shared fields as needed
  });

  // Set schoolCode from URL if not already set
  useEffect(() => {
    if (!wizardState.schoolCode && typeof window !== "undefined") {
      const code = window.location.pathname.split("/")[2];
      if (code) {
        setWizardState((prev: any) => ({ ...prev, schoolCode: code }));
      }
    }
  }, [wizardState.schoolCode]);

  // Fetch class list at wizard start
  useEffect(() => {
    async function fetchClasses() {
      if (!wizardState.schoolCode) return;
      const res = await fetch(`/api/schools/${wizardState.schoolCode}/classes`);
      if (res.ok) {
        const data = await res.json();
        setWizardState((prev: any) => ({ ...prev, classList: data }));
      }
    }
    fetchClasses();
  }, [wizardState.schoolCode]);

  const StepComponent = steps[currentStep].component;

  return (
    <PromotionWizardContext.Provider value={{ wizardState, setWizardState }}>
      <div>
        {/* Upgraded Stepper UI */}
        <div className="flex items-center mb-8">
          {steps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full w-8 h-8 flex items-center justify-center border-2
                    ${
                      idx < currentStep
                        ? "bg-blue-600 border-blue-600 text-white"
                        : idx === currentStep
                        ? "bg-white border-blue-600 text-blue-600"
                        : "bg-gray-200 border-gray-300 text-gray-400"
                    }
                  `}
                >
                  {idx < currentStep ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs ${
                    idx === currentStep
                      ? "text-blue-600 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    idx < currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        {/* End Stepper UI */}
        <div className="my-8">
          <StepComponent />
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            Back
          </button>
          <button
            onClick={() =>
              setCurrentStep((s) => Math.min(steps.length - 1, s + 1))
            }
            disabled={currentStep === steps.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </PromotionWizardContext.Provider>
  );
}
