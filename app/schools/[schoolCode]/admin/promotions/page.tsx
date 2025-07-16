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
  Settings,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  classLevel: string;
  className: string;
  eligibility: {
    feeStatus: string;
    allTermsPaid: boolean;
    meetsCriteria: boolean;
    outstandingBalance: number;
    totalFees: number;
    totalPaid: number;
  };
  carryForwardArrears?: number;
}

interface PromotionExclusion {
  studentId: string;
  reason: string;
  notes?: string;
}

export default function PromotionsPage() {
  const params = useParams();
  const { schoolCode } = params;
  const { toast } = useToast();

  const [step, setStep] = useState<
    "select" | "review" | "confirm" | "complete" | "settings"
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

  // Settings state
  const [settingsTab, setSettingsTab] = useState<"criteria" | "progression">("criteria");
  const [criteria, setCriteria] = useState<any[]>([]);
  const [progression, setProgression] = useState<any[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  // Criteria form state
  const [criteriaForm, setCriteriaForm] = useState({
    classLevel: "",
    minGrade: "",
    attendance: "",
    feeStatus: "paid",
    isActive: true,
  });
  
  // Progression form state
  const [progressionForm, setProgressionForm] = useState({
    fromClass: "",
    toClass: "",
    order: 1,
    isActive: true,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadEligibleStudents();
      determineNextClass();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (step === "settings") {
      loadSettings();
    }
  }, [step]);

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
      if (Array.isArray(data)) {
        setEligibleStudents(data);
        // Auto-select all eligible students
        setSelectedStudents(data.map((student: Student) => student.id));
      } else {
        setEligibleStudents([]);
        setSelectedStudents([]);
        toast({
          title: "Error",
          description: data.error || "Failed to load eligible students",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load eligible students:", error);
      toast({
        title: "Error",
        description: "Failed to load eligible students",
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
    setSelectedStudents(checked ? eligibleStudents.map((s) => s.id) : []);
  };

  const excludeStudent = (student: Student) => {
    setCurrentStudent(student);
    setShowExclusionDialog(true);
  };

  const confirmExclusion = (reason: string, notes?: string) => {
    if (!currentStudent) return;

    const exclusion: PromotionExclusion = {
      studentId: currentStudent.id,
      reason,
      notes,
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
          fromClass: selectedClass,
          toClass: nextClass,
          studentIds: selectedStudents,
          excludedStudents,
          promotedBy: "admin", // TODO: Get actual user ID
          notes: `Bulk promotion from ${selectedClass} to ${nextClass}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("complete");
        const carryForwardMessage =
          result.carryForwardCount > 0
            ? ` Fee balances of KES ${result.totalCarriedForward.toLocaleString()} were carried forward for ${
                result.carryForwardCount
              } student(s).`
            : "";

        toast({
          title: "Promotion Successful",
          description: `Successfully promoted ${result.promotedCount} students.${carryForwardMessage}`,
        });
      } else {
        throw new Error(result.error);
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

  const getEligibilityBadge = (student: Student) => {
    if (student.eligibility.allTermsPaid) {
      return <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>;
    }
    if (student.eligibility.outstandingBalance > 0) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          Arrears: KES {student.eligibility.outstandingBalance.toLocaleString()}
        </Badge>
      );
    }
    return <Badge variant="destructive">Fee Arrears</Badge>;
  };

  const getExclusionReasonLabel = (reason: string) => {
    const reasons = {
      fees: "Fee Arrears",
      disciplinary: "Disciplinary Issues",
      parent_request: "Parent Request",
      attendance: "Poor Attendance",
      other: "Other",
    };
    return reasons[reason as keyof typeof reasons] || reason;
  };

  // Settings functions
  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      // Load criteria
      const criteriaResponse = await fetch(
        `/api/schools/${schoolCode}/promotions?action=criteria`
      );
      const criteriaData = await criteriaResponse.json();
      setCriteria(Array.isArray(criteriaData) ? criteriaData : []);

      // Load progression
      const progressionResponse = await fetch(
        `/api/schools/${schoolCode}/promotions?action=progression`
      );
      const progressionData = await progressionResponse.json();
      setProgression(Array.isArray(progressionData) ? progressionData : []);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load promotion settings",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveCriteria = async () => {
    if (!criteriaForm.classLevel) {
      toast({
        title: "Error",
        description: "Please select a class level",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "criteria",
          data: {
            ...criteriaForm,
            minGrade: criteriaForm.minGrade ? parseFloat(criteriaForm.minGrade) : null,
            attendance: criteriaForm.attendance ? parseInt(criteriaForm.attendance) : null,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promotion criteria saved successfully",
        });
        setCriteriaForm({
          classLevel: "",
          minGrade: "",
          attendance: "",
          feeStatus: "paid",
          isActive: true,
        });
        loadSettings();
      } else {
        throw new Error("Failed to save criteria");
      }
    } catch (error) {
      console.error("Failed to save criteria:", error);
      toast({
        title: "Error",
        description: "Failed to save promotion criteria",
        variant: "destructive",
      });
    }
  };

  const saveProgression = async () => {
    if (!progressionForm.fromClass || !progressionForm.toClass) {
      toast({
        title: "Error",
        description: "Please fill in both from and to classes",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "progression",
          data: progressionForm,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Class progression saved successfully",
        });
        setProgressionForm({
          fromClass: "",
          toClass: "",
          order: 1,
          isActive: true,
        });
        loadSettings();
      } else {
        throw new Error("Failed to save progression");
      }
    } catch (error) {
      console.error("Failed to save progression:", error);
      toast({
        title: "Error",
        description: "Failed to save class progression",
        variant: "destructive",
      });
    }
  };

  if (step === "settings") {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => setStep("select")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Promotions
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Promotion Settings</h1>
          <p className="text-gray-600">
            Configure promotion criteria and class progression rules
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Promotion Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Promotion Criteria
              </CardTitle>
              <CardDescription>
                Set minimum requirements for student promotion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSettings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading criteria...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add New Criteria Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Add New Criteria</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Class Level
                        </label>
                        <Select
                          value={criteriaForm.classLevel}
                          onValueChange={(value) =>
                            setCriteriaForm({ ...criteriaForm, classLevel: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class level" />
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
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Minimum Grade (Optional)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={criteriaForm.minGrade}
                          onChange={(e) =>
                            setCriteriaForm({ ...criteriaForm, minGrade: e.target.value })
                          }
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., 50.0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Minimum Attendance % (Optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={criteriaForm.attendance}
                          onChange={(e) =>
                            setCriteriaForm({ ...criteriaForm, attendance: e.target.value })
                          }
                          className="w-full p-2 border rounded-md"
                          placeholder="e.g., 80"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Fee Status Requirement
                        </label>
                        <Select
                          value={criteriaForm.feeStatus}
                          onValueChange={(value) =>
                            setCriteriaForm({ ...criteriaForm, feeStatus: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Fully Paid</SelectItem>
                            <SelectItem value="partial">Partially Paid</SelectItem>
                            <SelectItem value="any">Any Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={saveCriteria} className="w-full">
                      Save Criteria
                    </Button>
                  </div>

                  {/* Existing Criteria */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Criteria</h3>
                    {criteria.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No criteria set. Add criteria above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {criteria.map((criterion) => (
                          <div
                            key={criterion.id}
                            className="p-3 border rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{criterion.classLevel}</p>
                                <p className="text-sm text-gray-600">
                                  Min Grade: {criterion.minGrade || "Not set"} | 
                                  Attendance: {criterion.attendance || "Not set"}% | 
                                  Fees: {criterion.feeStatus}
                                </p>
                              </div>
                              <Badge variant={criterion.isActive ? "default" : "secondary"}>
                                {criterion.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Progression */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Class Progression
              </CardTitle>
              <CardDescription>
                Define which classes promote to which
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSettings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Loading progression...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add New Progression Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Add New Progression</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          From Class
                        </label>
                        <Select
                          value={progressionForm.fromClass}
                          onValueChange={(value) =>
                            setProgressionForm({ ...progressionForm, fromClass: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select from class" />
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
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          To Class
                        </label>
                        <Select
                          value={progressionForm.toClass}
                          onValueChange={(value) =>
                            setProgressionForm({ ...progressionForm, toClass: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select to class" />
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Order
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={progressionForm.order}
                          onChange={(e) =>
                            setProgressionForm({ ...progressionForm, order: parseInt(e.target.value) })
                          }
                          className="w-full p-2 border rounded-md"
                          placeholder="1"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={progressionForm.isActive}
                            onChange={(e) =>
                              setProgressionForm({ ...progressionForm, isActive: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                      </div>
                    </div>
                    <Button onClick={saveProgression} className="w-full">
                      Save Progression
                    </Button>
                  </div>

                  {/* Existing Progression */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Progression</h3>
                    {progression.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No progression rules set. Add progression above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {progression
                          .sort((a, b) => a.order - b.order)
                          .map((prog) => (
                            <div
                              key={prog.id}
                              className="p-3 border rounded-lg bg-gray-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{prog.fromClass}</span>
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{prog.toClass}</span>
                                  <span className="text-sm text-gray-500">
                                    (Order: {prog.order})
                                  </span>
                                </div>
                                <Badge variant={prog.isActive ? "default" : "secondary"}>
                                  {prog.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Promotion Complete!</CardTitle>
            <CardDescription>
              The bulk promotion has been successfully executed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <p className="text-lg">
                <strong>{selectedStudents.length}</strong> students promoted
                from {selectedClass} to {nextClass}
              </p>
              {excludedStudents.length > 0 && (
                <p className="text-gray-600">
                  <strong>{excludedStudents.length}</strong> students were
                  excluded from promotion
                </p>
              )}
              {/* Fee Carry-Forward Summary */}
              {(() => {
                const studentsWithArrears = eligibleStudents.filter(
                  (student) =>
                    selectedStudents.includes(student.id) &&
                    student.eligibility.outstandingBalance > 0
                );
                const totalArrears = studentsWithArrears.reduce(
                  (sum, student) =>
                    sum + student.eligibility.outstandingBalance,
                  0
                );

                if (studentsWithArrears.length > 0) {
                  return (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">
                          Fee Arrears Carried Forward
                        </p>
                      </div>
                      <p className="text-sm text-blue-700">
                        <strong>{studentsWithArrears.length}</strong> student(s)
                        had outstanding balances totaling{" "}
                        <strong className="text-red-600">
                          KES {totalArrears.toLocaleString()}
                        </strong>{" "}
                        that were automatically carried forward to the new
                        academic year.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setStep("select")}>
                  Start New Promotion
                </Button>
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
          <Button
            variant="outline"
            onClick={() => setStep("settings")}
            className="ml-auto"
          >
            <Settings className="w-4 h-4 mr-2" />
            Promotion Settings
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          Student Promotion Management
        </h1>
        <p className="text-gray-600">
          Manage bulk student promotions with individual exclusions
        </p>
      </div>

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
                <label className="block text-sm font-medium mb-2">
                  Current Class
                </label>
                <Select onValueChange={setSelectedClass} value={selectedClass}>
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

              {selectedClass && nextClass && (
                <div className="flex items-center gap-2 text-lg">
                  <span>{selectedClass}</span>
                  <ArrowRight className="w-5 h-5" />
                  <span className="font-semibold text-blue-600">
                    {nextClass}
                  </span>
                </div>
              )}

              {selectedClass && (
                <Button
                  onClick={() => setStep("review")}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Loading..." : "Continue to Review"}
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
              <CardTitle>Step 2: Review and Modify Selection</CardTitle>
              <CardDescription>
                Review eligible students and exclude any that shouldn't be
                promoted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedStudents.length === eligibleStudents.length
                    }
                    onCheckedChange={toggleAllStudents}
                  />
                  <span>
                    Select All ({selectedStudents.length} of{" "}
                    {eligibleStudents.length})
                  </span>
                </div>
                <Badge variant="outline">{nextClass}</Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Current Class</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleStudents.map((student) => {
                      // Support multi-year arrears if present
                      const carryForwardArrears =
                        student.carryForwardArrears || 0;
                      const totalOutstanding =
                        (student.eligibility?.outstandingBalance || 0) +
                        carryForwardArrears;
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => toggleStudent(student.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {student.className}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.classLevel}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {totalOutstanding > 0 ? (
                              <Badge
                                variant="destructive"
                                className="bg-red-100 text-red-800"
                              >
                                Arrears: KES {totalOutstanding.toLocaleString()}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                Fully Paid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {totalOutstanding > 0 ? (
                              <div className="text-red-600 font-medium">
                                KES {totalOutstanding.toLocaleString()}
                                {carryForwardArrears > 0 && (
                                  <div className="text-xs text-yellow-700 mt-1">
                                    (Includes KES{" "}
                                    {carryForwardArrears.toLocaleString()} from
                                    previous years)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-green-600 font-medium">
                                No Balance
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => excludeStudent(student)}
                              disabled={!selectedStudents.includes(student.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {excludedStudents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Excluded Students
                  </h3>
                  <div className="space-y-2">
                    {excludedStudents.map((exclusion) => {
                      const student = eligibleStudents.find(
                        (s) => s.id === exclusion.studentId
                      );
                      return (
                        <div
                          key={exclusion.studentId}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{student?.name}</p>
                            <p className="text-sm text-gray-600">
                              Reason:{" "}
                              {getExclusionReasonLabel(exclusion.reason)}
                              {exclusion.notes && ` - ${exclusion.notes}`}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeExclusion(exclusion.studentId)}
                          >
                            Include
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
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
            </CardContent>
          </Card>
        </div>
      )}

      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Confirm Promotion</CardTitle>
            <CardDescription>
              Review the final promotion details before executing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">From Class</p>
                  <p className="text-lg font-semibold">{selectedClass}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">To Class</p>
                  <p className="text-lg font-semibold">{nextClass}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Students to Promote</p>
                  <p className="text-2xl font-bold text-green-700">
                    {selectedStudents.length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Students Excluded</p>
                  <p className="text-2xl font-bold text-red-700">
                    {excludedStudents.length}
                  </p>
                </div>
              </div>

              {/* Fee Carry-Forward Summary */}
              {(() => {
                const studentsWithArrears = eligibleStudents.filter(
                  (student) =>
                    selectedStudents.includes(student.id) &&
                    student.eligibility.outstandingBalance > 0
                );
                const totalArrears = studentsWithArrears.reduce(
                  (sum, student) =>
                    sum + student.eligibility.outstandingBalance,
                  0
                );

                if (studentsWithArrears.length > 0) {
                  return (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm font-medium text-yellow-800">
                          Fee Arrears Carry-Forward
                        </p>
                      </div>
                      <p className="text-sm text-yellow-700 mb-2">
                        {studentsWithArrears.length} student(s) have outstanding
                        balances that will be carried forward:
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-yellow-600">
                            Students with arrears:
                          </span>
                          <span className="font-medium ml-2">
                            {studentsWithArrears.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-yellow-600">
                            Total to carry forward:
                          </span>
                          <span className="font-medium ml-2 text-red-600">
                            KES {totalArrears.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep("review")}>
                  Back to Review
                </Button>
                <Button
                  onClick={executePromotion}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading
                    ? "Executing..."
                    : `Promote ${selectedStudents.length} Students`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exclusion Dialog */}
      <Dialog open={showExclusionDialog} onOpenChange={setShowExclusionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exclude Student from Promotion</DialogTitle>
            <DialogDescription>
              Exclude {currentStudent?.name} from bulk promotion to {nextClass}
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

// Exclusion Form Component
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
    if (reason) {
      onConfirm(reason, notes);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Reason for Exclusion
        </label>
        <Select onValueChange={setReason} value={reason}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="academic">Academic Performance</SelectItem>
            <SelectItem value="fees">Fee Arrears</SelectItem>
            <SelectItem value="disciplinary">Disciplinary Issues</SelectItem>
            <SelectItem value="parent_request">Parent Request</SelectItem>
            <SelectItem value="attendance">Poor Attendance</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Additional Notes
        </label>
        <textarea
          className="w-full p-3 border rounded-md"
          rows={3}
          placeholder="Provide additional context..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!reason}>
          Exclude Student
        </Button>
      </DialogFooter>
    </div>
  );
}
