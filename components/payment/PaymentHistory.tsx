"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
  Download, 
  Search, 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  AlertCircle,
  Receipt,
  ArrowUpDown,
  Filter,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react";
import ReceiptComponent from "./ReceiptComponent";

interface PaymentRecord {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  description: string;
  referenceNumber: string;
  receivedBy: string;
  term: string;
  academicYear: string;
  termOutstandingBefore: number;
  termOutstandingAfter: number;
  academicYearOutstandingBefore: number;
  academicYearOutstandingAfter: number;
  carryForward?: number;
  status: string;
  receipt?: {
    id: string;
    receiptNumber: string;
    termOutstandingBefore: number;
    termOutstandingAfter: number;
    academicYearOutstandingBefore: number;
    academicYearOutstandingAfter: number;
  };
  student?: {
    name: string;
    admissionNumber: string;
    parentName: string;
  };
  school?: {
    name: string;
  };
}

interface PaymentHistoryProps {
  studentId: string;
  schoolCode: string;
  className?: string;
}

export default function PaymentHistory({ studentId, schoolCode, className = "" }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Summary states
  const [paymentSummary, setPaymentSummary] = useState({
    totalPaid: 0,
    totalPayments: 0,
    averagePayment: 0,
    lastPaymentDate: null as string | null,
    mostRecentBalance: 0
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, [studentId, schoolCode]);

  useEffect(() => {
    filterAndSortPayments();
  }, [payments, searchTerm, selectedTerm, selectedYear, sortOrder]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/schools/${schoolCode}/payments?studentId=${studentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }
      
      const data = await response.json();
      const paymentsData = Array.isArray(data) ? data : data.payments || [];
      
      setPayments(paymentsData);
      calculateSummary(paymentsData);
      
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setError("Failed to load payment history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsData: PaymentRecord[]) => {
    if (paymentsData.length === 0) {
      setPaymentSummary({
        totalPaid: 0,
        totalPayments: 0,
        averagePayment: 0,
        lastPaymentDate: null,
        mostRecentBalance: 0
      });
      return;
    }

    const totalPaid = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalPayments = paymentsData.length;
    const averagePayment = totalPayments > 0 ? totalPaid / totalPayments : 0;
    
    // Sort by date to get the most recent payment
    const sortedByDate = [...paymentsData].sort((a, b) => 
      new Date(b.paymentDate || 0).getTime() - new Date(a.paymentDate || 0).getTime()
    );
    
    const lastPaymentDate = sortedByDate[0]?.paymentDate || null;
    const mostRecentBalance = sortedByDate[0]?.academicYearOutstandingAfter || 0;

    setPaymentSummary({
      totalPaid,
      totalPayments,
      averagePayment,
      lastPaymentDate,
      mostRecentBalance
    });
  };

  const filterAndSortPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Term filter
    if (selectedTerm !== "all") {
      filtered = filtered.filter(payment => payment.term === selectedTerm);
    }

    // Academic year filter
    if (selectedYear !== "all") {
      filtered = filtered.filter(payment => payment.academicYear === selectedYear);
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setFilteredPayments(filtered);
  };

  const handleViewReceipt = (payment: PaymentRecord) => {
    // Create receipt data matching the ReceiptComponent interface
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.id,
      studentId: studentId,
      schoolCode: schoolCode,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      feeType: "School Fees", // Default fee type
      term: payment.term,
      academicYear: payment.academicYear,
      reference: payment.referenceNumber,
      phoneNumber: undefined, // Would need to be added to payment record
      transactionId: payment.referenceNumber,
      status: payment.status,
      issuedAt: new Date(payment.paymentDate),
      issuedBy: payment.receivedBy || "Parent Portal",
      schoolName: payment.school?.name || "School",
      studentName: payment.student?.name || "Student",
      admissionNumber: payment.student?.admissionNumber || "",
      parentName: payment.student?.parentName || "Parent",
      currency: "KES",
      termOutstandingBefore: payment.termOutstandingBefore,
      termOutstandingAfter: payment.termOutstandingAfter,
      academicYearOutstandingBefore: payment.academicYearOutstandingBefore,
      academicYearOutstandingAfter: payment.academicYearOutstandingAfter,
      carryForward: payment.carryForward
    };

    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'KES 0';
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUniqueTerms = () => {
    const terms = [...new Set(payments.map(p => p.term))];
    return terms.sort();
  };

  const getUniqueYears = () => {
    const years = [...new Set(payments.map(p => p.academicYear))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  };

  const exportPaymentHistory = () => {
    const csvContent = [
      ["Receipt Number", "Date", "Amount", "Payment Method", "Term", "Academic Year", "Description", "Balance After"],
      ...filteredPayments.map(payment => [
        payment.receiptNumber,
        formatDate(payment.paymentDate),
        payment.amount.toString(),
        payment.paymentMethod,
        payment.term,
        payment.academicYear,
        payment.description,
        payment.academicYearOutstandingAfter.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${studentId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPaymentHistory} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.totalPaid)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Payments</p>
                <p className="text-2xl font-bold">{paymentSummary.totalPayments}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Average Payment</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.averagePayment)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${paymentSummary.mostRecentBalance > 0 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} text-white`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${paymentSummary.mostRecentBalance > 0 ? 'text-orange-100' : 'text-green-100'} text-sm`}>Current Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentSummary.mostRecentBalance)}</p>
              </div>
              {paymentSummary.mostRecentBalance > 0 ? 
                <TrendingDown className="w-8 h-8 text-orange-200" /> : 
                <TrendingUp className="w-8 h-8 text-green-200" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Payment History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={exportPaymentHistory} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={fetchPaymentHistory} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {getUniqueTerms().map(term => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {getUniqueYears().map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredPayments.length} of {payments.length} payments
            </div>
          </div>

          {/* Payment Records */}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {payments.length === 0 ? "No payments found" : "No payments match your filters"}
              </h3>
              <p className="text-gray-500">
                {payments.length === 0 
                  ? "This student hasn't made any payments yet." 
                  : "Try adjusting your search criteria to find more payments."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Payment Details */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-sm">{payment.receiptNumber}</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                        </div>

                        {/* Academic Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-sm">{payment.term} {payment.academicYear}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{payment.description}</p>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 capitalize">{(payment.paymentMethod || '').replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Balance Info */}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Balance After Payment:</p>
                          <p className={`font-semibold ${payment.academicYearOutstandingAfter <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {formatCurrency(payment.academicYearOutstandingAfter)}
                          </p>
                          {payment.carryForward && payment.carryForward > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Overpaid: {formatCurrency(payment.carryForward)}
                            </p>
                          )}
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewReceipt(payment)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <ReceiptComponent
          receiptData={selectedReceipt}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
        />
      )}
    </div>
  );
}


