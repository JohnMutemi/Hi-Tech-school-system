"use client"

import { useParams } from "next/navigation"
import { ParentDashboard } from "@/components/parent-dashboard/parent-dashboard"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export default function ParentDashboardPage() {
  const params = useParams()
  const schoolCode = params.schoolCode as string
  const [studentFeeData, setStudentFeeData] = useState<any>({})
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<any>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false)

  const fetchStudentFeeSummaries = async () => {
    if (students.length === 0) return;
    const summaries: any = {};
    await Promise.all(
      students.map(async (student) => {
        try {
          const res = await fetch(
            `/api/schools/${schoolCode}/students/${student.id}/fees`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const data = await res.json();
            const currentYear = new Date().getFullYear();
            const yearTerms = data.feesByYear?.[currentYear]?.terms || [];
            summaries[student.id] = yearTerms;
          }
        } catch (e) {
          // ignore
        }
      })
    );
    setStudentFeeData({ ...summaries });
  };

  useEffect(() => {
    if (students.length > 0) {
      fetchStudentFeeSummaries();
    }
  }, [students]);

  const getStudentFeeStructure = (studentId: string) => {
    const termOrder = ["Term 1", "Term 2", "Term 3"];
    const terms = studentFeeData[studentId] || [];
    const sortedTerms = [...terms].sort((a, b) => termOrder.indexOf(a.term) - termOrder.indexOf(b.term));
    const firstUnpaid = sortedTerms.find(term => term.balance > 0);
    return firstUnpaid || sortedTerms[0];
  };

  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(student.id);
    if (!feeStructure) {
      toast({
        title: "Error",
        description: "No fee structure available for this student",
        variant: "destructive",
      });
      return;
    }
    setSelectedStudent(student);
    setSelectedFeeStructure(feeStructure);
    setPaymentModalOpen(true);
  };

  // This page will use session-based authentication (no parentId in URL)
  return <ParentDashboard schoolCode={schoolCode} />
} 