import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export function useParentDashboard(schoolCode: string, parentId?: string) {
  const [parent, setParent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loadingFees, setLoadingFees] = useState(true);
  const [pendingParentCredentials, setPendingParentCredentials] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<any>(null);
  const [focusedChildId, setFocusedChildId] = useState<string | null>(null);
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<any>({});
  const [studentFeeData, setStudentFeeData] = useState<any>({});
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [currentTerm, setCurrentTerm] = useState<any>(null);
  const [loadingAcademicInfo, setLoadingAcademicInfo] = useState(true);
  const [academicInfoError, setAcademicInfoError] = useState("");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [filterLoading, setFilterLoading] = useState(true);
  const [filterError, setFilterError] = useState("");
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");
  const [receiptSearch, setReceiptSearch] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");

  // Fetch parent and children
  useEffect(() => {
    async function fetchParentAndChildren() {
      if (!schoolCode || !parentId) return;
      try {
        // Get base URL for deployed environment
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const res = await fetch(`${baseUrl}/api/schools/${schoolCode}/parents/${parentId}`);
        if (res.ok) {
          const data = await res.json();
          setParent(data.parent);
          setStudents(data.students);
        }
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchParentAndChildren();
  }, [schoolCode, parentId]);

  // Fetch all receipts for all children
  useEffect(() => {
    async function fetchAllReceipts() {
      if (!students || students.length === 0) {
        setReceipts([]);
        return;
      }
      setLoadingReceipts(true);
      setReceiptsError("");
      try {
        const allReceipts: any[] = [];
        // Get base URL for deployed environment
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        
        for (const student of students) {
          const res = await fetch(`${baseUrl}/api/schools/${schoolCode}/students/${student.id}/receipts`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              allReceipts.push(...data);
            }
          }
        }
        setReceipts(allReceipts);
      } catch (e) {
        setReceiptsError("Failed to fetch receipts");
        setReceipts([]);
      }
      setLoadingReceipts(false);
    }
    fetchAllReceipts();
  }, [schoolCode, students]);

  // Fetch payments for a given student
  const refreshPayments = async (studentId: string) => {
    if (!studentId) {
      setPayments([]);
      return;
    }
    setLoadingPayments(true);
    setPaymentsError("");
    try {
      // Get base URL for deployed environment
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const res = await fetch(`${baseUrl}/api/schools/${schoolCode}/students/${studentId}/payments`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setPayments(Array.isArray(data.payments) ? data.payments : data);
    } catch (e: any) {
      setPaymentsError(e.message || "Failed to load payments");
      setPayments([]);
    }
    setLoadingPayments(false);
  };

  // Avatar change handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("File size must be less than 5MB");
      return;
    }
    setAvatarUploading(true);
    setAvatarError("");
    // Simulate upload
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
        setAvatarUploading(false);
        toast({ title: "Avatar Updated", description: "Profile picture updated successfully" });
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      // Get base URL for deployed environment
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      await fetch(`${baseUrl}/api/schools/${schoolCode}/parents/logout`, { method: "POST" });
      router.push(`/schools/${schoolCode}/parent/login`);
    } catch (error) {
      router.push(`/schools/${schoolCode}/parent/login`);
    }
  };

  // Add all effects and handlers from ParentDashboard here
  // ...

  return {
    parent,
    students,
    isLoading,
    activeTab,
    setActiveTab,
    avatarUploading,
    avatarError,
    avatarUrl,
    setAvatarUrl,
    fileInputRef,
    receipts,
    setReceipts,
    selectedReceipt,
    setSelectedReceipt,
    router,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordMsg,
    setPasswordMsg,
    feeStructures,
    setFeeStructures,
    loadingFees,
    setLoadingFees,
    pendingParentCredentials,
    setPendingParentCredentials,
    paymentModalOpen,
    setPaymentModalOpen,
    selectedStudent,
    setSelectedStudent,
    selectedFeeStructure,
    setSelectedFeeStructure,
    focusedChildId,
    setFocusedChildId,
    studentFeeSummaries,
    setStudentFeeSummaries,
    studentFeeData,
    setStudentFeeData,
    currentAcademicYear,
    setCurrentAcademicYear,
    currentTerm,
    setCurrentTerm,
    loadingAcademicInfo,
    setLoadingAcademicInfo,
    academicInfoError,
    setAcademicInfoError,
    academicYears,
    setAcademicYears,
    terms,
    setTerms,
    selectedYearId,
    setSelectedYearId,
    selectedTermId,
    setSelectedTermId,
    filterLoading,
    setFilterLoading,
    filterError,
    setFilterError,
    loadingReceipts,
    setLoadingReceipts,
    receiptsError,
    setReceiptsError,
    receiptSearch,
    setReceiptSearch,
    payments,
    loadingPayments,
    paymentsError,
    refreshPayments,
    fetchAllReceipts,
    handleAvatarChange,
    handleLogout,
    // Add all handlers and utility functions here
    // ...
  };
} 