'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import PaymentHistory from '@/components/payment/PaymentHistory';

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  email?: string | null;
  phone?: string | null;
  gradeName: string;
  className: string;
  parent: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  feeAccommodation?: string;
  dateAdmitted?: string | null;
}

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  schoolCode: string;
  brandColor?: string;
}

const BURSAR_UNDO_WINDOW_SECONDS = 300;

export function PaymentHistoryModal({
  isOpen,
  onClose,
  student,
  schoolCode,
  brandColor = '#d97706',
}: PaymentHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Payment History — {student.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                  <p className="text-blue-600 font-mono">{student.admissionNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Student Details
                  </div>
                  <div className="font-semibold text-gray-900 mt-1">{student.name}</div>
                  <div className="text-sm text-gray-600 font-mono">{student.admissionNumber}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Academic Info
                  </div>
                  <div className="font-semibold text-gray-900 mt-1">{student.gradeName}</div>
                  <div className="text-sm text-gray-600">{student.className}</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Parent Contact
                  </div>
                  <div className="font-semibold text-gray-900 mt-1">
                    {student.parent?.name || 'Not Available'}
                  </div>
                  <div className="text-sm text-gray-600 font-mono">
                    {student.parent?.phone || 'No contact'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <PaymentHistory
            studentId={student.id}
            schoolCode={schoolCode}
            allowUndo
            allowCorrect
            undoWindowSeconds={BURSAR_UNDO_WINDOW_SECONDS}
            brandColor={brandColor}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
