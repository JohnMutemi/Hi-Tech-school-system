"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  GraduationCap,
  DollarSign,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface PromotionCriteria {
  id: string;
  name: string;
  description?: string;
  classLevel: string;
  minAverageGrade?: number;
  minSubjectPasses?: number;
  maxSubjectFailures?: number;
  requireAllSubjects: boolean;
  maxOutstandingBalance?: number;
  requireFullPayment: boolean;
  allowPartialPayment: boolean;
  minAttendanceRate?: number;
  maxAbsenceDays?: number;
  maxDisciplinaryCases?: number;
  requireCleanRecord: boolean;
  requireParentConsent: boolean;
  requireTeacherApproval: boolean;
  requirePrincipalApproval: boolean;
  customCriteria?: any;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  creator?: {
    name: string;
    email: string;
  };
}

interface ClassLevel {
  id: string;
  name: string;
  grade: string;
}

export default function PromotionCriteriaPage({
  params,
}: {
  params: { schoolCode: string };
}) {
  const { toast } = useToast();
  const [criteria, setCriteria] = useState<PromotionCriteria[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<PromotionCriteria | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    classLevel: "",
    minAverageGrade: "",
    minSubjectPasses: "",
    maxSubjectFailures: "",
    requireAllSubjects: false,
    maxOutstandingBalance: "",
    requireFullPayment: false,
    allowPartialPayment: true,
    minAttendanceRate: "",
    maxAbsenceDays: "",
    maxDisciplinaryCases: "",
    requireCleanRecord: false,
    requireParentConsent: false,
    requireTeacherApproval: true,
    requirePrincipalApproval: true,
    isActive: true,
    isDefault: false,
    priority: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch criteria
      const criteriaRes = await fetch(`/api/schools/${params.schoolCode}/promotions?action=criteria`);
      if (criteriaRes.ok) {
        const criteriaData = await criteriaRes.json();
        setCriteria(criteriaData);
      }

      // Fetch class levels
      const classesRes = await fetch(`/api/schools/${params.schoolCode}/classes`);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassLevels(classesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load promotion criteria",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        action: editingCriteria ? "update-criteria" : "create-criteria",
        data: {
          ...(editingCriteria && { id: editingCriteria.id }),
          ...formData,
          minAverageGrade: formData.minAverageGrade ? parseFloat(formData.minAverageGrade) : null,
          minSubjectPasses: formData.minSubjectPasses ? parseInt(formData.minSubjectPasses) : null,
          maxSubjectFailures: formData.maxSubjectFailures ? parseInt(formData.maxSubjectFailures) : null,
          maxOutstandingBalance: formData.maxOutstandingBalance ? parseFloat(formData.maxOutstandingBalance) : null,
          minAttendanceRate: formData.minAttendanceRate ? parseFloat(formData.minAttendanceRate) : null,
          maxAbsenceDays: formData.maxAbsenceDays ? parseInt(formData.maxAbsenceDays) : null,
          maxDisciplinaryCases: formData.maxDisciplinaryCases ? parseInt(formData.maxDisciplinaryCases) : null,
          priority: parseInt(formData.priority.toString()),
        },
      };

      const method = editingCriteria ? "PUT" : "POST";
      const response = await fetch(`/api/schools/${params.schoolCode}/promotions`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: editingCriteria 
            ? "Promotion criteria updated successfully" 
            : "Promotion criteria created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to save criteria");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save promotion criteria",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (criteria: PromotionCriteria) => {
    setEditingCriteria(criteria);
    setFormData({
      name: criteria.name,
      description: criteria.description || "",
      classLevel: criteria.classLevel,
      minAverageGrade: criteria.minAverageGrade?.toString() || "",
      minSubjectPasses: criteria.minSubjectPasses?.toString() || "",
      maxSubjectFailures: criteria.maxSubjectFailures?.toString() || "",
      requireAllSubjects: criteria.requireAllSubjects,
      maxOutstandingBalance: criteria.maxOutstandingBalance?.toString() || "",
      requireFullPayment: criteria.requireFullPayment,
      allowPartialPayment: criteria.allowPartialPayment,
      minAttendanceRate: criteria.minAttendanceRate?.toString() || "",
      maxAbsenceDays: criteria.maxAbsenceDays?.toString() || "",
      maxDisciplinaryCases: criteria.maxDisciplinaryCases?.toString() || "",
      requireCleanRecord: criteria.requireCleanRecord,
      requireParentConsent: criteria.requireParentConsent,
      requireTeacherApproval: criteria.requireTeacherApproval,
      requirePrincipalApproval: criteria.requirePrincipalApproval,
      isActive: criteria.isActive,
      isDefault: criteria.isDefault,
      priority: criteria.priority,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      classLevel: "",
      minAverageGrade: "",
      minSubjectPasses: "",
      maxSubjectFailures: "",
      requireAllSubjects: false,
      maxOutstandingBalance: "",
      requireFullPayment: false,
      allowPartialPayment: true,
      minAttendanceRate: "",
      maxAbsenceDays: "",
      maxDisciplinaryCases: "",
      requireCleanRecord: false,
      requireParentConsent: false,
      requireTeacherApproval: true,
      requirePrincipalApproval: true,
      isActive: true,
      isDefault: false,
      priority: 1,
    });
    setEditingCriteria(null);
  };

  const getCriteriaSummary = (criteria: PromotionCriteria) => {
    const requirements = [];
    
    if (criteria.minAverageGrade) {
      requirements.push(`Min Grade: ${criteria.minAverageGrade}%`);
    }
    if (criteria.maxOutstandingBalance) {
      requirements.push(`Max Balance: KES ${criteria.maxOutstandingBalance.toLocaleString()}`);
    }
    if (criteria.minAttendanceRate) {
      requirements.push(`Min Attendance: ${criteria.minAttendanceRate}%`);
    }
    if (criteria.requireFullPayment) {
      requirements.push("Full Payment Required");
    }
    
    return requirements.join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotion Criteria Management</h1>
          <p className="text-gray-600">Set custom promotion rules for different class levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Criteria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCriteria ? "Edit Promotion Criteria" : "Create Promotion Criteria"}
              </DialogTitle>
              <DialogDescription>
                Define the requirements students must meet to be promoted to the next class level.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Criteria Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Standard Promotion, Merit Promotion"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classLevel">Class Level *</Label>
                      <Select
                        value={formData.classLevel}
                        onValueChange={(value) => setFormData({ ...formData, classLevel: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select class level" />
                        </SelectTrigger>
                        <SelectContent>
                          {classLevels.map((level) => (
                            <SelectItem key={level.id} value={level.grade}>
                              {level.grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the criteria and its purpose..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Academic Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAverageGrade">Minimum Average Grade (%)</Label>
                      <Input
                        id="minAverageGrade"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.minAverageGrade}
                        onChange={(e) => setFormData({ ...formData, minAverageGrade: e.target.value })}
                        placeholder="e.g., 50.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minSubjectPasses">Minimum Subjects to Pass</Label>
                      <Input
                        id="minSubjectPasses"
                        type="number"
                        min="0"
                        value={formData.minSubjectPasses}
                        onChange={(e) => setFormData({ ...formData, minSubjectPasses: e.target.value })}
                        placeholder="e.g., 6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSubjectFailures">Maximum Subject Failures</Label>
                      <Input
                        id="maxSubjectFailures"
                        type="number"
                        min="0"
                        value={formData.maxSubjectFailures}
                        onChange={(e) => setFormData({ ...formData, maxSubjectFailures: e.target.value })}
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireAllSubjects"
                      checked={formData.requireAllSubjects}
                      onCheckedChange={(checked) => setFormData({ ...formData, requireAllSubjects: checked })}
                    />
                    <Label htmlFor="requireAllSubjects">Require all subjects to be passed</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Fee Payment Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxOutstandingBalance">Maximum Outstanding Balance (KES)</Label>
                      <Input
                        id="maxOutstandingBalance"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maxOutstandingBalance}
                        onChange={(e) => setFormData({ ...formData, maxOutstandingBalance: e.target.value })}
                        placeholder="e.g., 5000"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireFullPayment"
                        checked={formData.requireFullPayment}
                        onCheckedChange={(checked) => setFormData({ ...formData, requireFullPayment: checked })}
                      />
                      <Label htmlFor="requireFullPayment">Require full payment (zero balance)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowPartialPayment"
                        checked={formData.allowPartialPayment}
                        onCheckedChange={(checked) => setFormData({ ...formData, allowPartialPayment: checked })}
                      />
                      <Label htmlFor="allowPartialPayment">Allow promotion with partial payment</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance & Discipline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance & Discipline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAttendanceRate">Minimum Attendance Rate (%)</Label>
                      <Input
                        id="minAttendanceRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.minAttendanceRate}
                        onChange={(e) => setFormData({ ...formData, minAttendanceRate: e.target.value })}
                        placeholder="e.g., 80.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAbsenceDays">Maximum Absence Days</Label>
                      <Input
                        id="maxAbsenceDays"
                        type="number"
                        min="0"
                        value={formData.maxAbsenceDays}
                        onChange={(e) => setFormData({ ...formData, maxAbsenceDays: e.target.value })}
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxDisciplinaryCases">Maximum Disciplinary Cases</Label>
                      <Input
                        id="maxDisciplinaryCases"
                        type="number"
                        min="0"
                        value={formData.maxDisciplinaryCases}
                        onChange={(e) => setFormData({ ...formData, maxDisciplinaryCases: e.target.value })}
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireCleanRecord"
                      checked={formData.requireCleanRecord}
                      onCheckedChange={(checked) => setFormData({ ...formData, requireCleanRecord: checked })}
                    />
                    <Label htmlFor="requireCleanRecord">Require clean disciplinary record</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Additional Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireParentConsent"
                        checked={formData.requireParentConsent}
                        onCheckedChange={(checked) => setFormData({ ...formData, requireParentConsent: checked })}
                      />
                      <Label htmlFor="requireParentConsent">Require parent consent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requireTeacherApproval"
                        checked={formData.requireTeacherApproval}
                        onCheckedChange={(checked) => setFormData({ ...formData, requireTeacherApproval: checked })}
                      />
                      <Label htmlFor="requireTeacherApproval">Require teacher approval</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requirePrincipalApproval"
                        checked={formData.requirePrincipalApproval}
                        onCheckedChange={(checked) => setFormData({ ...formData, requirePrincipalApproval: checked })}
                      />
                      <Label htmlFor="requirePrincipalApproval">Require principal approval</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority Order</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        placeholder="1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isDefault"
                        checked={formData.isDefault}
                        onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                      />
                      <Label htmlFor="isDefault">Default criteria</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCriteria ? "Update Criteria" : "Create Criteria"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Criteria List */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Criteria</CardTitle>
          <CardDescription>
            Manage promotion requirements for different class levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criteria.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No promotion criteria set</h3>
              <p className="text-gray-600 mb-4">
                Create your first promotion criteria to define requirements for student advancement.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Criteria
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class Level</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((criterion) => (
                  <TableRow key={criterion.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{criterion.name}</div>
                        {criterion.description && (
                          <div className="text-sm text-gray-500">{criterion.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{criterion.classLevel}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs">
                        {getCriteriaSummary(criterion)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {criterion.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {criterion.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{criterion.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(criterion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 