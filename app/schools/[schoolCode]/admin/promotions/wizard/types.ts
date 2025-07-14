// Shared types and interfaces for the Promotion Wizard
export interface WizardState {
  selectedAcademicYear?: string;
  selectedTerm?: string;
  criteriaList?: any[];
  eligibleStudents?: any[];
  ineligibleStudents?: any[];
  overrides?: any;
  exclusions?: any;
  promotionSummary?: any;
  promotionResults?: any;
  logs?: any;
} 