"use client";

import { useState, useEffect, useContext } from "react";
import { PromotionWizardContext } from "./PromotionWizard";
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
import { useParams } from "next/navigation";

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
  grade?: string | { id: string; name: string };
}

const CRITERIA_TYPES = [
  { value: "grade", label: "Grade/Passmark", icon: GraduationCap, unit: "%" },
  { value: "fee_balance", label: "Fee Balance", icon: DollarSign, unit: "KES" },
  { value: "attendance", label: "Attendance", icon: Calendar, unit: "%" },
  {
    value: "disciplinary",
    label: "Disciplinary Cases",
    icon: Shield,
    unit: "cases",
  },
  {
    value: "subject_failures",
    label: "Subject Failures",
    icon: GraduationCap,
    unit: "subjects",
  },
  { value: "custom", label: "Custom", icon: Settings, unit: "" },
];

export default function PromotionCriteriaStep() {
  const params = useParams();
  const schoolCode = params.schoolCode as string;
  const { toast } = useToast();
  const [criteria, setCriteria] = useState<PromotionCriteria[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] =
    useState<PromotionCriteria | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    classLevel: "",
  });

  const [customCriteria, setCustomCriteria] = useState<CustomCriteria[]>([]);
  const { setWizardState } = useContext(PromotionWizardContext);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (criteria.length > 0) {
      setWizardState((prev: any) => ({
        ...prev,
        criteriaList: criteria,
      }));
    }
  }, [criteria, setWizardState]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch criteria
      const criteriaRes = await fetch(
        `/api/schools/${schoolCode}/promotions?action=criteria`
      );
      if (criteriaRes.ok) {
        const criteriaData = await criteriaRes.json();
        setCriteria(Array.isArray(criteriaData) ? criteriaData : []);
      } else {
        setCriteria([]);
      }
      // Fetch class levels
      const classesRes = await fetch(`/api/schools/${schoolCode}/classes`);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassLevels(Array.isArray(classesData) ? classesData : []);
      } else {
        setClassLevels([]);
      }
    } catch (error) {
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

  const updateCustomCriteria = (
    id: string,
    field: keyof CustomCriteria,
    value: any
  ) => {
    setCustomCriteria((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          // Update unit based on type
          if (field === "type") {
            const typeConfig = CRITERIA_TYPES.find((t) => t.value === value);
            updated.unit = typeConfig?.unit || "";
          }
          return updated;
        }
        return c;
      })
    );
  };

  const removeCustomCriteria = (id: string) => {
    setCustomCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || formData.name.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Criteria name is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.classLevel || formData.classLevel.trim() === "") {
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
      if (!criteria.name || criteria.name.trim() === "") {
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
        customCriteria: customCriteria.map((c) => ({
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
        data: editingCriteria
          ? { id: editingCriteria.id, ...criteriaData }
          : criteriaData,
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
    setEditingCriteria(null);
    setFormData({ name: "", description: "", classLevel: "" });
    setCustomCriteria([]);
  };

  // ... UI rendering logic (table, dialog, etc.) ...

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">
        Promotion Criteria Management
      </h2>
      <div className="mb-4 flex justify-between items-center">
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Create New Criteria
        </Button>
      </div>
      <Table className="min-w-full border mb-8">
        <TableHeader>
          <TableRow>
            <TableHead>Class/Grade</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {criteria.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No criteria found.
              </TableCell>
            </TableRow>
          )}
          {criteria.map((c: PromotionCriteria) => (
            <TableRow key={c.id}>
              <TableCell>{c.classLevel}</TableCell>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.description}</TableCell>
              <TableCell>
                {c.isActive ? (
                  <CheckCircle className="text-green-600 w-4 h-4" />
                ) : (
                  <XCircle className="text-gray-400 w-4 h-4" />
                )}
              </TableCell>
              <TableCell>
                {c.isDefault ? (
                  <CheckCircle className="text-blue-600 w-4 h-4" />
                ) : (
                  <XCircle className="text-gray-400 w-4 h-4" />
                )}
              </TableCell>
              <TableCell>{c.priority}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(c)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCriteria ? "Edit Criteria" : "Create Criteria"}
            </DialogTitle>
            <DialogDescription>
              {editingCriteria
                ? "Update the details for this promotion criteria."
                : "Fill in the details to create a new promotion criteria."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Class/Grade</Label>
                <Select
                  value={formData.classLevel}
                  onValueChange={(v) =>
                    setFormData({ ...formData, classLevel: v })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class/grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {classLevels.map((cl) => (
                      <SelectItem key={cl.id} value={cl.name}>
                        {cl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
            {/* Custom Criteria Section */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <Label>Custom Criteria</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomCriteria}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Criteria
                </Button>
              </div>
              {customCriteria.length === 0 && (
                <div className="text-gray-500">No custom criteria added.</div>
              )}
              {customCriteria.map((c, idx) => (
                <Card key={c.id} className="mb-2">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={c.type}
                        onValueChange={(v) =>
                          updateCustomCriteria(c.id, "type", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CRITERIA_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={c.name}
                        onChange={(e) =>
                          updateCustomCriteria(c.id, "name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Limit</Label>
                      <Input
                        type="number"
                        value={c.limit}
                        onChange={(e) =>
                          updateCustomCriteria(
                            c.id,
                            "limit",
                            parseFloat(e.target.value)
                          )
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={c.description}
                        onChange={(e) =>
                          updateCustomCriteria(
                            c.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Required</Label>
                      <Switch
                        checked={c.isRequired}
                        onCheckedChange={(v) =>
                          updateCustomCriteria(c.id, "isRequired", v)
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeCustomCriteria(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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
  );
}
