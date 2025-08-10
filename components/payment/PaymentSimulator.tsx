"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Shield,
  Clock,
  DollarSign,
  User,
  Building,
  ArrowRight,
  ArrowLeft,
  Wifi,
  Signal,
  Battery,
} from "lucide-react";

interface MPESASimulationProps {
  amount: number;
  phoneNumber: string;
  schoolName: string;
  studentName: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface SimulationStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "success" | "error";
  duration: number;
}

export default function PaymentSimulator({
  amount,
  phoneNumber,
  schoolName,
  studentName,
  onSuccess,
  onError,
  onCancel,
}: MPESASimulationProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [showPhoneInterface, setShowPhoneInterface] = useState(false);

  const simulationSteps: SimulationStep[] = [
    {
      id: "initiate",
      title: "Initiating Payment",
      description: "Connecting to MPESA servers...",
      status: "pending",
      duration: 1000,
    },
    {
      id: "validate",
      title: "Validating Phone Number",
      description: "Verifying MPESA registration...",
      status: "pending",
      duration: 1500,
    },
    {
      id: "send-pin",
      title: "Sending PIN Request",
      description: "Requesting MPESA PIN...",
      status: "pending",
      duration: 2000,
    },
    {
      id: "process",
      title: "Processing Payment",
      description: "Transferring funds...",
      status: "pending",
      duration: 3000,
    },
    {
      id: "confirm",
      title: "Confirming Transaction",
      description: "Finalizing payment...",
      status: "pending",
      duration: 1500,
    },
  ];

  const [steps, setSteps] = useState(simulationSteps);

  useEffect(() => {
    if (isProcessing) {
      startSimulation();
    }
  }, [isProcessing]);

  const startSimulation = async () => {
    setShowPhoneInterface(true);
    
    for (let i = 0; i < steps.length; i++) {
      // Update current step
      setCurrentStep(i);
      
      // Update step status to processing
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: "processing" as const } : step
      ));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));

      // Update step status to success
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: "success" as const } : step
      ));

      // If this is the last step, generate transaction ID
      if (i === steps.length - 1) {
        const newTransactionId = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setTransactionId(newTransactionId);
        
        // Wait a bit before calling success
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess(newTransactionId);
      }
    }
  };

  const handleStartSimulation = () => {
    setIsProcessing(true);
  };

  const handleCancel = () => {
    setIsProcessing(false);
    onCancel();
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    } else if (cleaned.startsWith('0')) {
      return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  const renderPhoneInterface = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-6 w-80 max-h-[600px] overflow-hidden">
        {/* Phone Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
          </div>
          <div className="text-sm font-medium">MPESA</div>
          <div className="flex items-center gap-1">
            <Battery className="w-6 h-4" />
          </div>
        </div>

        {/* MPESA Interface */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">MPESA</div>
            <div className="text-sm text-gray-600">Mobile Money</div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-600">Amount</div>
            <div className="text-xl font-bold">KES {amount.toLocaleString()}</div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-600">To</div>
            <div className="font-medium">{schoolName}</div>
            <div className="text-sm text-gray-500">School Fees</div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 space-y-2">
            <div className="text-sm text-gray-600">From</div>
            <div className="font-medium">{formatPhoneNumber(phoneNumber)}</div>
          </div>

          {currentStep < steps.length && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {steps[currentStep].status === "processing" && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                {steps[currentStep].status === "success" && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <span className="text-sm font-medium">{steps[currentStep].title}</span>
              </div>
              <div className="text-xs text-gray-600">{steps[currentStep].description}</div>
            </div>
          )}

          {transactionId && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Payment Successful!</span>
              </div>
              <div className="text-xs text-green-700">
                Transaction ID: {transactionId}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSimulationSteps = () => (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-300 ${
            step.status === "processing"
              ? "bg-blue-50 border-blue-200"
              : step.status === "success"
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex-shrink-0">
            {step.status === "pending" && (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
            )}
            {step.status === "processing" && (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            )}
            {step.status === "success" && (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
            {step.status === "error" && (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="font-medium">{step.title}</div>
            <div className="text-sm text-gray-600">{step.description}</div>
          </div>
          
          {step.status === "processing" && (
            <Badge variant="secondary" className="text-xs">
              Processing...
            </Badge>
          )}
          {step.status === "success" && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Complete
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  if (showPhoneInterface) {
    return renderPhoneInterface();
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <Phone className="w-5 h-5" />
          MPESA Payment Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="font-bold text-lg">KES {amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">To</span>
              <span className="font-medium">{schoolName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Student</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">From</span>
              <span className="font-medium">{formatPhoneNumber(phoneNumber)}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Secure Payment</span>
          </div>
          <p className="text-xs text-blue-700">
            This is a simulation. In a real MPESA payment, you would receive a PIN request on your phone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleStartSimulation}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Start Payment
              </>
            )}
          </Button>
        </div>

        {/* Processing Steps */}
        {isProcessing && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-3">Payment Progress</div>
            {renderSimulationSteps()}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 