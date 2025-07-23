"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PromotionWizard from "./wizard/PromotionWizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  GraduationCap,
  ArrowLeft,
  AlertTriangle,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  classLevel: string;
  className: string;
  eligibility: {
    feeStatus: string;
    allTermsPaid: boolean;
    meetsCriteria: boolean;
    outstandingBalance: number;
    totalFees: number;
    totalPaid: number;
  };
  carryForwardArrears?: number;
}

interface PromotionExclusion {
  studentId: string;
  reason: string;
  notes?: string;
}

export default function PromotionsPage() {
  return <PromotionWizard />;
}
