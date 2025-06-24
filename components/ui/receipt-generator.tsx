import React from "react";

export function ReceiptGenerator({ onClose, onGenerate }: { onClose?: () => void; onGenerate?: (receiptData: any) => void }) {
  return (
    <div>
      <h2>Receipt Generator</h2>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onGenerate && onGenerate({})}>Generate</button>
    </div>
  );
}
