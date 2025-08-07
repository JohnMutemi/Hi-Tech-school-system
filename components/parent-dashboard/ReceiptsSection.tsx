import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Loader2, Download } from "lucide-react";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptsSectionProps {
  students: any[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  schoolCode: string;
  payments: any[];
  loadingPayments: boolean;
  paymentsError: string;
  refreshPayments: (studentId: string) => void;
}

export default function ReceiptsSection({
  students = [],
  selectedId,
  setSelectedId,
  schoolCode,
}: ReceiptsSectionProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [downloadFormat, setDownloadFormat] = useState("A4");
  const [step, setStep] = useState<"format" | "preview">("format");
  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch receipts for selected child
  useEffect(() => {
    async function fetchReceipts() {
      if (!selectedId) return setReceipts([]);
      setLoadingReceipts(true);
      setReceiptsError("");
      try {
        const res = await fetch(`/api/schools/${schoolCode}/students/${selectedId}/receipts`);
        if (!res.ok) throw new Error("Failed to fetch receipts");
        const data = await res.json();
        setReceipts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setReceiptsError(e.message || "Failed to load receipts");
        setReceipts([]);
      }
      setLoadingReceipts(false);
    }
    fetchReceipts();
  }, [schoolCode, selectedId]);

  // No search, just show all receipts
  const filteredReceipts = receipts;

  function handleDownload(receipt: any) {
    setSelectedReceipt(receipt);
    setShowModal(true);
    setStep("format");
  }

  function closeModal() {
    setShowModal(false);
    setSelectedReceipt(null);
    setStep("format");
  }

  function downloadHTML() {
    if (!selectedReceipt) return;
    const html = document.getElementById("receipt-html-preview")?.outerHTML;
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${selectedReceipt.reference || selectedReceipt.referenceNumber || selectedReceipt.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // PDF download using html2canvas + jsPDF for WYSIWYG export
  async function downloadPDF() {
    if (!selectedReceipt) return;
    const element = document.getElementById("receipt-html-preview");
    if (!element) return;

    // Use html2canvas to capture the receipt as an image
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    // Calculate PDF size based on format
    let pdfWidth = 210; // default A4 width in mm
    let pdfHeight = 297; // default A4 height in mm
    if (downloadFormat === "A3") {
      pdfWidth = 297;
      pdfHeight = 420;
    } else if (downloadFormat === "A5") {
      pdfWidth = 148;
      pdfHeight = 210;
    }

    // Create jsPDF instance
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: downloadFormat.toLowerCase(),
    });

    // Calculate image dimensions to fit PDF
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    const y = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0;

    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
    pdf.save(`receipt-${selectedReceipt.reference || selectedReceipt.id}.pdf`);
  }

  return (
    <div className="h-full flex flex-col space-y-8">
      <Card className="flex-1 bg-gradient-to-br from-cyan-50/90 via-blue-50/90 to-teal-50/90 border-cyan-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-cyan-800 text-xl">
            <Receipt className="w-7 h-7 text-cyan-600" /> 
            Receipts & Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 h-full flex flex-col">
          {/* Enhanced Child Selection */}
          <div className="bg-white/70 rounded-lg p-4 border border-cyan-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Select Child</label>
            <select
              className="w-full p-4 border-2 border-cyan-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-200 focus:border-cyan-400 bg-white text-gray-900 text-lg font-medium transition-all duration-200"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              {students.map((child: any) => (
                <option key={child.id} value={child.id}>
                  {child.name || child.user?.name || child.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex flex-col justify-center min-h-[300px]">
            {loadingReceipts ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin h-12 w-12 text-cyan-600 mb-4" />
                <p className="text-cyan-600 font-medium text-lg">Loading receipts...</p>
              </div>
            ) : receiptsError ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <p className="text-red-600 font-medium text-lg">Error loading receipts</p>
                <p className="text-red-500 text-sm mt-2">{receiptsError}</p>
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">No receipts found</p>
                <p className="text-gray-400 text-sm mt-2">Payment receipts will appear here once transactions are made.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-cyan-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                        <th className="px-6 py-4 text-left font-semibold">Date</th>
                        <th className="px-6 py-4 text-left font-semibold">Amount</th>
                        <th className="px-6 py-4 text-left font-semibold">Method</th>
                        <th className="px-6 py-4 text-left font-semibold">Reference</th>
                        <th className="px-6 py-4 text-left font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipts.map((r: any, idx: number) => (
                        <tr key={r.id} className={`border-b border-cyan-100 ${idx % 2 === 0 ? 'bg-cyan-25' : 'bg-white'} hover:bg-cyan-50 transition-colors duration-150`}>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-green-700">
                            Ksh {r.amount?.toLocaleString() || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {r.method || r.paymentMethod || "-"}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-600">
                            {r.reference || r.referenceNumber || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDownload(r)}
                              className="border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300"
                            >
                              <Download className="w-4 h-4 mr-2" /> 
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Receipt Modal - Stepper */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-md mx-auto relative flex flex-col items-center">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl" onClick={closeModal}>&times;</button>
            {/* Format selector always visible above preview */}
            <div className="flex justify-between items-center mb-2 w-full max-w-xs mx-auto">
              <h2 className="text-lg font-bold">Receipt Preview</h2>
              <select className="border rounded px-2 py-1" value={downloadFormat} onChange={e => setDownloadFormat(e.target.value)}>
                <option value="A3">A3</option>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
              </select>
            </div>
            {/* Styled HTML Receipt - compact, centered, with logo and thank you note */}
            <div
              id="receipt-html-preview"
              ref={receiptRef}
              className={`relative receipt-paper shadow-2xl ${
                downloadFormat === "A3" ? "w-[480px] min-h-[600px] text-base p-4" :
                downloadFormat === "A4" ? "w-[360px] min-h-[420px] text-sm p-3" :
                "w-[280px] min-h-[320px] text-xs p-2"
              } bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-2 border-blue-200 rounded-2xl mx-auto`}
              style={{ fontFamily: 'serif', boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)', minWidth: 180, margin: '0 auto' }}
            >
              {/* School Logo */}
              <div className="flex justify-center mb-2">
                <img src="/logo.png" alt="School Logo" className="h-12 w-auto" style={{ objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
              <div className="text-center mb-4">
                <div className="text-2xl font-extrabold text-blue-800 tracking-wide drop-shadow">{selectedReceipt.schoolName || "School Name"}</div>
                <div className="text-base text-emerald-700 font-semibold mt-1 tracking-widest">Official Payment Receipt</div>
              </div>
              <div className="mb-2">
                <div className="font-semibold text-gray-700">Student Name:</div>
                <div className="text-gray-900 font-bold">{selectedReceipt.studentName || selectedReceipt.student?.name || "N/A"}</div>
                <div className="font-semibold text-gray-700 mt-1">Admission No:</div>
                <div className="text-gray-900">{selectedReceipt.admissionNumber || selectedReceipt.student?.admissionNumber || "N/A"}</div>
              </div>
              <div className="mb-2">
                <div className="font-semibold text-gray-700">Paid By:</div>
                <div className="text-gray-900 font-bold">{
                  selectedReceipt.parentName ||
                  selectedReceipt.paidBy ||
                  selectedReceipt.payment?.parentName ||
                  selectedReceipt.payment?.paidBy ||
                  selectedReceipt.payment?.student?.parentName ||
                  selectedReceipt.student?.parentName ||
                  selectedReceipt.student?.user?.name ||
                  "(Parent)"
                }</div>
                <div className="font-semibold text-gray-700 mt-1">Receipt Ref:</div>
                <div className="text-gray-900">{selectedReceipt.reference || selectedReceipt.referenceNumber || selectedReceipt.id}</div>
              </div>
              <div className="flex justify-between mb-2 gap-4">
                <div>
                  <div className="font-semibold text-gray-700">Term:</div>
                  <div className="text-gray-900">{selectedReceipt.term || selectedReceipt.termName || "N/A"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Academic Year:</div>
                  <div className="text-gray-900">{selectedReceipt.year || selectedReceipt.academicYear || "N/A"}</div>
                </div>
              </div>
              <div className="flex justify-between mb-2 gap-4">
                <div>
                  <div className="font-semibold text-gray-700">Amount Paid:</div>
                  <div className="text-green-700 font-extrabold">Ksh {selectedReceipt.amount?.toLocaleString() || "0"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Payment Method:</div>
                  <div className="text-gray-900">{selectedReceipt.method || selectedReceipt.paymentMethod || "N/A"}</div>
                </div>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-700">Term Balance:</div>
                  <div className="text-blue-700 font-bold">Ksh {typeof selectedReceipt.termOutstandingAfter === 'number' ? selectedReceipt.termOutstandingAfter.toLocaleString() : "0"}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Outstanding Academic Year Balance:</div>
                  <div className="text-blue-700 font-bold">Ksh {typeof selectedReceipt.academicYearOutstandingAfter === 'number' ? selectedReceipt.academicYearOutstandingAfter.toLocaleString() : "0"}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-right mt-2">Generated: {selectedReceipt.paymentDate ? new Date(selectedReceipt.paymentDate).toLocaleString() : "-"}</div>
              {/* Thank you note */}
              <div className="text-center text-emerald-700 font-semibold mt-4">Thank you for your payment!</div>
            </div>
            <div className="flex gap-2 justify-end mt-4 w-full max-w-xs mx-auto">
              <Button variant="outline" onClick={closeModal}>Close</Button>
              <Button onClick={downloadHTML}>Download HTML</Button>
              <Button onClick={downloadPDF} variant="secondary">Download PDF</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 