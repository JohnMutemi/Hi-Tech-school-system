"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Users, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';
import { StudentFeeBalanceDisplay } from './StudentFeeBalanceDisplay';
import { useToast } from '@/hooks/use-toast';

interface CreatedStudent {
  id: string;
  name: string;
  email: string;
  admissionNumber: string;
  className: string;
  gradeName: string;
  parent?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    tempPassword: string;
  };
}

interface StudentCreationWithBalanceProps {
  schoolCode: string;
  colorTheme?: string;
  onComplete?: () => void;
  academicYear?: string;
  term?: string;
}

export function StudentCreationWithBalance({
  schoolCode,
  colorTheme = "#3b82f6",
  onComplete,
  academicYear,
  term
}: StudentCreationWithBalanceProps) {
  const [createdStudents, setCreatedStudents] = useState<CreatedStudent[]>([]);
  const [showingBalance, setShowingBalance] = useState<string | null>(null);
  const [seedingStudents, setSeedingStudents] = useState(false);
  const { toast } = useToast();

  const createSampleStudents = async () => {
    setSeedingStudents(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/seed`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.results?.students > 0) {
          toast({
            title: "Success!",
            description: `Created ${result.results.students} sample students with real fee balances`,
          });

          // Fetch the created students to display their information
          await fetchCreatedStudents();
        } else {
          toast({
            title: "Info",
            description: "Sample students may already exist for this school",
          });
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create students');
      }
    } catch (error) {
      console.error('Error creating students:', error);
      toast({
        title: "Error",
        description: "Failed to create sample students",
        variant: "destructive"
      });
    } finally {
      setSeedingStudents(false);
    }
  };

  const fetchCreatedStudents = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/students`);
      if (response.ok) {
        const students = await response.json();
        
        // Transform to our interface and take the most recent ones
        const transformedStudents: CreatedStudent[] = students
          .slice(0, 6) // Show first 6 students
          .map((student: any) => ({
            id: student.id,
            name: student.name || student.user?.name,
            email: student.email || student.user?.email,
            admissionNumber: student.admissionNumber,
            className: student.class?.name || 'Unknown Class',
            gradeName: student.class?.grade?.name || 'Unknown Grade',
            parent: student.parent ? {
              id: student.parent.id,
              name: student.parent.name,
              email: student.parent.email,
              phone: student.parent.phone,
              tempPassword: student.parent.tempPassword || 'parent123'
            } : undefined
          }));

        setCreatedStudents(transformedStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const toggleBalanceView = (studentId: string) => {
    setShowingBalance(showingBalance === studentId ? null : studentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: colorTheme }} />
            Student Creation & Fee Balance
          </CardTitle>
          <CardDescription>
            Create sample students and view their real-time fee balances
          </CardDescription>
        </CardHeader>
        
        {createdStudents.length === 0 && (
          <CardContent>
            <div className="text-center py-6">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create sample students to test the fee balance system
              </p>
              
              <Button
                onClick={createSampleStudents}
                disabled={seedingStudents}
                className="flex items-center gap-2"
                style={{ backgroundColor: colorTheme }}
              >
                <Users className="h-4 w-4" />
                {seedingStudents ? 'Creating Students...' : 'Create Sample Students'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Created Students List */}
      {createdStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Created Students
              </span>
              <Badge variant="outline">{createdStudents.length} Students</Badge>
            </CardTitle>
            <CardDescription>
              Click on any student to view their real-time fee balance
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {createdStudents.map((student) => (
                <div key={student.id} className="space-y-3">
                  {/* Student Card */}
                  <div 
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => toggleBalanceView(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: colorTheme }}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-gray-600">
                            {student.admissionNumber} • {student.className}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <DollarSign className="h-4 w-4" />
                          View Balance
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Parent Information */}
                    {student.parent && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm">
                          <div className="font-medium text-blue-800">Parent Account Created</div>
                          <div className="text-blue-700 mt-1">
                            <div><strong>Name:</strong> {student.parent.name}</div>
                            <div><strong>Email:</strong> {student.parent.email}</div>
                            <div><strong>Phone:</strong> {student.parent.phone}</div>
                            <div><strong>Temp Password:</strong> <code className="bg-blue-100 px-1 rounded">{student.parent.tempPassword}</code></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fee Balance Display */}
                  {showingBalance === student.id && (
                    <div className="ml-4 border-l-2 border-gray-200 pl-4">
                      <StudentFeeBalanceDisplay
                        studentId={student.id}
                        schoolCode={schoolCode}
                        colorTheme={colorTheme}
                        academicYear={academicYear}
                        term={term}
                        showActions={false}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex gap-3">
                <Button
                  onClick={createSampleStudents}
                  disabled={seedingStudents}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {seedingStudents ? 'Creating More...' : 'Create More Students'}
                </Button>
                
                {onComplete && (
                  <Button
                    onClick={onComplete}
                    className="flex items-center gap-2"
                    style={{ backgroundColor: colorTheme }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete Setup
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



