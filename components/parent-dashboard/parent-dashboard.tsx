"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Camera, Users, DollarSign, Receipt, BarChart2, Key, LogOut } from "lucide-react";
import { ReceiptView } from "@/components/ui/receipt-view";
import { useRouter } from "next/navigation";

export function ParentDashboard({ schoolCode, parentId }: { schoolCode: string; parentId: string }) {
  const [parent, setParent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [showPay, setShowPay] = useState<string | null>(null);
  const [payMsg, setPayMsg] = useState("");
  const [activeTab, setActiveTab] = useState("children");
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

  useEffect(() => {
    async function fetchParentAndStudents() {
      try {
        // Fetch parent by parentId (phone/email) and schoolCode
        const res = await fetch(`/api/schools/${schoolCode}/parents?parentId=${parentId}`);
        if (!res.ok) throw new Error("Failed to fetch parent");
        const parentData = await res.json();
        setParent(parentData.parent);
        setAvatarUrl(parentData.parent?.avatarUrl || null);
        setStudents(parentData.students || []);
        // Fetch all receipts for all children (if you have a payments API, use it here)
        // setReceipts(await fetchPaymentsForChildren(...))
      } catch (err) {
        setParent(null);
        setStudents([]);
        setAvatarUrl(null);
      }
    }
    fetchParentAndStudents();
  }, [schoolCode, parentId]);

  const handlePayFees = (admissionNumber: string) => {
    setShowPay(admissionNumber);
    setTimeout(() => {
      setPayMsg("Payment successful! (Simulated)");
      setTimeout(() => {
        setShowPay(null);
        setPayMsg("");
      }, 2000);
    }, 1500);
  };

  // Simulate profile image upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be less than 5MB.");
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const url = ev.target?.result as string;
      setAvatarUrl(url);
      setAvatarUploading(false);
      // Update parent avatar via API
      await fetch(`/api/schools/${schoolCode}/parents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, avatarUrl: url }),
      });
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Logout logic
  const handleLogout = () => {
    localStorage.removeItem("parent-auth");
    router.replace(`/schools/${schoolCode}/parent/login`);
  };

  // Change password logic
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    // Update parent password via API
    const res = await fetch(`/api/schools/${schoolCode}/parents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, oldPassword, newPassword }),
    });
    if (res.ok) {
      setPasswordMsg("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setPasswordMsg(data.error || "Failed to change password");
    }
  };

  if (!parent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">Parent not found or not linked to any students.</Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white/90 shadow-xl flex flex-col items-center py-10 px-6 border-r rounded-r-3xl min-h-screen sticky top-0 z-10">
        {/* Profile at top */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
            <img
              src={avatarUrl || "/placeholder-user.jpg"}
              alt={parent.parentName || "Parent Avatar"}
              className="rounded-full object-cover w-full h-full"
            />
            <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} ref={fileInputRef} />
              <Camera className="w-5 h-5" />
            </label>
            {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
            {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
          </Avatar>
          <div className="text-xl font-bold text-gray-900">{parent.parentName}</div>
          <div className="text-blue-700 font-semibold text-sm">{parent.parentPhone}</div>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col w-full gap-2 mb-10">
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "children" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("children")}
          >
            <Users className="w-6 h-6" /> My Children
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "fees" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("fees")}
          >
            <DollarSign className="w-6 h-6" /> Fees
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "receipts" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("receipts")}
          >
            <Receipt className="w-6 h-6" /> Receipts
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "performance" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("performance")}
          >
            <BarChart2 className="w-6 h-6" /> Performance
          </button>
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeTab === "settings" ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
            onClick={() => setActiveTab("settings")}
          >
            <Key className="w-6 h-6" /> Settings
          </button>
          <Button onClick={handleLogout} variant="outline" className="w-full flex items-center gap-2 mt-8 border-blue-200">
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-16 px-8">
        <div className="w-full flex flex-col items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="hidden" />
            {/* My Children Tab */}
            <TabsContent value="children">
              <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">My Children</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="grid gap-8 md:grid-cols-2">
                    {students.map((student: any) => (
                      <Card key={student.admissionNumber} className="bg-blue-50/50 border-0 shadow-md p-6 flex flex-col items-center">
                        <CardTitle className="text-xl font-bold text-blue-700 mb-2">{student.name}</CardTitle>
                        <div className="mb-1 text-gray-700">Admission No: <b>{student.admissionNumber}</b></div>
                        <div className="mb-1 text-gray-700">Class: <b>{student.class}</b></div>
                        <div className="mb-1 text-gray-700">Status: <b>{student.status}</b></div>
                        <div className="mb-1 text-gray-700">Phone: <b>{student.phone || "-"}</b></div>
                        <div className="mb-1 text-gray-700">Email: <b>{student.email || "-"}</b></div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Fees Tab */}
            <TabsContent value="fees">
              <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Fees</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  <div className="grid gap-8 md:grid-cols-2">
                    {students.map((student: any) => (
                      <Card key={student.admissionNumber} className="bg-green-50/50 border-0 shadow-md p-6 flex flex-col items-center">
                        <CardTitle className="text-xl font-bold text-green-700 mb-2">{student.name}</CardTitle>
                        <div className="mb-1 text-gray-700">Outstanding Fees: <b>KES 0.00</b> (Simulated)</div>
                        <Button
                          className="w-full"
                          onClick={() => handlePayFees(student.admissionNumber)}
                          disabled={showPay === student.admissionNumber}
                        >
                          {showPay === student.admissionNumber ? "Processing..." : "Pay Fees"}
                        </Button>
                        {showPay === student.admissionNumber && payMsg && (
                          <div className="mt-2 text-green-700 font-semibold">{payMsg}</div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Receipts Tab */}
            <TabsContent value="receipts">
              <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Receipts</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  {receipts.length === 0 ? (
                    <div className="text-center text-gray-500">No receipts found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border mb-6">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Student</th>
                            <th className="px-4 py-2 border">Receipt No</th>
                            <th className="px-4 py-2 border">Date</th>
                            <th className="px-4 py-2 border">Amount</th>
                            <th className="px-4 py-2 border">Method</th>
                            <th className="px-4 py-2 border">Description</th>
                            <th className="px-4 py-2 border">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receipts.map((receipt) => (
                            <tr key={receipt.id}>
                              <td className="px-4 py-2 border">{receipt.student.name}</td>
                              <td className="px-4 py-2 border">{receipt.receiptNumber}</td>
                              <td className="px-4 py-2 border">{new Date(receipt.paymentDate).toLocaleDateString()}</td>
                              <td className="px-4 py-2 border">{receipt.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 border">{receipt.paymentMethod.replace('_', ' ').toUpperCase()}</td>
                              <td className="px-4 py-2 border">{receipt.description}</td>
                              <td className="px-4 py-2 border">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReceipt(receipt)}
                                  className="flex items-center gap-1"
                                >
                                  <Receipt className="w-4 h-4" /> View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {selectedReceipt && (
                    <ReceiptView
                      receipt={selectedReceipt}
                      studentName={selectedReceipt.student.name}
                      studentClass={selectedReceipt.student.class}
                      admissionNumber={selectedReceipt.student.admissionNumber}
                      onClose={() => setSelectedReceipt(null)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Performance Tab */}
            <TabsContent value="performance">
              <Card className="w-full max-w-4xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold text-blue-800 mb-6 text-center">Performance</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                  {students.length === 0 ? (
                    <div className="text-center text-gray-500">No students found.</div>
                  ) : (
                    students.map((student: any) => (
                      <div key={student.admissionNumber} className="mb-8">
                        <div className="text-lg font-bold text-blue-700 mb-2">{student.name} - {student.class}</div>
                        <div className="mb-4 text-gray-700 text-lg">Below are your child's term-based grades. Download their performance report for each term.</div>
                        <table className="min-w-full text-sm border mb-6">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-4 py-2 border">Term</th>
                              <th className="px-4 py-2 border">Average Grade</th>
                              <th className="px-4 py-2 border">Download Report</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Placeholder data, replace with real grades if available */}
                            <tr>
                              <td className="px-4 py-2 border">Term 1</td>
                              <td className="px-4 py-2 border">B+</td>
                              <td className="px-4 py-2 border">
                                <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 border">Term 2</td>
                              <td className="px-4 py-2 border">A-</td>
                              <td className="px-4 py-2 border">
                                <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 border">Term 3</td>
                              <td className="px-4 py-2 border">A</td>
                              <td className="px-4 py-2 border">
                                <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-500 mb-6">(Settings and preferences will appear here.)</div>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto bg-blue-50 p-6 rounded-xl shadow">
                    <div className="text-lg font-semibold mb-2 flex items-center gap-2"><Key className="w-5 h-5" /> Change Password</div>
                    <Input
                      type="password"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Old Password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                    />
                    <Input
                      type="password"
                      className="w-full border rounded px-3 py-2"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <Input
                      type="password"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    {passwordMsg && <div className={`text-sm ${passwordMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>{passwordMsg}</div>}
                    <Button type="submit" className="w-full">Change Password</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 