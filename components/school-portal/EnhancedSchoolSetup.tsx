"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Circle, 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  DollarSign, 
  Settings,
  ArrowRight,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FeeTemplateSelector } from './FeeTemplateSelector';
import { SimplifiedClassCreation } from './SimplifiedClassCreation';
import { StudentCreationWithBalance } from './StudentCreationWithBalance';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  optional: boolean;
}

interface EnhancedSchoolSetupProps {
  schoolCode: string;
  schoolData: any;
  colorTheme?: string;
  onComplete?: () => void;
}

export function EnhancedSchoolSetup({
  schoolCode,
  schoolData,
  colorTheme = "#3b82f6",
  onComplete
}: EnhancedSchoolSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'templates',
      title: 'Fee Structure Templates',
      description: 'Choose a fee structure template for your school',
      icon: FileSpreadsheet,
      completed: false,
      optional: false
    },
    {
      id: 'classes',
      title: 'Create Classes',
      description: 'Set up classes and grades for your school',
      icon: BookOpen,
      completed: false,
      optional: false
    },
    {
      id: 'students',
      title: 'Sample Students',
      description: 'Create sample students with fee balances',
      icon: Users,
      completed: false,
      optional: false
    },
    {
      id: 'review',
      title: 'Review & Complete',
      description: 'Review your setup and go live',
      icon: Star,
      completed: false,
      optional: false
    }
  ]);
  
  const [setupProgress, setSetupProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    checkInitialSetupStatus();
  }, [schoolCode]);

  useEffect(() => {
    const completedSteps = setupSteps.filter(step => step.completed).length;
    const totalSteps = setupSteps.length;
    setSetupProgress((completedSteps / totalSteps) * 100);
  }, [setupSteps]);

  const checkInitialSetupStatus = async () => {
    try {
      // Check if classes exist
      const classesResponse = await fetch(`/api/schools/${schoolCode}/classes`);
      const classes = classesResponse.ok ? await classesResponse.json() : [];
      
      // Check if students exist
      const studentsResponse = await fetch(`/api/schools/${schoolCode}/students`);
      const students = studentsResponse.ok ? await studentsResponse.json() : [];
      
      // Check if fee structures exist
      const feeResponse = await fetch(`/api/schools/${schoolCode}/fee-structure`);
      const feeStructures = feeResponse.ok ? await feeResponse.json() : [];

      setSetupSteps(prev => prev.map(step => {
        switch (step.id) {
          case 'classes':
            return { ...step, completed: classes.length > 0 };
          case 'students':
            return { ...step, completed: students.length > 0 };
          case 'templates':
            return { ...step, completed: feeStructures.length > 0 };
          default:
            return step;
        }
      }));

      // Auto-advance to first incomplete step
      const firstIncomplete = setupSteps.findIndex(step => !step.completed);
      if (firstIncomplete !== -1) {
        setCurrentStep(firstIncomplete);
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    }
  };

  const markStepComplete = (stepId: string) => {
    setSetupSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeSetup = () => {
    toast({
      title: "Setup Complete!",
      description: "Your school is now ready to use. Welcome to Hi-Tech SMS!",
    });
    
    if (onComplete) {
      onComplete();
    }
  };

  const StepIcon = setupSteps[currentStep]?.icon || Circle;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Hi-Tech SMS</h1>
        <p className="text-lg text-gray-600">
          Let's get your school set up quickly with our simplified setup process
        </p>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Setup Progress</span>
            <span className="text-sm font-medium" style={{ color: colorTheme }}>
              {Math.round(setupProgress)}% Complete
            </span>
          </div>
          <Progress value={setupProgress} className="h-3" />
        </div>
      </div>

      {/* Setup Steps Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            {setupSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center ${index < setupSteps.length - 1 ? 'flex-1' : ''}`}
              >
                <div 
                  className={`flex items-center gap-3 cursor-pointer transition-colors ${
                    index === currentStep ? 'text-blue-600' : 
                    step.completed ? 'text-green-600' : 'text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    index === currentStep ? 'border-blue-600 bg-blue-50' :
                    step.completed ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <step.icon className={`h-5 w-5 ${
                        index === currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className={`font-medium text-sm ${
                      index === currentStep ? 'text-blue-600' : 
                      step.completed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                
                {index < setupSteps.length - 1 && (
                  <div className="flex-1 mx-4 h-px bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <StepIcon className="h-6 w-6" style={{ color: colorTheme }} />
            {setupSteps[currentStep]?.title}
          </CardTitle>
          <CardDescription>
            {setupSteps[currentStep]?.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Fee Structure Templates */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">📋 Step 1: Choose Your Fee Structure</h3>
                <p className="text-sm text-blue-700">
                  Select a pre-built template that matches your school type, or download and customize before importing.
                  This will set up the fee structure for all grades automatically.
                </p>
              </div>
              
              <FeeTemplateSelector
                schoolCode={schoolCode}
                colorTheme={colorTheme}
                onTemplateImported={() => {
                  markStepComplete('templates');
                  toast({
                    title: "Fee Structure Imported!",
                    description: "Your fee structure has been set up successfully.",
                  });
                  setTimeout(() => nextStep(), 1000);
                }}
              />
            </div>
          )}

          {/* Step 2: Create Classes */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">🏫 Step 2: Set Up Classes</h3>
                <p className="text-sm text-green-700">
                  Create classes for each grade level. We'll automatically create standard sections (A, B, C) 
                  along with academic years and terms.
                </p>
              </div>
              
              <SimplifiedClassCreation
                schoolCode={schoolCode}
                colorTheme={colorTheme}
                isSetupMode={true}
                onClassesCreated={() => {
                  markStepComplete('classes');
                  toast({
                    title: "Classes Created!",
                    description: "Your school classes have been set up successfully.",
                  });
                  setTimeout(() => nextStep(), 1000);
                }}
              />
            </div>
          )}

          {/* Step 3: Sample Students */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-800 mb-2">👥 Step 3: Create Sample Students</h3>
                <p className="text-sm text-purple-700">
                  Add sample students to test your system. Each student will have real fee balance calculations
                  and parent accounts will be automatically created.
                </p>
              </div>
              
              <StudentCreationWithBalance
                schoolCode={schoolCode}
                colorTheme={colorTheme}
                onComplete={() => {
                  markStepComplete('students');
                  toast({
                    title: "Sample Students Created!",
                    description: "Students with real fee balances have been added to your school.",
                  });
                  setTimeout(() => nextStep(), 1000);
                }}
              />
            </div>
          )}

          {/* Step 4: Review & Complete */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-medium text-amber-800 mb-2">🎉 Step 4: Setup Complete!</h3>
                <p className="text-sm text-amber-700">
                  Your school setup is complete! Review what we've created and start using your school management system.
                </p>
              </div>

              {/* Setup Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      What's Been Set Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fee Structures</span>
                      <Badge variant="default">✓ Imported</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Academic Years & Terms</span>
                      <Badge variant="default">✓ Created</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grades & Classes</span>
                      <Badge variant="default">✓ Set Up</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sample Students</span>
                      <Badge variant="default">✓ Added</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Parent Accounts</span>
                      <Badge variant="default">✓ Created</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fee Balances</span>
                      <Badge variant="default">✓ Calculated</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" style={{ color: colorTheme }} />
                      Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <p>✓ Add real teachers and staff</p>
                      <p>✓ Enroll actual students</p>
                      <p>✓ Customize fee structures if needed</p>
                      <p>✓ Set up payment methods</p>
                      <p>✓ Configure email notifications</p>
                      <p>✓ Train your staff on the system</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center pt-6">
                <Button
                  onClick={completeSetup}
                  size="lg"
                  className="px-8 py-3 text-lg"
                  style={{ backgroundColor: colorTheme }}
                >
                  <Star className="h-5 w-5 mr-2" />
                  Complete Setup & Go Live
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex justify-between p-6 border-t">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!setupSteps[currentStep]?.completed}
              style={{ backgroundColor: colorTheme }}
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}



