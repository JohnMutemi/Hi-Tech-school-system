/** Internal login email for a student portal account (not the guardian contact email). */
export function buildStudentLoginEmail(
  admissionNumber: string,
  schoolCode: string
): string {
  const normalizedAdmission = String(admissionNumber)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  const normalizedSchoolCode = schoolCode.trim().toLowerCase();
  return `student-${normalizedAdmission}-${normalizedSchoolCode}@student.local`;
}
