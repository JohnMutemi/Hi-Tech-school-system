import { useState } from "react"
import { Button } from "./button"
import { Card } from "./card"
import { Receipt } from "lucide-react"
import { Input } from "./input"
import { Select } from "./select"
import { Label } from "./label"
import { Payment } from "@/lib/types/fees"

interface ReceiptGeneratorProps {
  onClose: () => void
  onGenerate: (receipt: Partial<Payment>) => void
}

export function ReceiptGenerator({ onClose, onGenerate }: ReceiptGeneratorProps) {
  const [receiptDetails, setReceiptDetails] = useState<Partial<Payment>>({
    amount: 0,
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split('T')[0],
    receivedBy: "",
    description: "",
    referenceNumber: ""
  })

  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiptDetails.amount || receiptDetails.amount <= 0) {
      setError("Please enter a valid amount")
      return
    }
    if (!receiptDetails.receivedBy) {
      setError("Please enter who received the payment")
      return
    }
    onGenerate(receiptDetails)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <Card className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500" 
          onClick={onClose}
        >
          &times;
        </button>
        
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Receipt className="w-6 h-6" /> Generate Receipt
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
              value={receiptDetails.amount || ""}
              onChange={(e) => setReceiptDetails({
                ...receiptDetails,
                amount: parseFloat(e.target.value)
              })}
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              id="paymentMethod"
              value={receiptDetails.paymentMethod}
              onValueChange={(value) => setReceiptDetails({
                ...receiptDetails,
                paymentMethod: value as Payment['paymentMethod']
              })}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="check">Check</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={receiptDetails.paymentDate}
              onChange={(e) => setReceiptDetails({
                ...receiptDetails,
                paymentDate: e.target.value
              })}
              required
            />
          </div>

          <div>
            <Label htmlFor="receivedBy">Received By</Label>
            <Input
              id="receivedBy"
              type="text"
              placeholder="Enter name of receiver"
              value={receiptDetails.receivedBy}
              onChange={(e) => setReceiptDetails({
                ...receiptDetails,
                receivedBy: e.target.value
              })}
              required
            />
          </div>

          <div>
            <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
            <Input
              id="referenceNumber"
              type="text"
              placeholder="Enter reference number"
              value={receiptDetails.referenceNumber}
              onChange={(e) => setReceiptDetails({
                ...receiptDetails,
                referenceNumber: e.target.value
              })}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Enter payment description"
              value={receiptDetails.description}
              onChange={(e) => setReceiptDetails({
                ...receiptDetails,
                description: e.target.value
              })}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Button type="submit" className="w-full">
            Generate Receipt
          </Button>
        </form>
      </Card>
    </div>
  )
} 