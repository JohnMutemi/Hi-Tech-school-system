"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  RefreshCw,
  Mail,
  FileText,
  Eye,
  Loader2
} from "lucide-react";
import { EnhancedReceipt } from "@/components/ui/enhanced-receipt";
import { useToast } from "@/hooks/use-toast";

interface ReceiptsSectionProps {
  receipts: any[];
  students: any[];
  schoolCode: string;
  loading?: boolean;
  error?: string;
  refreshReceipts?: () => void;
}

interface ReceiptData {
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  schoolCode: string;
  amount: number;
  paymentMethod: string;
  feeType: string;
  term: string;
  academicYear: string;
  reference: string;
  transactionId?: string;
  status: string;
  issuedAt: Date;
  issuedBy: string;
  schoolName: string;
  studentName: string;
  admissionNumber: string;
  parentName?: string;
  currency: string;
  termOutstandingBefore?: number;
  termOutstandingAfter?: number;
  academicYearOutstandingBefore?: number;
  academicYearOutstandingAfter?: number;
  carryForward?: number;
}

export default function ReceiptsSection({
  receipts = [],
  students = [],
  schoolCode,
  loading = false,
  error = "",
  refreshReceipts,
}: ReceiptsSectionProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter receipts based on search criteria
  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      searchTerm === "" ||
      receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStudent =
      selectedStudent === "all" || receipt.studentId === selectedStudent;

    const matchesStatus =
      selectedStatus === "all" || 
      receipt.status?.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStudent && matchesStatus;
  });

  // Convert receipt to ReceiptData format for EnhancedReceipt
  const convertToReceiptData = (receipt: any): ReceiptData => {
    const student = students.find(s => s.id === receipt.studentId);
    
    return {
      receiptNumber: receipt.receiptNumber || "N/A",
      paymentId: receipt.paymentId || receipt.id,
      studentId: receipt.studentId,
      schoolCode,
      amount: receipt.amount || 0,
      paymentMethod: receipt.paymentMethod || "manual",
      feeType: receipt.feeType || "School Fees",
      term: receipt.term || "N/A",
      academicYear: receipt.academicYear || new Date().getFullYear().toString(),
      reference: receipt.referenceNumber || receipt.reference || "N/A",
      transactionId: receipt.transactionId,
      status: receipt.status || "completed",
      issuedAt: new Date(receipt.paymentDate || receipt.createdAt),
      issuedBy: receipt.issuedBy || "School System",
      schoolName: receipt.schoolName || "Hi-Tech School",
      studentName: receipt.studentName || student?.name || student?.fullName || "N/A",
      admissionNumber: receipt.admissionNumber || student?.admissionNumber || "N/A",
      parentName: receipt.parentName,
      currency: receipt.currency || "KES",
      termOutstandingBefore: receipt.termOutstandingBefore,
      termOutstandingAfter: receipt.termOutstandingAfter,
      academicYearOutstandingBefore: receipt.academicYearOutstandingBefore,
      academicYearOutstandingAfter: receipt.academicYearOutstandingAfter,
      carryForward: receipt.carryForward
    };
  };

  const handleViewReceipt = (receipt: any) => {
    const receiptData = convertToReceiptData(receipt);
    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  const handleDownloadReceipt = async (receipt: any) => {
    setDownloadingReceipt(receipt.id);
    try {
      // Try to use the API endpoint for receipt download if available
      if (receipt.receiptNumber) {
        const downloadUrl = `/api/schools/${schoolCode}/receipts/${receipt.receiptNumber}/download`;
        window.open(downloadUrl, '_blank');
      } else {
        // Fallback: trigger the enhanced receipt download
        const receiptData = convertToReceiptData(receipt);
        setSelectedReceipt(receiptData);
        setShowReceiptModal(true);
        
        toast({
          title: "Receipt Opened",
          description: "You can download the receipt from the modal using the download buttons.",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount?.toLocaleString() || 0}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'completed';
    switch (statusLower) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            <span>Loading payment receipts...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="w-12 h-12 text-red-300 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            {refreshReceipts && (
              <Button onClick={refreshReceipts} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Receipt className="w-6 h-6 text-blue-600" />
                Payment Receipts
              </CardTitle>
              <p className="text-gray-600 mt-1">
                View and download all payment receipts for your children
              </p>
            </div>
            {refreshReceipts && (
              <Button onClick={refreshReceipts} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name || student.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Receipts ({filteredReceipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No receipts found</p>
              <p className="text-sm text-gray-400">
                {receipts.length === 0 
                  ? "No payment receipts available yet. Receipts will appear here after payments are made."
                  : "Try adjusting your search criteria."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => {
                    const student = students.find(s => s.id === receipt.studentId);
                    return (
                      <TableRow key={receipt.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {receipt.receiptNumber || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{receipt.studentName || student?.name || student?.fullName || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate" title={receipt.description}>
                            {receipt.description || 'Fee Payment'}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(receipt.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(receipt.paymentDate || receipt.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {(receipt.paymentMethod || 'manual').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(receipt.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReceipt(receipt)}
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReceipt(receipt)}
                              disabled={downloadingReceipt === receipt.id}
                              title="Download Receipt"
                            >
                              {downloadingReceipt === receipt.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <EnhancedReceipt
          receiptData={selectedReceipt}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
          showActions={true}
        />
      )}
    </div>
  );
}
