import React, { useContext } from "react";
import { PromotionWizardContext } from "./PromotionWizard";
import { useParams } from "next/navigation";
import { AcademicYearTermSelector } from "@/components/school-portal/AcademicYearTermSelector";

export default function AcademicYearStep() {
  const { wizardState, setWizardState } = useContext(PromotionWizardContext);
  const params = useParams();
  const schoolCode = params.schoolCode as string;

  return (
    <AcademicYearTermSelector
      schoolCode={schoolCode}
      onSelect={(year, term) => {
        setWizardState((prev: any) => ({
          ...prev,
          selectedAcademicYear: year,
          selectedTerm: term,
        }));
      }}
    />
  );
}
