"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  GraduationCap,
  ArrowLeft,
  AlertTriangle,
  Info,
  Settings,
  TrendingUp,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  classLevel: string;
  className: string;
  eligibility: {
    isEligible: boolean;
    primaryCriteria?: string;
    allCriteriaResults: Array<{
      criteriaId: string;
      criteriaName: string;
      passed: boolean;
      failedReasons: string[];
      details: {
        averageGrade?: number;
        outstandingBalance?: number;
        attendanceRate?: number;
        disciplinaryCases?: number;
      };
    }>;
    summary: {
      averageGrade: number;
      attendanceRate: number;
      outstandingBalance: number;
      disciplinaryCases: number;
      totalFees: number;
      totalPaid: number;
    };
  };
}

interface PromotionExclusion {
  studentId: string;
  reason: string;
  detailedReason?: string;
  criteriaFailed?: any;
  notes?: string;
}

export default function PromotionsPage() {
  const params = useParams();
  const { schoolCode } = params;
  const { toast } = useToast();

  const [step, setStep] = useState<
    "select" | "review" | "confirm" | "complete"
  >("select");
  const [selectedClass, setSelectedClass] = useState("");
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [excludedStudents, setExcludedStudents] = useState<
    PromotionExclusion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [nextClass, setNextClass] = useState("");
  const [showExclusionDialog, setShowExclusionDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [showCriteriaDetails, setShowCriteriaDetails] = useState<string | null>(null);
  const [hasCriteria, setHasCriteria] = useState<boolean>(false);
  const [promotionMessage, setPromotionMessage] = useState<string>("");
  const [showSchoolWideDialog, setShowSchoolWideDialog] = useState(false);
  const [schoolWideResult, setSchoolWideResult] = useState<any>(null);
  const [schoolWideLoading, setSchoolWideLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadEligibleStudents();
      determineNextClass();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/classes`);
      const data = await response.json();
      const classNames = data.map((cls: any) => cls.name);
      setClasses(classNames);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  };

  const loadEligibleStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/schools/${schoolCode}/promotions?action=eligible-students&classLevel=${selectedClass}`
      );
      const data = await response.json();
      
      // Handle potential API errors
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load eligible students');
      }
      
      // Handle new API response structure
      if (data.students && Array.isArray(data.students)) {
        setEligibleStudents(data.students);
        setHasCriteria(data.hasCriteria || false);
        setPromotionMessage(data.message || "");
        
        // Auto-select all eligible students
        setSelectedStudents(data.students.filter((student: Student) => student.eligibility?.isEligible).map((student: Student) => student.id));
        
        // Show message about criteria status
        if (data.message) {
          toast({
            title: data.hasCriteria ? "Criteria Applied" : "Manual Promotion Mode",
            description: data.message,
            variant: data.hasCriteria ? "default" : "default",
          });
        }
      } else if (Array.isArray(data)) {
        // Fallback for old API format
        setEligibleStudents(data);
        setHasCriteria(true); // Assume criteria exist for old format
        setPromotionMessage("");
        setSelectedStudents(data.filter((student: Student) => student.eligibility?.isEligible).map((student: Student) => student.id));
      } else {
        console.error('API returned invalid data:', data);
        setEligibleStudents([]);
        setHasCriteria(false);
        setPromotionMessage("");
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load eligible students:", error);
      setEligibleStudents([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load eligible students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const determineNextClass = async () => {
    try {
      const response = await fetch(
        `/api/schools/${schoolCode}/promotions?action=progression`
      );
      const progression = await response.json();
      const currentIndex = progression.findIndex(
        (p: any) => p.fromClass === selectedClass
      );
      if (currentIndex !== -1 && currentIndex < progression.length - 1) {
        setNextClass(progression[currentIndex + 1].toClass);
      } else {
        // Fallback to simple increment
        const currentGrade = selectedClass.match(/\d+/)?.[0];
        if (currentGrade) {
          const nextGrade = parseInt(currentGrade) + 1;
          setNextClass(selectedClass.replace(/\d+/, nextGrade.toString()));
        }
      }
    } catch (error) {
      console.error("Failed to determine next class:", error);
      // Fallback to simple increment
      const currentGrade = selectedClass.match(/\d+/)?.[0];
      if (currentGrade) {
        const nextGrade = parseInt(currentGrade) + 1;
        setNextClass(selectedClass.replace(/\d+/, nextGrade.toString()));
      }
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudents = (checked: boolean) => {
    const eligibleStudentIds = (eligibleStudents || [])
      .filter(student => student.eligibility?.isEligible)
      .map(student => student.id);
    setSelectedStudents(checked ? eligibleStudentIds : []);
  };

  const excludeStudent = (student: Student) => {
    setCurrentStudent(student);
    setShowExclusionDialog(true);
  };

  const confirmExclusion = (reason: string, notes?: string) => {
    if (!currentStudent) return;

          const failedCriteria = currentStudent.eligibility?.allCriteriaResults
        ?.filter(result => !result.passed)
        .map(result => ({
          criteriaName: result.criteriaName,
          reasons: result.failedReasons
        })) || [];

    const exclusion: PromotionExclusion = {
      studentId: currentStudent.id,
      reason,
      detailedReason: notes,
      criteriaFailed: failedCriteria,
    };

    setExcludedStudents((prev) => [...prev, exclusion]);
    setSelectedStudents((prev) =>
      prev.filter((id) => id !== currentStudent.id)
    );
    setShowExclusionDialog(false);
    setCurrentStudent(null);
  };

  const removeExclusion = (studentId: string) => {
    setExcludedStudents((prev) =>
      prev.filter((e) => e.studentId !== studentId)
    );
    setSelectedStudents((prev) => [...prev, studentId]);
  };

  // Update: handle new API response structure for class-by-class promotion
  const executePromotion = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to promote",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-promotion",
          data: {
            fromClass: selectedClass,
            toClass: nextClass,
            studentIds: selectedStudents,
            promotedBy: "admin", // TODO: Get actual user ID
          },
        }),
      });

      const result = await response.json();

      if (result.promoted) {
        setStep("complete");
        toast({
          title: "Promotion Complete!",
          description: `Promoted: ${result.promoted.length}, Excluded: ${result.excluded.length}, Errors: ${result.errors.length}`,
        });
        setPromotionMessage(
          `Promoted: ${result.promoted.length}, Excluded: ${result.excluded.length}, Errors: ${result.errors.length}`
        );
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error: any) {
      toast({
        title: "Promotion Failed",
        description: error.message || "Failed to execute promotion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update: handle new API response structure for school-wide promotion
  const executeSchoolWidePromotion = async () => {
    setSchoolWideLoading(true);
    setSchoolWideResult(null);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "school-wide-bulk-promotion",
          data: { promotedBy: "admin" }, // TODO: Replace with actual user ID
        }),
      });
      const result = await response.json();
      setSchoolWideResult(result);
      if (result.promoted) {
        toast({
          title: "School-Wide Promotion Complete!",
          description: `Promoted: ${result.promoted.length}, Excluded: ${result.excluded.length}, Errors: ${result.errors.length}`,
        });
      } else {
        toast({
          title: "School-Wide Promotion Failed",
          description: result.error || result.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "School-Wide Promotion Failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSchoolWideLoading(false);
    }
  };

  const getEligibilityBadge = (student: Student) => {
    if (student.eligibility?.isEligible) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Eligible
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Not Eligible
        </Badge>
      );
    }
  };

  const getExclusionReasonLabel = (reason: string) => {
    const reasons = {
      academic: "Academic Performance",
      fees: "Fee Arrears",
      disciplinary: "Disciplinary Issues",
      attendance: "Poor Attendance",
      parent_request: "Parent Request",
      other: "Other",
    };
    return reasons[reason as keyof typeof reasons] || reason;
  };

  const getCriteriaSummary = (student: Student) => {
    const summary = student.eligibility?.summary;
    if (!summary) return "No data available";
    
    const details = [];
    
    if (summary.averageGrade) details.push(`Grade: ${summary.averageGrade}%`);
    if (summary.attendanceRate) details.push(`Attendance: ${summary.attendanceRate}%`);
    if (summary.outstandingBalance > 0) details.push(`Balance: KES ${summary.outstandingBalance.toLocaleString()}`);
    if (summary.disciplinaryCases > 0) details.push(`Discipline: ${summary.disciplinaryCases} cases`);
    
    return details.length > 0 ? details.join(" • ") : "No performance data";
  };

  if (step === "complete") {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Promotion Complete!</CardTitle>
            <CardDescription>
              {promotionMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              {excludedStudents.length > 0 && (
                <div className="text-gray-600">
                  <strong>Excluded Students:</strong>
                  <ul className="list-disc list-inside">
                    {excludedStudents.map((ex, idx) => (
                      <li key={idx}>{ex.studentId}: {ex.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setStep("select")}>Start New Promotion</Button>
                <Button variant="outline" asChild>
                  <Link href={`/schools/${schoolCode}`}>Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href={`/schools/${schoolCode}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Student Promotion Management
            </h1>
            <p className="text-gray-600">
              Manage bulk student promotions with comprehensive eligibility criteria
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/schools/${schoolCode}/admin/promotion-criteria`}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Criteria
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowSchoolWideDialog(true)}
              disabled={schoolWideLoading}
            >
              Promote All Eligible Students (School-Wide)
            </Button>
          </div>
        </div>
      </div>

      {/* School-Wide Promotion Dialog */}
      <AlertDialog open={showSchoolWideDialog} onOpenChange={setShowSchoolWideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm School-Wide Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              This will promote <b>all eligible students in all classes</b> for this school. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={schoolWideLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeSchoolWidePromotion}
              disabled={schoolWideLoading}
            >
              {schoolWideLoading ? "Promoting..." : "Yes, Promote All"}
            </AlertDialogAction>
          </AlertDialogFooter>
          {schoolWideResult && (
            <div className="mt-4">
              {schoolWideResult.promoted ? (
                <div className="text-green-700">
                  <b>Promotion Complete!</b><br />
                  Promoted: {schoolWideResult.promoted.length}<br />
                  Excluded: {schoolWideResult.excluded.length}<br />
                  Errors: {schoolWideResult.errors.length}<br />
                  {schoolWideResult.excluded.length > 0 && (
                    <div className="text-gray-600 mt-2">
                      <strong>Excluded Students:</strong>
                      <ul className="list-disc list-inside">
                        {schoolWideResult.excluded.map((ex: any, idx: number) => (
                          <li key={idx}>{ex.studentId}: {ex.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {schoolWideResult.errors.length > 0 && (
                    <div className="text-red-600 mt-2">
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside">
                        {schoolWideResult.errors.map((err: string, idx: number) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-700">
                  <b>Promotion Failed:</b> {schoolWideResult.error || schoolWideResult.message}
                </div>
              )}
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Class for Promotion</CardTitle>
            <CardDescription>
              Choose the class level you want to promote students from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="class-select">Current Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClass && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">
                      Promotion Information
                    </p>
                  </div>
                  <p className="text-sm text-blue-700">
                    Students from <strong>{selectedClass}</strong> will be promoted to{" "}
                    <strong>{nextClass || "Next Class"}</strong> based on comprehensive eligibility criteria.
                  </p>
                </div>
              )}

              {selectedClass && (
                <Button
                  onClick={() => setStep("review")}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading Students...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Review Eligible Students
                    </div>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Step 2: Review Eligible Students</CardTitle>
                  <CardDescription>
                    Review and select students for promotion from {selectedClass} to {nextClass}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setStep("select")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Promotion Mode Banner */}
                {!hasCriteria && eligibleStudents.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Manual Promotion Mode</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      No promotion criteria are set for {selectedClass}. All students are available for manual promotion.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/schools/${schoolCode}/admin/promotion-criteria`}>
                          <Settings className="w-4 h-4 mr-2" />
                          Set Promotion Criteria
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/schools/${schoolCode}/admin/promotions`}>
                          Continue with Manual Promotion
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Eligible</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {(eligibleStudents || []).filter(s => s.eligibility?.isEligible).length}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Not Eligible</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {(eligibleStudents || []).filter(s => !s.eligibility?.isEligible).length}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Selected</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {selectedStudents.length}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Excluded</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                      {excludedStudents.length}
                    </p>
                  </div>
                </div>

                {/* Students Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Students</h3>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedStudents.length === (eligibleStudents || []).filter(s => s.eligibility?.isEligible).length}
                        onCheckedChange={toggleAllStudents}
                      />
                      <span className="text-sm text-gray-600">Select all eligible</span>
                    </div>
                  </div>

                  {eligibleStudents.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                      <p className="text-gray-600 mb-4">
                        {promotionMessage || `No students found in ${selectedClass} for the current academic year.`}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setStep("select")}>
                          Try Different Class
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/schools/${schoolCode}/admin/students`}>
                            View All Students
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Eligibility</TableHead>
                            <TableHead>Performance Summary</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(eligibleStudents || []).map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={() => toggleStudent(student.id)}
                                disabled={!student.eligibility?.isEligible}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-500">
                                  {student.admissionNumber} • {student.className}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getEligibilityBadge(student)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600 max-w-xs">
                                {getCriteriaSummary(student)}
                              </div>
                                                             {student.eligibility?.primaryCriteria && (
                                 <div className="text-xs text-blue-600 mt-1">
                                   Criteria: {student.eligibility.primaryCriteria}
                                 </div>
                               )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCriteriaDetails(student.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {!student.eligibility?.isEligible && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => excludeStudent(student)}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                                              </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Excluded Students */}
                {excludedStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Excluded Students</CardTitle>
                      <CardDescription>
                        Students manually excluded from promotion
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                                                  {excludedStudents.map((exclusion) => {
                            const student = (eligibleStudents || []).find(s => s.id === exclusion.studentId);
                          return (
                            <div key={exclusion.studentId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                              <div>
                                <div className="font-medium">{student?.name}</div>
                                <div className="text-sm text-red-600">
                                  Reason: {getExclusionReasonLabel(exclusion.reason)}
                                </div>
                                {exclusion.detailedReason && (
                                  <div className="text-sm text-gray-600">
                                    {exclusion.detailedReason}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeExclusion(exclusion.studentId)}
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setStep("select")}>
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep("confirm")}
                    disabled={selectedStudents.length === 0}
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Step 3: Confirm Promotion</CardTitle>
                <CardDescription>
                  Review the promotion details before executing
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setStep("review")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Promotion Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>From Class:</span>
                      <span className="font-medium">{selectedClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To Class:</span>
                      <span className="font-medium">{nextClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Students to Promote:</span>
                      <span className="font-medium">{selectedStudents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Excluded Students:</span>
                      <span className="font-medium">{excludedStudents.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Selected Students</h4>
                  <div className="space-y-1 text-sm">
                                            {(eligibleStudents || [])
                          .filter(student => selectedStudents.includes(student.id))
                          .slice(0, 5)
                          .map(student => (
                        <div key={student.id} className="flex justify-between">
                          <span>{student.name}</span>
                          <span className="text-green-600">✓</span>
                        </div>
                      ))}
                    {selectedStudents.length > 5 && (
                      <div className="text-sm text-gray-600">
                        ... and {selectedStudents.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setStep("review")}>
                  Back
                </Button>
                <Button
                  onClick={executePromotion}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Executing Promotion...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Execute Promotion
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criteria Details Dialog */}
      <Dialog open={!!showCriteriaDetails} onOpenChange={() => setShowCriteriaDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Eligibility Criteria Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown of promotion criteria evaluation
            </DialogDescription>
          </DialogHeader>
          {showCriteriaDetails && (() => {
            const student = (eligibleStudents || []).find(s => s.id === showCriteriaDetails);
            if (!student) return null;

            return (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{student.name}</h4>
                                     <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <span className="text-gray-600">Average Grade:</span>
                       <span className="ml-2 font-medium">{student.eligibility?.summary?.averageGrade || 'N/A'}%</span>
                     </div>
                     <div>
                       <span className="text-gray-600">Attendance:</span>
                       <span className="ml-2 font-medium">{student.eligibility?.summary?.attendanceRate || 'N/A'}%</span>
                     </div>
                     <div>
                       <span className="text-gray-600">Outstanding Balance:</span>
                       <span className="ml-2 font-medium">KES {(student.eligibility?.summary?.outstandingBalance || 0).toLocaleString()}</span>
                     </div>
                     <div>
                       <span className="text-gray-600">Disciplinary Cases:</span>
                       <span className="ml-2 font-medium">{student.eligibility?.summary?.disciplinaryCases || 0}</span>
                     </div>
                   </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Criteria Evaluation</h4>
                                     {(student.eligibility?.allCriteriaResults || []).map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{result.criteriaName}</span>
                        {result.passed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Passed
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      {result.failedReasons.length > 0 && (
                        <div className="text-sm text-red-600">
                          <div className="font-medium mb-1">Reasons:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {result.failedReasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Exclusion Dialog */}
      <Dialog open={showExclusionDialog} onOpenChange={setShowExclusionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exclude Student from Promotion</DialogTitle>
            <DialogDescription>
              Provide a reason for excluding {currentStudent?.name} from promotion
            </DialogDescription>
          </DialogHeader>
          <ExclusionForm
            onConfirm={confirmExclusion}
            onCancel={() => setShowExclusionDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExclusionForm({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string, notes?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason, notes.trim() || undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="reason">Reason for Exclusion</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic Performance</SelectItem>
            <SelectItem value="fees">Fee Arrears</SelectItem>
            <SelectItem value="disciplinary">Disciplinary Issues</SelectItem>
            <SelectItem value="attendance">Poor Attendance</SelectItem>
            <SelectItem value="parent_request">Parent Request</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Provide additional details..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!reason.trim()}>
          Confirm Exclusion
        </Button>
      </DialogFooter>
    </div>
  );
}
