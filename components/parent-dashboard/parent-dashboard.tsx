"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CheckCircle, AlertCircle, Baby } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ReceiptGenerator } from "@/components/fees/receipt-generator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogDescription } from "@/components/ui/dialog";

// Import the JSON data directly
import edusmsData from "@/data/edusms.json";

export function ParentDashboard({ schoolCode, parentId }: { schoolCode: string; parentId: string }) {
  const router = useRouter();
  const [schoolData, setSchoolData] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [feesSummary, setFeesSummary] = useState<any>(null);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      console.log("Loading data for schoolCode:", schoolCode, "parentId:", parentId);
      
      // Decode the parent ID (which is actually the parent email)
      const parentEmail = decodeURIComponent(parentId);
      console.log("Decoded parent email:", parentEmail);
      
      // Find school by code
      const school = edusmsData.schools.find((s: any) => s.code === schoolCode);
      console.log("School found:", school);
      setSchoolData(school);
      
      if (!school) {
        console.log("School not found for code:", schoolCode);
        return;
      }
      
      // Find children in local data by parent email
      const childrenData = edusmsData.students.filter((s: any) => {
        const matchesSchool = s.schoolId === school.id;
        const matchesEmail = s.parentEmail === parentEmail;
        
        console.log(`Student ${s.admissionNumber}:`, {
          matchesSchool,
          matchesEmail,
          parentEmail: s.parentEmail,
          lookingFor: parentEmail
        });
        
        return matchesSchool && matchesEmail;
      }).map((student: any) => {
        // Find the corresponding user to get the name
        const user = edusmsData.users.find((u: any) => u.id === student.userId);
        return {
          ...student,
          name: user?.name || `Student ${student.admissionNumber}`,
          email: user?.email || '',
          phone: user?.phone || '',
          className: student.classId ? edusmsData.classes.find((c: any) => c.id === student.classId)?.name || 'Unknown' : 'Unknown',
          isActive: student.isActive
        };
      });
      
      console.log("Children found:", childrenData);
      setChildren(childrenData);
      if (childrenData.length > 0) setSelectedChild(childrenData[0].id);
    };
    loadData();
  }, [schoolCode, parentId]);

  useEffect(() => {
    if (selectedChild) loadChildData(selectedChild);
  }, [selectedChild, schoolCode]);

  const loadChildData = (childId: string) => {
    // Get fees from local data
    const fees = edusmsData.studentFees
      .filter((fee: any) => fee.studentId === childId)
      .map((fee: any) => ({ ...fee, name: `Fee ${fee.id}`, status: fee.status || "pending" }));
    setStudentFees(fees);
    
    // Get payments from local data
    const pays = edusmsData.payments
      .filter((p: any) => p.studentId === childId)
      .map((p: any) => ({ ...p, status: "completed" }));
    setPayments(pays);
    
    // Get receipts from local data
    const recs = edusmsData.receipts
      .filter((r: any) => r.studentId === childId)
      .map((r: any) => ({ ...r, generatedAt: r.createdAt }));
    setReceipts(recs);
      
    setFeesSummary({
      totalFees: fees.reduce((sum: number, f: any) => sum + f.amount, 0),
      totalPaid: fees.reduce((sum: number, f: any) => sum + (f.amount - f.balance), 0),
      totalBalance: fees.reduce((sum: number, f: any) => sum + f.balance, 0),
      pendingFees: fees.filter((f: any) => f.status === "pending").length,
      overdueFees: fees.filter((f: any) => f.status === "overdue").length,
      paidFees: fees.filter((f: any) => f.status === "paid").length,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="default">Paid</Badge>;
      case "overdue": return <Badge variant="destructive">Overdue</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "partial": return <Badge variant="outline">Partial</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('parentSession');
      sessionStorage.removeItem('parentSession');
    }
    router.push(`/schools/${schoolCode}/parent/login`);
  };

  const selectedChildData = children.find((c) => c.id === selectedChild);

  if (!schoolData || children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No children found for this parent</p>
          <p className="text-sm text-gray-500 mt-2">
            Parent Email: {decodeURIComponent(parentId)}
          </p>
          <p className="text-sm text-gray-500">
            School: {schoolData?.name || schoolCode}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Available parents for this school:
          </p>
          <p className="text-xs text-gray-400">
            {edusmsData.students
              .filter((s: any) => s.schoolId === schoolData?.id)
              .map((s: any) => s.parentEmail)
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Child Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Child</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} - {child.admissionNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedChildData && (
              <>
                {/* Child Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Child Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold">{selectedChildData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Admission Number</p>
                        <p className="font-semibold">{selectedChildData.admissionNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Class</p>
                        <p className="font-semibold">{selectedChildData.className}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge variant={selectedChildData.isActive ? "default" : "secondary"}>
                          {selectedChildData.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Fees</p>
                          <p className="text-2xl font-bold">${feesSummary?.totalFees?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Paid</p>
                          <p className="text-2xl font-bold text-green-600">${feesSummary?.totalPaid?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Balance</p>
                          <p className="text-2xl font-bold text-red-600">${feesSummary?.totalBalance?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        );

      case 'fees':
        return selectedChildData ? (
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure - {selectedChildData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.name}</TableCell>
                      <TableCell>${fee.amount.toFixed(2)}</TableCell>
                      <TableCell>${fee.balance.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Please select a child to view fees</p>
            </CardContent>
          </Card>
        );

      case 'payments':
        return selectedChildData ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment History - {selectedChildData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>${p.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{p.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Please select a child to view payments</p>
            </CardContent>
          </Card>
        );

      case 'receipts':
        return selectedChildData ? (
          <Card>
            <CardHeader>
              <CardTitle>Receipts - {selectedChildData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.receiptNumber}</TableCell>
                      <TableCell>{new Date(r.generatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>${r.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="default">Available</Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog open={isReceiptModalOpen && selectedReceipt?.id === r.id} onOpenChange={setIsReceiptModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReceipt(r);
                                setIsReceiptModalOpen(true);
                              }}
                            >
                              View/Download
                            </Button>
                          </DialogTrigger>
                          {selectedReceipt && isReceiptModalOpen && selectedReceipt.id === r.id && (
                            <DialogContent className="sm:max-w-[800px] p-0">
                              <DialogHeader className="p-6 pb-0">
                                <DialogTitle>Receipt Details</DialogTitle>
                                <DialogDescription>Generate and download this receipt.</DialogDescription>
                              </DialogHeader>
                              <ReceiptGenerator receipt={selectedReceipt} onClose={() => setIsReceiptModalOpen(false)} />
                            </DialogContent>
                          )}
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Please select a child to view receipts</p>
            </CardContent>
          </Card>
        );

      case 'children':
        return (
          <Card>
            <CardHeader>
              <CardTitle>My Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child) => (
                  <Card key={child.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Baby className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold">{child.name}</h3>
                        <p className="text-sm text-gray-600">{child.admissionNumber}</p>
                        <p className="text-sm text-gray-500">{child.className}</p>
                        <Badge variant={child.isActive ? "default" : "secondary"} className="mt-2">
                          {child.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Parent Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent Email</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                    value={decodeURIComponent(parentId)}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Children</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                    value={children.length}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">School</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                    value={schoolData?.name}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar
        userType="parent"
        user={{
          name: `Parent ${decodeURIComponent(parentId)}`,
          email: decodeURIComponent(parentId),
          avatar: undefined,
          admissionNumber: undefined
        }}
        schoolName={schoolData?.name || 'School'}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'fees' && 'Fee Structure'}
              {activeTab === 'payments' && 'Payment History'}
              {activeTab === 'receipts' && 'Receipts'}
              {activeTab === 'children' && 'My Children'}
              {activeTab === 'profile' && 'Parent Profile'}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'overview' && 'Welcome! Select a child to view their fee information.'}
              {activeTab === 'fees' && 'View and manage fee structures for your children.'}
              {activeTab === 'payments' && 'Track all payment transactions for your children.'}
              {activeTab === 'receipts' && 'Access and download payment receipts for your children.'}
              {activeTab === 'children' && 'View all your children enrolled in this school.'}
              {activeTab === 'profile' && 'Your parent account information and settings.'}
            </p>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
