"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Eye,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Papa from "papaparse";
import { BulkImport } from "@/components/ui/bulk-import";
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveCard, 
  TouchButton, 
  ResponsiveModal,
  ResponsiveForm,
  ResponsiveFormRow,
  ResponsiveFormGroup,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveTable,
  ResponsiveText,
  ResponsiveSpacing
} from '@/components/ui/responsive-components';
import { useResponsive } from '@/hooks/useResponsive';

interface FeeStructure {
  id: string;
  term: string;
  year: number;
  gradeId: string;
  totalAmount: number;
  amount?: number; // Add amount property for API compatibility
  breakdown: Record<string, number>;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  logs: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: {
      name: string;
      email: string;
    };
    details: any;
  }>;
  gradeName: string;
  academicYearId: string;
  termId: string;
  /** null/undefined = applies to both day scholars and boarders (legacy unified). */
  feeAccommodation?: string | null;
  academicYear?: {
    name: string;
    id: string;
  };
}

function feeStructureAppliesLabel(seg: string | null | undefined) {
  if (seg === "boarder") return "Boarder";
  if (seg === "day_scholar") return "Day scholar";
  return "Unified";
}

interface FeeManagementProps {
  schoolCode: string;
  colorTheme: string;
  onGoBack?: () => void;
  onFeeStructureCreated?: () => void;
}

function FeeImportButton({ schoolCode }: { schoolCode: string }) {
  return (
    <BulkImport 
      entityType="fee-structures" 
      schoolCode={schoolCode} 
      variant="outline"
      size="sm"
    />
  );
}

export function FeeManagement({
  schoolCode,
  colorTheme,
  onGoBack,
  onFeeStructureCreated,
}: FeeManagementProps) {
  console.log('🎓 FeeManagement component initialized with schoolCode:', schoolCode);
  const { toast } = useToast();
  const responsive = useResponsive();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // New: Academic year and term state
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [termId, setTermId] = useState<string>("");
  const [availableGrades, setAvailableGrades] = useState<any[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [viewingFee, setViewingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    gradeId: "",
    academicYearId: "",
    termId: "",
    feeAccommodation: "" as "" | "day_scholar" | "boarder",
  });
  const [breakdown, setBreakdown] = useState([{ name: "", value: "" }]);
  /** Create flow: separate day vs boarder structures, or single unified row. */
  const [createFeeMode, setCreateFeeMode] = useState<"segmented" | "unified">(
    "segmented"
  );
  const [dayBreakdown, setDayBreakdown] = useState([{ name: "", value: "" }]);
  const [boarderBreakdown, setBoarderBreakdown] = useState([
    { name: "", value: "" },
  ]);

  // Search and filter state
  const [searchText, setSearchText] = useState("");
     const filteredFeeStructures = useMemo(() => {
     const q = searchText.toLowerCase();
     return feeStructures.filter((fee) => {
       if (!q) return true;
       const applies = feeStructureAppliesLabel(fee.feeAccommodation).toLowerCase();
       return (
       (fee.gradeName && fee.gradeName.toLowerCase().includes(q)) ||
       (fee.term && fee.term.toLowerCase().includes(q)) ||
       applies.includes(q) ||
       (fee.creator?.name &&
         fee.creator.name.toLowerCase().includes(q)) ||
       (fee.creator?.email &&
         fee.creator.email.toLowerCase().includes(q))
       );
     });
   }, [feeStructures, searchText]);

  const brandHex = useMemo(() => {
    const t = (colorTheme || "").trim();
    return /^#[0-9A-Fa-f]{6}$/i.test(t) ? t : "#2563eb";
  }, [colorTheme]);

  // CSV import → fill a breakdown table
  const buildCsvImportHandler =
    (
      setRows: React.Dispatch<
        React.SetStateAction<{ name: string; value: string }[]>
      >
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      Papa.parse(file, {
        header: true,
        complete: (results: Papa.ParseResult<any>) => {
          const imported = results.data
            .filter((row: any) => row["Breakdown Name"] && row["Amount"])
            .map((row: any) => ({
              name: row["Breakdown Name"],
              value: row["Amount"].toString(),
            }));
          setRows(imported.length ? imported : [{ name: "", value: "" }]);
        },
      });
    };

  // Calculate total from breakdown
  const calculateTotal = () => {
    return breakdown.reduce(
      (sum, item) => sum + (parseFloat(item.value) || 0),
      0
    );
  };

  const sumBreakdownLines = (rows: { name: string; value: string }[]) =>
    rows.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

  const linesToFeeBreakdownPayload = (rows: { name: string; value: string }[]) =>
    rows.map((item) => ({
      name: item.name,
      value: parseFloat(item.value) || 0,
    }));

  const resetCreateFormState = () => {
    setFormData({
      gradeId: "",
      academicYearId: academicYearId,
      termId: termId,
      feeAccommodation: "",
    });
    setBreakdown([{ name: "", value: "" }]);
    setDayBreakdown([{ name: "", value: "" }]);
    setBoarderBreakdown([{ name: "", value: "" }]);
    setCreateFeeMode("segmented");
  };

  // Get current term and year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  let currentTerm = "Term 1";
  if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";
  else if (currentMonth >= 8) currentTerm = "Term 3";

  // Fetch current academic year and term
  useEffect(() => {
    async function fetchCurrentAcademicYearAndTerm() {
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}?action=current-academic-year`
        );
        if (res.ok) {
          const year = await res.json();
          setAcademicYearId(year?.id || "");
          const currentTerm = year?.terms?.find((t: any) => t.isCurrent);
          setTermId(currentTerm?.id || "");
          // Default form fields if not editing
          setFormData((prev) => ({
            ...prev,
            academicYearId: year?.id || "",
            termId: currentTerm?.id || "",
          }));
        }
      } catch {}
    }
    if (schoolCode) fetchCurrentAcademicYearAndTerm();
  }, [schoolCode]);

  // Fetch fee structures
  const fetchFeeStructures = useCallback(async () => {
    try {
      setLoading(true);
      // Show all fee structures by default (no filters)
      let url = `/api/schools/${schoolCode}/fee-structure`;
      console.log('🔍 Fetching fee structures from:', url);
      
      // If you add filter UI later, add params here
      // const params = [];
      // if (academicYearId) params.push(`academicYearId=${academicYearId}`);
      // if (termId) params.push(`termId=${termId}`);
      // if (params.length) url += `?${params.join("&")}`;
      const response = await fetch(url);
      console.log('📊 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Fee structures received:', result);
        
        // Handle both old and new response formats
        const data = result.data || result; // New format has .data property, old format is direct array
        console.log('📊 Number of fee structures:', Array.isArray(data) ? data.length : 0);
        setFeeStructures(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('❌ API error:', errorText);
        toast({
          title: "Error",
          description: "Failed to fetch fee structures",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fee structures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [schoolCode]);

  useEffect(() => {
    console.log('🔄 useEffect triggered - fetching fee structures');
    fetchFeeStructures();
  }, [fetchFeeStructures, academicYearId, termId]);

  // Add state for available terms in the current academic year
  const [availableTerms, setAvailableTerms] = useState<any[]>([]);

  // Fetch available terms for the current academic year
  useEffect(() => {
    async function fetchTerms() {
      if (!academicYearId) return;
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}/terms?yearId=${academicYearId}`
        );
        if (!res.ok) throw new Error("Failed to fetch terms");
        const terms = await res.json();
        setAvailableTerms(terms);
      } catch {
        setAvailableTerms([]);
      }
    }
    fetchTerms();
  }, [schoolCode, academicYearId]);

  // Add state for available academic years
  const [availableYears, setAvailableYears] = useState<any[]>([]);

  // Fetch available academic years
  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/academic-years`);
        if (!res.ok) throw new Error("Failed to fetch academic years");
        const raw = await res.json();
        const years = Array.isArray(raw)
          ? raw
          : raw?.data && Array.isArray(raw.data)
            ? raw.data
            : [];
        setAvailableYears(years);
        if (!editingFee && years.length > 0) {
          setAcademicYearId(years[0].id);
          setFormData((prev) => ({ ...prev, academicYearId: years[0].id }));
        }
      } catch {
        setAvailableYears([]);
      }
    }
    fetchYears();
  }, [schoolCode, editingFee]);

  // When academic year changes, fetch terms
  useEffect(() => {
    async function fetchTerms() {
      if (!academicYearId) return;
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}/terms?yearId=${academicYearId}`
        );
        if (!res.ok) throw new Error("Failed to fetch terms");
        const terms = await res.json();
        setAvailableTerms(terms);
        // Set default term if not editing
        if (!editingFee && terms.length > 0) {
          setTermId(terms[0].id);
          setFormData((prev) => ({ ...prev, termId: terms[0].id }));
        }
      } catch {
        setAvailableTerms([]);
      }
    }
    fetchTerms();
  }, [schoolCode, academicYearId, editingFee]);

  // Fetch available grades
  useEffect(() => {
    async function fetchGrades() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/grades`);
        if (!res.ok) throw new Error("Failed to fetch grades");
        const raw = await res.json();
        const grades = Array.isArray(raw)
          ? raw
          : raw?.data && Array.isArray(raw.data)
            ? raw.data
            : [];
        setAvailableGrades(grades);
      } catch {
        setAvailableGrades([]);
      }
    }
    fetchGrades();
  }, [schoolCode]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const isEdit = Boolean(editingFee?.id);
      const applyingAllGrades = !isEdit && formData.gradeId === "__all__";

      if (isEdit) {
        const total = calculateTotal();
        const feePayload = {
          ...formData,
          totalAmount: total,
          academicYearId: formData.academicYearId || academicYearId,
          termId: formData.termId || termId,
          breakdown: linesToFeeBreakdownPayload(breakdown),
        };

        const response = await fetch(`/api/schools/${schoolCode}/fee-structure`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingFee!.id, ...feePayload }),
        });

        if (response.ok) {
          const result = await response.json();
          toast({
            title: "Success!",
            description: "Fee structure updated successfully!",
          });
          setShowForm(false);
          setEditingFee(null);
          resetCreateFormState();
          await fetchFeeStructures();
          window.dispatchEvent(
            new CustomEvent("feeStructureUpdated", {
              detail: { schoolCode, feeStructure: result.feeStructure },
            })
          );
          if (onFeeStructureCreated) onFeeStructureCreated();
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save fee structure");
        }
        return;
      }

      type Seg = "day_scholar" | "boarder";
      const postSegment = async (gradeId: string, seg: Seg, rows: typeof dayBreakdown) => {
        const totalAmount = sumBreakdownLines(rows);
        return fetch(`/api/schools/${schoolCode}/fee-structure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gradeId,
            academicYearId: formData.academicYearId || academicYearId,
            termId: formData.termId || termId,
            totalAmount,
            breakdown: linesToFeeBreakdownPayload(rows),
            feeAccommodation: seg,
          }),
        });
      };

      if (createFeeMode === "segmented") {
        const daySum = sumBreakdownLines(dayBreakdown);
        const boardSum = sumBreakdownLines(boarderBreakdown);
        if (daySum <= 0 && boardSum <= 0) {
          toast({
            title: "Amount required",
            description:
              "Enter fee lines for day scholars and/or boarders (totals must be greater than zero).",
            variant: "destructive",
          });
          return;
        }

        const segments: Array<{ seg: Seg; rows: typeof dayBreakdown }> = [];
        if (daySum > 0) segments.push({ seg: "day_scholar", rows: dayBreakdown });
        if (boardSum > 0) segments.push({ seg: "boarder", rows: boarderBreakdown });

        if (applyingAllGrades) {
          let ok = 0;
          const failed: string[] = [];
          for (const g of availableGrades) {
            const gid = (g as { id?: string })?.id;
            if (!gid) continue;
            for (const { seg, rows } of segments) {
              const res = await postSegment(gid, seg, rows);
              if (res.ok) ok++;
              else {
                failed.push(
                  `${(g as { name?: string }).name || "Grade"} — ${
                    seg === "boarder" ? "Boarders" : "Day scholars"
                  }`
                );
              }
            }
          }

          if (ok === 0) {
            throw new Error("Failed to create fee structures for all grades.");
          }

          toast({
            title: "Fee structures created",
            description:
              failed.length > 0
                ? `Saved ${ok} structure(s). Check: ${failed.join(", ")}`
                : `Created ${ok} fee structure(s) across grades.`,
          });

          setShowForm(false);
          setEditingFee(null);
          resetCreateFormState();
          await fetchFeeStructures();
          if (onFeeStructureCreated) onFeeStructureCreated();
          return;
        }

        for (const { seg, rows } of segments) {
          const res = await postSegment(formData.gradeId, seg, rows);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to save fee structure");
          }
        }

        toast({
          title: "Success!",
          description:
            segments.length > 1
              ? "Day scholar and boarder fee structures created."
              : "Fee structure created successfully!",
        });
        setShowForm(false);
        setEditingFee(null);
        resetCreateFormState();
        await fetchFeeStructures();
        if (onFeeStructureCreated) onFeeStructureCreated();
        return;
      }

      // Unified create (single structure for all accommodations, legacy)
      const total = calculateTotal();
      const unifiedBody = {
        gradeId: formData.gradeId,
        academicYearId: formData.academicYearId || academicYearId,
        termId: formData.termId || termId,
        totalAmount: total,
        breakdown: linesToFeeBreakdownPayload(breakdown),
        feeAccommodation: null as string | null,
      };

      if (applyingAllGrades) {
        const gradeIds = availableGrades.map((g: { id: string }) => g.id);
        const settled = await Promise.allSettled(
          gradeIds.map((gradeId: string) =>
            fetch(`/api/schools/${schoolCode}/fee-structure`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...unifiedBody, gradeId }),
            })
          )
        );

        let createdCount = 0;
        const failed: string[] = [];
        for (let i = 0; i < settled.length; i++) {
          const result = settled[i];
          if (result.status === "fulfilled" && result.value.ok) {
            createdCount += 1;
          } else {
            failed.push(availableGrades[i]?.name || `Grade ${i + 1}`);
          }
        }

        if (createdCount === 0) {
          throw new Error("Failed to create fee structures for all grades.");
        }

        toast({
          title: "Fee structures created",
          description:
            failed.length > 0
              ? `Created for ${createdCount} grades. Failed: ${failed.join(", ")}`
              : `Created unified fee structures for all ${createdCount} grades.`,
        });

        setShowForm(false);
        setEditingFee(null);
        resetCreateFormState();
        await fetchFeeStructures();
        if (onFeeStructureCreated) onFeeStructureCreated();
        return;
      }

      const response = await fetch(`/api/schools/${schoolCode}/fee-structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unifiedBody),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: "Unified fee structure created successfully!",
        });
        setShowForm(false);
        setEditingFee(null);
        resetCreateFormState();
        await fetchFeeStructures();
        window.dispatchEvent(
          new CustomEvent("feeStructureUpdated", {
            detail: { schoolCode, feeStructure: result.feeStructure },
          })
        );
        if (onFeeStructureCreated) onFeeStructureCreated();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save fee structure");
      }
    } catch (error) {
      console.error("Error saving fee structure:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save fee structure",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFee = async (fee: FeeStructure) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Remove fee structure for ${fee.gradeName || "this grade"} — ${fee.term || ""}? This deactivates it for new charges.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/schools/${schoolCode}/fee-structure`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fee.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove fee structure");
      }
      toast({ title: "Removed", description: "Fee structure deactivated." });
      await fetchFeeStructures();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove",
        variant: "destructive",
      });
    }
  };

  // Handle edit
  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      gradeId: fee.gradeId,
      academicYearId: fee.academicYearId || academicYearId,
      termId: fee.termId || termId,
      feeAccommodation:
        fee.feeAccommodation === "boarder" || fee.feeAccommodation === "day_scholar"
          ? fee.feeAccommodation
          : "",
    });
    setBreakdown(
      Array.isArray(fee.breakdown)
        ? fee.breakdown.map((item: any) => ({
            name: item.name,
            value: item.value.toString(),
          }))
        : Object.entries(fee.breakdown || {}).map(([name, value]) => ({
            name,
            value: value.toString(),
          }))
    );
    setShowForm(true);
  };

  // Handle close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFee(null);
    resetCreateFormState();
  };

  const openCreateForm = () => {
    setEditingFee(null);
    resetCreateFormState();
    setShowForm(true);
  };

  return (
    <div
      className="space-y-8"
      style={
        {
          "--fee-brand": brandHex,
          "--fee-brand-ring": `${brandHex}55`,
        } as React.CSSProperties
      }
    >
      {/* Enhanced Header with Gradient */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl"
        style={{ backgroundColor: brandHex }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onGoBack && (
                <Button
                  onClick={onGoBack}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back to Dashboard
                </Button>
              )}
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                  Fee Management
                </h2>
                <p className="text-white/80 text-lg">
                  Manage termly fee structures for your school
                </p>
              </div>
            </div>
            <Button
              onClick={openCreateForm}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Fee Structure
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Enhanced Stats Cards with Responsive Components */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }} gap="lg">
        <ResponsiveCard
          className="group relative overflow-hidden rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
          style={{ borderColor: `${brandHex}33` }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `${brandHex}14` }}
          />
          <div className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: brandHex }}>
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <ResponsiveText size="2xl" className="font-bold" style={{ color: brandHex }}>
                  {feeStructures.length}
                </ResponsiveText>
                <ResponsiveText size="sm" className="text-slate-600 font-medium">
                  Total Fee Structures
                </ResponsiveText>
              </div>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard
          className="group relative overflow-hidden rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
          style={{ borderColor: `${brandHex}33` }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `${brandHex}14` }}
          />
          <div className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: brandHex }}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <ResponsiveText size="2xl" className="font-bold" style={{ color: brandHex }}>
                  {feeStructures.filter((f) => f.isActive).length}
                </ResponsiveText>
                <ResponsiveText size="sm" className="text-slate-600 font-medium">
                  Active Structures
                </ResponsiveText>
              </div>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard
          className="group relative overflow-hidden rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
          style={{ borderColor: `${brandHex}33` }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `${brandHex}14` }}
          />
          <div className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: brandHex }}>
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <ResponsiveText size="2xl" className="font-bold" style={{ color: brandHex }}>
                  {
                    feeStructures.filter(
                      (f) =>
                        f.term === currentTerm &&
                        (f.year === currentYear ||
                          (f.academicYear?.name && f.academicYear.name.includes(currentYear.toString())))
                    ).length
                  }
                </ResponsiveText>
                <ResponsiveText size="sm" className="text-slate-600 font-medium">
                  Current Term
                </ResponsiveText>
              </div>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard
          className="group relative overflow-hidden rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
          style={{ borderColor: `${brandHex}33` }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `${brandHex}14` }}
          />
          <div className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: brandHex }}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <ResponsiveText size="2xl" className="font-bold" style={{ color: brandHex }}>
                  {new Set(feeStructures.map((f) => f.gradeName).filter(Boolean)).size}
                </ResponsiveText>
                <ResponsiveText size="sm" className="text-slate-600 font-medium">
                  Grades
                </ResponsiveText>
              </div>
            </div>
          </div>
        </ResponsiveCard>
      </ResponsiveGrid>

      {/* Enhanced Fee Structures Table with Responsive Components */}
      <ResponsiveCard className="rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <ResponsiveText size="2xl" className="font-bold text-gray-800 flex items-center gap-3">
                <TrendingUp className="w-6 h-6" style={{ color: brandHex }} />
                Fee Structures Overview
              </ResponsiveText>
              <ResponsiveText size="base" className="text-gray-600">
                Manage and monitor all fee structures for your school
              </ResponsiveText>
            </div>
            <div className="w-full md:w-72">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--fee-brand-ring)]"
                placeholder="Search by term, year, grade, status, creator..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-transparent"
                style={{ borderTopColor: "var(--fee-brand)" }}
              />
              <span className="ml-3 text-gray-600">
                Loading fee structures...
              </span>
            </div>
          ) : filteredFeeStructures.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No fee structures found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchText
                  ? "Try a different search term or clear the filter."
                  : "Create your first fee structure to get started"}
              </p>
              <Button
                onClick={openCreateForm}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Fee Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gray-100">
                    <TableHead className="font-semibold text-gray-700">
                      Term & Year
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Grade
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Applies to
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Total Amount
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Created By
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Created
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeStructures.map((fee) => (
                    <TableRow
                      key={fee.id}
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {fee.term || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {fee.academicYear?.name || fee.year || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200 font-medium"
                        >
                          {fee.gradeName || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium whitespace-nowrap">
                          {feeStructureAppliesLabel(fee.feeAccommodation)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-green-700">KES</span>
                          <span className="font-bold text-green-700">
                            {(fee.totalAmount || fee.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={fee.isActive ? "default" : "secondary"}
                          className={`${
                            fee.isActive
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          } font-medium`}
                        >
                          <div className="flex items-center space-x-1">
                            {fee.isActive ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{fee.isActive ? "Active" : "Inactive"}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {fee.creator?.name || 'Admin'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {fee.creator?.email || 'admin'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(fee.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingFee(fee)}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fee)}
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => handleDeleteFee(fee)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ResponsiveCard>

      {/* Enhanced Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseForm}
              className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              {editingFee ? "Edit Fee Structure" : "Create New Fee Structure"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingFee
                ? "Update the fee structure details below"
                : "Define day scholar and boarder fees per grade, or one unified schedule for all students."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Academic Year *
                </Label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={formData.academicYearId}
                  onChange={(e) => {
                    setAcademicYearId(e.target.value);
                    setFormData({
                      ...formData,
                      academicYearId: e.target.value,
                      termId: "",
                    });
                  }}
                  required
                >
                  <option value="">Select Academic Year</option>
                  {(availableYears || []).map((year: any) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Term *
                </Label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={formData.termId}
                  onChange={(e) =>
                    setFormData({ ...formData, termId: e.target.value })
                  }
                  required
                  disabled={
                    !formData.academicYearId || availableTerms.length === 0
                  }
                >
                  <option value="">Select Term</option>
                  {availableTerms.map((term: any) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Grade *
                </Label>
                <select
                  name="gradeId"
                  value={formData.gradeId}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeId: e.target.value })
                  }
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Grade</option>
                  {!editingFee && (
                    <option value="__all__">All Grades</option>
                  )}
                  {availableGrades.map((grade: any) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>

              {editingFee ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Applies to (fees)
                  </Label>
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={formData.feeAccommodation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeAccommodation: e.target.value as typeof formData.feeAccommodation,
                      })
                    }
                  >
                    <option value="">Unified — day & boarder</option>
                    <option value="day_scholar">Day scholars only</option>
                    <option value="boarder">Boarders only</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    One record = one segment or unified schedule.
                  </p>
                </div>
              ) : null}
            </div>

            {!editingFee ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 space-y-3">
                <Label className="text-sm font-semibold text-gray-800">
                  How should this grade (or all grades) be billed?
                </Label>
                <Tabs
                  value={createFeeMode}
                  onValueChange={(v) =>
                    setCreateFeeMode(v as "segmented" | "unified")
                  }
                >
                  <TabsList className="grid w-full max-w-xl grid-cols-2 h-auto py-1">
                    <TabsTrigger value="segmented" className="text-xs sm:text-sm">
                      Day & boarder (recommended)
                    </TabsTrigger>
                    <TabsTrigger value="unified" className="text-xs sm:text-sm">
                      Unified (legacy)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="segmented" className="pt-2 m-0">
                    <p className="text-xs text-gray-600">
                      Enter fee lines for each group. Only groups with a total
                      greater than zero are saved. Both can be saved in one step
                      for the selected grade.
                    </p>
                  </TabsContent>
                  <TabsContent value="unified" className="pt-2 m-0">
                    <p className="text-xs text-gray-600">
                      One termly structure with no day/board split (applies to
                      every student when no segmented rows exist).
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}

            {editingFee || createFeeMode === "unified" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-gray-800">
                  {editingFee ? "Fee breakdown" : "Unified fee breakdown"}
                </Label>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    KES {calculateTotal().toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      type="text"
                      placeholder="Breakdown name"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...breakdown];
                        updated[idx].name = e.target.value;
                        setBreakdown(updated);
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...breakdown];
                        updated[idx].value = e.target.value;
                        setBreakdown(updated);
                      }}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setBreakdown(breakdown.filter((_, i) => i !== idx))
                      }
                      disabled={breakdown.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setBreakdown([...breakdown, { name: "", value: "" }])
                  }
                >
                  Add line
                </Button>
                <div className="pt-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={buildCsvImportHandler(setBreakdown)}
                  />
                  <span className="text-xs text-gray-500 ml-2">
                    CSV: Breakdown Name, Amount
                  </span>
                </div>
              </div>
            </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-3 rounded-xl border-2 border-blue-100/80 bg-blue-50/50 p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <Label className="text-base font-semibold text-blue-950">
                        Day scholars
                      </Label>
                      <p className="text-xs text-blue-900/70 mt-0.5">
                        Per-grade fee for day scholars (segment{" "}
                        <code className="text-[10px]">day_scholar</code>).
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gray-600">Subtotal</div>
                      <div className="text-lg font-bold text-blue-800">
                        KES{" "}
                        {sumBreakdownLines(dayBreakdown).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayBreakdown.map((item, idx) => (
                      <div key={`d-${idx}`} className="flex gap-2 items-center">
                        <Input
                          type="text"
                          placeholder="Item"
                          value={item.name}
                          onChange={(e) => {
                            const u = [...dayBreakdown];
                            u[idx].name = e.target.value;
                            setDayBreakdown(u);
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="KES"
                          value={item.value}
                          onChange={(e) => {
                            const u = [...dayBreakdown];
                            u[idx].value = e.target.value;
                            setDayBreakdown(u);
                          }}
                          className="w-28"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setDayBreakdown(
                              dayBreakdown.filter((_, i) => i !== idx)
                            )
                          }
                          disabled={dayBreakdown.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDayBreakdown([
                          ...dayBreakdown,
                          { name: "", value: "" },
                        ])
                      }
                    >
                      Add line
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      className="text-xs"
                      onChange={buildCsvImportHandler(setDayBreakdown)}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border-2 border-amber-100/80 bg-amber-50/50 p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <Label className="text-base font-semibold text-amber-950">
                        Boarders
                      </Label>
                      <p className="text-xs text-amber-900/70 mt-0.5">
                        Per-grade fee for boarders (segment{" "}
                        <code className="text-[10px]">boarder</code>).
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gray-600">Subtotal</div>
                      <div className="text-lg font-bold text-amber-900">
                        KES{" "}
                        {sumBreakdownLines(boarderBreakdown).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      setBoarderBreakdown(
                        dayBreakdown.map((r) => ({ ...r }))
                      )
                    }
                  >
                    Copy lines from day scholars
                  </Button>
                  <div className="flex flex-col gap-2">
                    {boarderBreakdown.map((item, idx) => (
                      <div key={`b-${idx}`} className="flex gap-2 items-center">
                        <Input
                          type="text"
                          placeholder="Item"
                          value={item.name}
                          onChange={(e) => {
                            const u = [...boarderBreakdown];
                            u[idx].name = e.target.value;
                            setBoarderBreakdown(u);
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="KES"
                          value={item.value}
                          onChange={(e) => {
                            const u = [...boarderBreakdown];
                            u[idx].value = e.target.value;
                            setBoarderBreakdown(u);
                          }}
                          className="w-28"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setBoarderBreakdown(
                              boarderBreakdown.filter((_, i) => i !== idx)
                            )
                          }
                          disabled={boarderBreakdown.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setBoarderBreakdown([
                          ...boarderBreakdown,
                          { name: "", value: "" },
                        ])
                      }
                    >
                      Add line
                    </Button>
                    <input
                      type="file"
                      accept=".csv"
                      className="text-xs"
                      onChange={buildCsvImportHandler(setBoarderBreakdown)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                className="rounded-xl px-6 py-3 font-semibold hover:bg-gray-50 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {editingFee
                  ? "Update Fee Structure"
                  : createFeeMode === "segmented"
                    ? "Create day & boarder fee structures"
                    : "Create unified fee structure"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced View Fee Structure Dialog */}
      <Dialog open={!!viewingFee} onOpenChange={() => setViewingFee(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl bg-white">
          <DialogHeader className="relative border-b pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewingFee(null)}
              className="absolute right-2 top-2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Fee Structure Details
            </DialogTitle>
          </DialogHeader>

          {viewingFee && (
            <div className="space-y-4 pt-4">
              {/* Header Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Term / Year</p>
                      <p className="font-semibold text-sm text-gray-800">
                        {viewingFee.term || 'N/A'} / {viewingFee.academicYear?.name || viewingFee.year || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Grade</p>
                      <p className="font-semibold text-sm text-gray-800">
                        {viewingFee.gradeName || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 col-span-2 border-t pt-2 mt-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="font-bold text-base text-green-700">
                        KES {viewingFee.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800">
                  Fee Breakdown
                </Label>
                <div className="rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                  <Table>
                    <TableBody>
                      {Array.isArray(viewingFee.breakdown)
                        ? viewingFee.breakdown.map(
                            (item, idx) =>
                              item.value > 0 && (
                                <TableRow key={item.name + idx}>
                                  <TableCell className="font-medium capitalize py-2 text-sm">
                                    {item.name}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold py-2 text-sm">
                                    KES {Number(item.value).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              )
                          )
                        : Object.entries(viewingFee.breakdown || {}).map(
                            ([key, value]) =>
                              value > 0 && (
                                <TableRow key={key}>
                                  <TableCell className="font-medium capitalize py-2 text-sm">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold py-2 text-sm">
                                    KES {value?.toLocaleString() || "0"}
                                  </TableCell>
                                </TableRow>
                              )
                          )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tabs for History and Details */}
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                  <TabsTrigger
                    value="history"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm h-8"
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm h-8"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="history"
                  className="space-y-2 mt-2 max-h-48 overflow-y-auto"
                >
                  {viewingFee.logs && viewingFee.logs.length > 0 ? (
                    <div className="space-y-2">
                      {viewingFee.logs.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="p-1 bg-blue-100 rounded-md">
                            <History className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-xs text-gray-900">
                              {log.action ? log.action.charAt(0).toUpperCase() + log.action.slice(1) : 'Action'}{" "}
                              by {log.user?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No date'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-center text-gray-500 py-4">
                      No history yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-600 font-medium">
                        Created By
                      </div>
                      <div className="font-semibold text-xs text-blue-800">
                        {viewingFee.creator?.name || 'Admin'}
                      </div>
                      <div className="text-sm text-blue-600">
                        {viewingFee.creator?.email || 'admin'}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-600 font-medium">
                        Created On
                      </div>
                      <div className="font-semibold text-xs text-green-800">
                        {new Date(viewingFee.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 col-span-2">
                      <div className="text-xs text-purple-600 font-medium">
                        Status
                      </div>
                      <Badge
                        variant={viewingFee.isActive ? "default" : "secondary"}
                        className={`${
                          viewingFee.isActive
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        } font-medium text-xs`}
                      >
                        <div className="flex items-center space-x-1">
                          {viewingFee.isActive ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>
                            {viewingFee.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
