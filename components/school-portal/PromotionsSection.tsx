"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  Users, 
  CheckCircle, 
  Play, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  AlertTriangle,
  Info,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search
} from "lucide-react";

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
}

interface PromotionCriteria {
  id?: string;
  name: string;
  description?: string;
  minGrade: number;
  maxFeeBalance: number;
  maxDisciplinaryCases: number;
  academicYearId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface StudentEligibility {
  studentId: string;
  studentName: string;
  currentClass: string;
  currentGrade: string;
  averageGrade: number;
  feeBalance: number;
  disciplinaryCases: number;
  isEligible: boolean;
  reason?: string;
  userId: string;
  admissionNumber: string;
}

interface PromotionResult {
  promoted: StudentEligibility[];
  excluded: StudentEligibility[];
  summary: {
    totalStudents: number;
    promoted: number;
    excluded: number;
  };
}

interface PromotionHistory {
  id: string;
  studentName: string;
  fromClass: string;
  toClass: string;
  fromGrade: string;
  toGrade: string;
  fromYear: string;
  toYear: string;
  promotedBy: string;
  promotionType: string;
  averageGrade: number;
  outstandingBalance: number;
  disciplinaryCases: number;
  createdAt: string;
}

export default function PromotionsSection({ schoolCode }: { schoolCode: string }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [criteria, setCriteria] = useState<PromotionCriteria>({
    name: "Default Criteria",
    description: "Standard promotion criteria",
    minGrade: 50,
    maxFeeBalance: 16000,
    maxDisciplinaryCases: 0,
    academicYearId: "",
    isActive: true
  });
  const [savedCriteria, setSavedCriteria] = useState<PromotionCriteria[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<string>("");
  const [students, setStudents] = useState<StudentEligibility[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [promotionResult, setPromotionResult] = useState<PromotionResult | null>(null);
  const [promotionHistory, setPromotionHistory] = useState<PromotionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEligible, setFilterEligible] = useState<"all" | "eligible" | "ineligible">("all");
  
  // Modal states
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<PromotionCriteria | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Step 1: Load academic years and criteria
  useEffect(() => {
    loadAcademicYears();
    loadSavedCriteria();
    loadPromotionHistory();
  }, []);

  const loadAcademicYears = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/academic-years`);
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data.data || []);
        // Auto-select current academic year
        const currentYear = data.data?.find((year: AcademicYear) => year.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id);
          setCriteria(prev => ({ ...prev, academicYearId: currentYear.id }));
        }
      }
    } catch (error) {
      console.error("Error loading academic years:", error);
    }
  };

  const loadSavedCriteria = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/config`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSavedCriteria([data.data]);
          setSelectedCriteria(data.data.id);
          setCriteria({
            name: data.data.name || "Default Criteria",
            description: data.data.description || "Standard promotion criteria",
            minGrade: data.data.minGrade || 50,
            maxFeeBalance: data.data.maxFeeBalance || 16000,
            maxDisciplinaryCases: data.data.maxDisciplinaryCases || 0,
            academicYearId: selectedAcademicYear,
            isActive: data.data.isActive || true
          });
        }
      }
    } catch (error) {
      console.error("Error loading saved criteria:", error);
    }
  };

  const loadPromotionHistory = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/history`);
      if (response.ok) {
        const data = await response.json();
        setPromotionHistory(data.data || []);
      }
    } catch (error) {
      console.error("Error loading promotion history:", error);
    }
  };

  // Step 2: Criteria Management
  const saveCriteria = async () => {
    if (!selectedAcademicYear) {
      toast({
        title: "Error",
        description: "Please select an academic year first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: criteria.name,
          description: criteria.description,
          minGrade: criteria.minGrade,
          maxFeeBalance: criteria.maxFeeBalance,
          maxDisciplinaryCases: criteria.maxDisciplinaryCases,
          isActive: criteria.isActive
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Promotion criteria saved successfully",
        });
        await loadSavedCriteria();
        setCurrentStep(3);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to save criteria: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save criteria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewCriteria = async (newCriteria: PromotionCriteria) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCriteria.name,
          description: newCriteria.description,
          minGrade: newCriteria.minGrade,
          maxFeeBalance: newCriteria.maxFeeBalance,
          maxDisciplinaryCases: newCriteria.maxDisciplinaryCases,
          isActive: newCriteria.isActive
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "New criteria created successfully",
        });
        await loadSavedCriteria();
        setShowCriteriaModal(false);
        setEditingCriteria(null);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to create criteria: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create criteria",
        variant: "destructive"
      });
    }
  };

  const updateCriteria = async (criteriaId: string, updatedCriteria: PromotionCriteria) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/config/${criteriaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedCriteria.name,
          description: updatedCriteria.description,
          minGrade: updatedCriteria.minGrade,
          maxFeeBalance: updatedCriteria.maxFeeBalance,
          maxDisciplinaryCases: updatedCriteria.maxDisciplinaryCases,
          isActive: updatedCriteria.isActive
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Criteria updated successfully",
        });
        await loadSavedCriteria();
        setShowCriteriaModal(false);
        setEditingCriteria(null);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to update criteria: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update criteria",
        variant: "destructive"
      });
    }
  };

  const deleteCriteria = async (criteriaId: string) => {
    if (!confirm("Are you sure you want to delete this criteria?")) return;

    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/config/${criteriaId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Criteria deleted successfully",
        });
        await loadSavedCriteria();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to delete criteria: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete criteria",
        variant: "destructive"
      });
    }
  };

  // Step 3: Check eligibility
  const checkEligibility = async () => {
    if (!selectedAcademicYear) {
      toast({
        title: "Error",
        description: "Please select an academic year first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/eligible?academicYearId=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
        // Auto-select all eligible students
        const eligibleIds = data.data
          .filter((student: StudentEligibility) => student.isEligible)
          .map((student: StudentEligibility) => student.studentId);
        setSelectedStudents(eligibleIds);
        toast({
          title: "Success",
          description: `Found ${data.data.length} students, ${eligibleIds.length} eligible`,
        });
        setCurrentStep(4);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to check eligibility: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check eligibility",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Execute promotion
  const executePromotion = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student for promotion",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/promotions/bulk/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedStudents,
          criteria: {
            minGrade: criteria.minGrade,
            maxFeeBalance: criteria.maxFeeBalance,
            maxDisciplinaryCases: criteria.maxDisciplinaryCases
          },
          academicYearId: selectedAcademicYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPromotionResult(data.data);
        await loadPromotionHistory();
        toast({
          title: "Success",
          description: `Promotion completed! ${data.data.summary.promoted} students promoted, ${data.data.summary.excluded} excluded`,
        });
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to execute promotion: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute promotion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const selectAllEligible = () => {
    const eligibleIds = students
      .filter(student => student.isEligible)
      .map(student => student.studentId);
    setSelectedStudents(eligibleIds);
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  // Filter and search functions
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterEligible === "all" || 
                         (filterEligible === "eligible" && student.isEligible) ||
                         (filterEligible === "ineligible" && !student.isEligible);
    
    return matchesSearch && matchesFilter;
  });

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <Calendar className="h-5 w-5" />;
      case 2: return <Settings className="h-5 w-5" />;
      case 3: return <Users className="h-5 w-5" />;
      case 4: return <Play className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return "Academic Year & Criteria";
      case 2: return "Configure Criteria";
      case 3: return "Review Eligibility";
      case 4: return "Execute Promotion";
      default: return "";
    }
  };

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return "Select academic year and manage promotion criteria";
      case 2: return "Create and configure promotion criteria";
      case 3: return "Review student eligibility and select candidates";
      case 4: return "Execute the promotion process";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Bulk Promotion System
          </CardTitle>
          <CardDescription>
            Comprehensive 4-step promotion workflow for advancing students to the next academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep >= step 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-gray-100 text-gray-400 border-gray-300"
                }`}>
                  {getStepIcon(step)}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    currentStep >= step ? "text-blue-600" : "text-gray-400"
                  }`}>
                    Step {step}
                  </div>
                  <div className="text-xs text-gray-500">{getStepTitle(step)}</div>
                </div>
                {step < 4 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Academic Year & Criteria Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Step 1: Academic Year & Criteria Selection
            </CardTitle>
            <CardDescription>
              {getStepDescription(1)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="academic-year" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="academic-year">Academic Year</TabsTrigger>
                <TabsTrigger value="criteria">Promotion Criteria</TabsTrigger>
              </TabsList>
              
              <TabsContent value="academic-year" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {academicYears.map((year) => (
                    <Card
                      key={year.id}
                      className={`cursor-pointer transition-all ${
                        selectedAcademicYear === year.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedAcademicYear(year.id);
                        setCriteria(prev => ({ ...prev, academicYearId: year.id }));
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{year.name}</div>
                            <div className="text-sm text-gray-500">
                              {year.isCurrent ? "Current Year" : "Previous Year"}
                            </div>
                            {year.startDate && year.endDate && (
                              <div className="text-xs text-gray-400">
                                {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {year.isCurrent && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="criteria" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Saved Criteria</h3>
                  <Button
                    onClick={() => {
                      setEditingCriteria(null);
                      setShowCriteriaModal(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Criteria
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {savedCriteria.map((saved) => (
                    <Card
                      key={saved.id}
                      className={`cursor-pointer transition-all ${
                        selectedCriteria === saved.id
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">{saved.name}</div>
                              {saved.isActive && <Badge variant="default">Active</Badge>}
                            </div>
                            {saved.description && (
                              <div className="text-sm text-gray-600 mt-1">{saved.description}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              Min Grade: {saved.minGrade}% | Max Fee: ${saved.maxFeeBalance.toLocaleString()} | Max Cases: {saved.maxDisciplinaryCases}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCriteria(saved);
                                setShowCriteriaModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCriteria(saved.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedAcademicYear}
                className="flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Criteria Configuration */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step 2: Configure Promotion Criteria
            </CardTitle>
            <CardDescription>
              {getStepDescription(2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="criteriaName">Criteria Name</Label>
                  <Input
                    id="criteriaName"
                    value={criteria.name}
                    onChange={(e) => setCriteria(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter criteria name"
                  />
                </div>
                <div>
                  <Label htmlFor="criteriaDescription">Description</Label>
                  <Textarea
                    id="criteriaDescription"
                    value={criteria.description || ""}
                    onChange={(e) => setCriteria(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter criteria description"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="minGrade">Minimum Grade (%)</Label>
                  <Input
                    id="minGrade"
                    type="number"
                    value={criteria.minGrade}
                    onChange={(e) => setCriteria(prev => ({ ...prev, minGrade: Number(e.target.value) }))}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="maxFeeBalance">Maximum Fee Balance ($)</Label>
                  <Input
                    id="maxFeeBalance"
                    type="number"
                    value={criteria.maxFeeBalance}
                    onChange={(e) => setCriteria(prev => ({ ...prev, maxFeeBalance: Number(e.target.value) }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxDisciplinaryCases">Max Disciplinary Cases</Label>
                  <Input
                    id="maxDisciplinaryCases"
                    type="number"
                    value={criteria.maxDisciplinaryCases}
                    onChange={(e) => setCriteria(prev => ({ ...prev, maxDisciplinaryCases: Number(e.target.value) }))}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Criteria Summary</span>
              </div>
              <div className="text-sm text-blue-700">
                Students must have: <strong>Grade ≥ {criteria.minGrade}%</strong>, 
                <strong>Fee Balance ≤ ${criteria.maxFeeBalance.toLocaleString()}</strong>, and 
                <strong>Disciplinary Cases ≤ {criteria.maxDisciplinaryCases}</strong> to be eligible for promotion.
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={saveCriteria}
                disabled={loading}
                className="flex items-center gap-2"
              >
                Save Criteria & Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Eligibility Review */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Step 3: Review Student Eligibility
            </CardTitle>
            <CardDescription>
              {getStepDescription(3)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAllEligible}>
                  Select All Eligible
                </Button>
                <Button variant="outline" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterEligible} onValueChange={(value: "all" | "eligible" | "ineligible") => setFilterEligible(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="eligible">Eligible Only</SelectItem>
                    <SelectItem value="ineligible">Ineligible Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {selectedStudents.length} of {filteredStudents.length} students selected
            </div>

            {filteredStudents.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Current Class</TableHead>
                      <TableHead>Grade Status</TableHead>
                      <TableHead>Fee Balance</TableHead>
                      <TableHead>Disciplinary</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.studentId)}
                            onCheckedChange={(checked) => 
                              handleStudentSelection(student.studentId, checked as boolean)
                            }
                            disabled={!student.isEligible}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.studentName}</div>
                            <div className="text-sm text-gray-500">{student.admissionNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.currentClass}</TableCell>
                        <TableCell>
                          <Badge variant={student.averageGrade >= criteria.minGrade ? "default" : "destructive"}>
                            {student.averageGrade}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.feeBalance <= criteria.maxFeeBalance ? "default" : "destructive"}>
                            ${student.feeBalance.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.disciplinaryCases <= criteria.maxDisciplinaryCases ? "default" : "destructive"}>
                            {student.disciplinaryCases}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.isEligible ? "default" : "secondary"}>
                            {student.isEligible ? "Eligible" : "Not Eligible"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {student.reason && (
                            <div className="text-sm text-gray-600 truncate" title={student.reason}>
                              {student.reason}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {students.length === 0 ? (
                  "No students found. Click 'Check Eligibility' to load students."
                ) : (
                  "No students match the current search and filter criteria."
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={checkEligibility}
                disabled={loading}
                className="flex items-center gap-2"
              >
                Check Eligibility
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Execute Promotion */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Step 4: Execute Promotion
            </CardTitle>
            <CardDescription>
              {getStepDescription(4)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Ready to Promote</span>
              </div>
              <div className="text-sm text-blue-700">
                {selectedStudents.length} students selected for promotion to the next academic year.
                This action cannot be undone.
              </div>
            </div>

            {promotionResult && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Promotion Results</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Students</div>
                    <div className="font-semibold">{promotionResult.summary.totalStudents}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Promoted</div>
                    <div className="font-semibold text-green-600">{promotionResult.summary.promoted}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Excluded</div>
                    <div className="font-semibold text-red-600">{promotionResult.summary.excluded}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowHistoryModal(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View History
                </Button>
                <Button
                  onClick={executePromotion}
                  disabled={loading || selectedStudents.length === 0}
                  className="flex items-center gap-2"
                >
                  Execute Promotion
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criteria Modal */}
      <Dialog open={showCriteriaModal} onOpenChange={setShowCriteriaModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCriteria ? "Edit Criteria" : "Create New Criteria"}
            </DialogTitle>
            <DialogDescription>
              Configure promotion criteria settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modalName">Criteria Name</Label>
              <Input
                id="modalName"
                value={editingCriteria?.name || ""}
                onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter criteria name"
              />
            </div>
            <div>
              <Label htmlFor="modalDescription">Description</Label>
              <Textarea
                id="modalDescription"
                value={editingCriteria?.description || ""}
                onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter criteria description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="modalMinGrade">Min Grade (%)</Label>
                <Input
                  id="modalMinGrade"
                  type="number"
                  value={editingCriteria?.minGrade || 50}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, minGrade: Number(e.target.value) } : null)}
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="modalMaxFee">Max Fee Balance ($)</Label>
                <Input
                  id="modalMaxFee"
                  type="number"
                  value={editingCriteria?.maxFeeBalance || 16000}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, maxFeeBalance: Number(e.target.value) } : null)}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="modalMaxCases">Max Cases</Label>
                <Input
                  id="modalMaxCases"
                  type="number"
                  value={editingCriteria?.maxDisciplinaryCases || 0}
                  onChange={(e) => setEditingCriteria(prev => prev ? { ...prev, maxDisciplinaryCases: Number(e.target.value) } : null)}
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCriteriaModal(false);
                  setEditingCriteria(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingCriteria) {
                    updateCriteria(editingCriteria.id!, editingCriteria);
                  } else {
                    createNewCriteria({
                      name: "New Criteria",
                      description: "New promotion criteria",
                      minGrade: 50,
                      maxFeeBalance: 16000,
                      maxDisciplinaryCases: 0,
                      academicYearId: selectedAcademicYear,
                      isActive: true
                    });
                  }
                }}
              >
                {editingCriteria ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promotion History</DialogTitle>
            <DialogDescription>
              View recent promotion activities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {promotionHistory.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Fee Balance</TableHead>
                      <TableHead>Promoted By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotionHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell className="font-medium">{history.studentName}</TableCell>
                        <TableCell>{history.fromClass}</TableCell>
                        <TableCell>{history.toClass}</TableCell>
                        <TableCell>
                          <Badge variant="default">{history.averageGrade}%</Badge>
                        </TableCell>
                        <TableCell>${history.outstandingBalance.toLocaleString()}</TableCell>
                        <TableCell>{history.promotedBy}</TableCell>
                        <TableCell>{new Date(history.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No promotion history found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 