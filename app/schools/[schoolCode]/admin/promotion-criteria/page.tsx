"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  ArrowLeft,
  X,
} from "lucide-react";
import Link from "next/link";

interface CustomCriteria {
  id: string;
  type: string;
  name: string;
  description: string;
  limit: number;
  unit: string;
  isRequired: boolean;
}

interface PromotionCriteria {
  id: string;
  name: string;
  description?: string;
  classLevel: string;
  customCriteria: CustomCriteria[];
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
  grade?: string | {
    id: string;
    name: string;
  };
}

const CRITERIA_TYPES = [
  { value: "grade", label: "Grade/Passmark", icon: GraduationCap, unit: "%" },
  { value: "fee_balance", label: "Fee Balance", icon: DollarSign, unit: "KES" },
  { value: "attendance", label: "Attendance", icon: Calendar, unit: "%" },
  { value: "disciplinary", label: "Disciplinary Cases", icon: Shield, unit: "cases" },
  { value: "subject_failures", label: "Subject Failures", icon: GraduationCap, unit: "subjects" },
  { value: "custom", label: "Custom", icon: Settings, unit: "" },
];

export default function PromotionCriteriaPage() {
  const params = useParams();
  const { schoolCode } = params;
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
  });

  const [customCriteria, setCustomCriteria] = useState<CustomCriteria[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch criteria
      const criteriaRes = await fetch(`/api/schools/${schoolCode}/promotions?action=criteria`);
      if (criteriaRes.ok) {
        const criteriaData = await criteriaRes.json();
        console.log("Criteria data received:", criteriaData);
        setCriteria(Array.isArray(criteriaData) ? criteriaData : []);
      } else {
        console.error("Failed to fetch criteria:", criteriaRes.status);
        setCriteria([]);
      }

      // Fetch class levels
      const classesRes = await fetch(`/api/schools/${schoolCode}/classes`);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        console.log("Classes data received:", classesData);
        setClassLevels(Array.isArray(classesData) ? classesData : []);
      } else {
        console.error("Failed to fetch classes:", classesRes.status);
        setClassLevels([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load promotion criteria",
        variant: "destructive",
      });
      setCriteria([]);
      setClassLevels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomCriteria = () => {
    const newCriteria: CustomCriteria = {
      id: `temp-${Date.now()}`,
      type: "grade",
      name: "",
      description: "",
      limit: 0,
      unit: "%",
      isRequired: false,
    };
    setCustomCriteria([...customCriteria, newCriteria]);
  };

  const updateCustomCriteria = (id: string, field: keyof CustomCriteria, value: any) => {
    setCustomCriteria(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value };
        // Update unit based on type
        if (field === 'type') {
          const typeConfig = CRITERIA_TYPES.find(t => t.value === value);
          updated.unit = typeConfig?.unit || "";
        }
        return updated;
      }
      return c;
    }));
  };

  const removeCustomCriteria = (id: string) => {
    setCustomCriteria(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Criteria name is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.classLevel || formData.classLevel.trim() === '') {
      toast({
        title: "Validation Error",
        description: "Class level is required",
        variant: "destructive",
      });
      return;
    }
    if (customCriteria.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one criteria",
        variant: "destructive",
      });
      return;
    }

    // Validate custom criteria
    for (const criteria of customCriteria) {
      if (!criteria.name || criteria.name.trim() === '') {
        toast({
          title: "Validation Error",
          description: "All criteria must have a name",
          variant: "destructive",
        });
        return;
      }
      if (criteria.limit <= 0) {
        toast({
          title: "Validation Error",
          description: "All criteria must have a valid limit greater than 0",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const criteriaData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        classLevel: formData.classLevel,
        customCriteria: customCriteria.map(c => ({
          type: c.type,
          name: c.name.trim(),
          description: c.description.trim(),
          limit: c.limit,
          unit: c.unit,
          isRequired: c.isRequired,
        })),
      };

      const payload = {
        action: editingCriteria ? "update-criteria" : "create-criteria",
        data: editingCriteria ? { id: editingCriteria.id, ...criteriaData } : criteriaData,
      };

      const method = editingCriteria ? "PUT" : "POST";
      const response = await fetch(`/api/schools/${schoolCode}/promotions`, {
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
      name: criteria.name || "",
      description: criteria.description || "",
      classLevel: criteria.classLevel || "",
    });
    setCustomCriteria(criteria.customCriteria || []);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      classLevel: "",
    });
    setCustomCriteria([]);
    setEditingCriteria(null);
  };

  const getCriteriaSummary = (criteria: PromotionCriteria) => {
    if (!criteria.customCriteria || criteria.customCriteria.length === 0) {
      return "No criteria defined";
    }
    
    return criteria.customCriteria.map(c => {
      const typeConfig = CRITERIA_TYPES.find(t => t.value === c.type);
      const typeLabel = typeConfig?.label || c.type;
      return `${typeLabel}: ${c.limit}${c.unit}`;
    }).join(", ");
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
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild>
              <Link href={`/schools/${schoolCode}/admin/promotions`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Promotions
              </Link>
            </Button>
          </div>
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
                Define custom requirements students must meet to be promoted to the next class level.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Criteria Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Standard Promotion Criteria"
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
                          {classLevels.map((level) => {
                            const gradeName = typeof level.grade === 'string' 
                              ? level.grade 
                              : level.grade?.name || level.name;
                            return (
                              <SelectItem key={level.id} value={gradeName}>
                                {gradeName}
                              </SelectItem>
                            );
                          })}
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
                      placeholder="Describe the promotion criteria and its purpose..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Custom Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Custom Criteria</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomCriteria}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Criteria
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Add specific requirements that students must meet for promotion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customCriteria.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No criteria added yet. Click "Add Criteria" to get started.</p>
                    </div>
                  ) : (
                    customCriteria.map((criteria, index) => {
                      const typeConfig = CRITERIA_TYPES.find(t => t.value === criteria.type);
                      const IconComponent = typeConfig?.icon || Settings;
                      
                      return (
                        <div key={criteria.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                              <h4 className="font-medium">Criteria #{index + 1}</h4>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomCriteria(criteria.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Criteria Type</Label>
                              <Select
                                value={criteria.type}
                                onValueChange={(value) => updateCustomCriteria(criteria.id, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CRITERIA_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                      <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                          <Icon className="h-4 w-4" />
                                          {type.label}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Criteria Name *</Label>
                              <Input
                                value={criteria.name}
                                onChange={(e) => updateCustomCriteria(criteria.id, 'name', e.target.value)}
                                placeholder="e.g., Minimum Grade, Max Fee Balance"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={criteria.description}
                              onChange={(e) => updateCustomCriteria(criteria.id, 'description', e.target.value)}
                              placeholder="Describe this specific requirement..."
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Limit/Threshold *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={criteria.limit}
                                onChange={(e) => updateCustomCriteria(criteria.id, 'limit', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 50"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Unit</Label>
                              <Input
                                value={criteria.unit}
                                onChange={(e) => updateCustomCriteria(criteria.id, 'unit', e.target.value)}
                                placeholder="e.g., %, KES, cases"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2 pt-8">
                              <Switch
                                id={`required-${criteria.id}`}
                                checked={criteria.isRequired}
                                onCheckedChange={(checked) => updateCustomCriteria(criteria.id, 'isRequired', checked)}
                              />
                              <Label htmlFor={`required-${criteria.id}`}>Required</Label>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
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
                Create Your First Criteria
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class Level</TableHead>
                  <TableHead>Criteria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteria.map((criterion, index) => (
                  <TableRow key={criterion.id || `criteria-${index}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {typeof criterion.name === 'string' ? criterion.name : 'Unnamed Criteria'}
                        </div>
                        {criterion.description && (
                          <div className="text-sm text-gray-500">
                            {typeof criterion.description === 'string' ? criterion.description : ''}
                          </div>
                        )}
                        {criterion.creator && (
                          <div className="text-xs text-gray-400">
                            Created by: {
                              typeof criterion.creator === 'string' 
                                ? criterion.creator 
                                : criterion.creator?.name || 'Unknown'
                            }
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeof criterion.classLevel === 'string' ? criterion.classLevel : 'Unknown Level'}
                      </Badge>
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