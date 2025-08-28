"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Grade {
  id: string;
  name: string;
}

interface ClassData {
  id: string;
  name: string;
  grade: {
    id: string;
    name: string;
  };
  studentCount?: number;
}

interface SimplifiedClassCreationProps {
  schoolCode: string;
  colorTheme?: string;
  onClassesCreated?: () => void;
  isSetupMode?: boolean;
}

export function SimplifiedClassCreation({ 
  schoolCode, 
  colorTheme = "#3b82f6",
  onClassesCreated,
  isSetupMode = true
}: SimplifiedClassCreationProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGrades();
    fetchClasses();
  }, [schoolCode]);

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/grades`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/classes`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultClasses = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/classes/seed`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: `Created ${result.createdClasses?.length || 0} classes successfully`,
        });
        
        // Refresh classes list
        await fetchClasses();
        
        if (onClassesCreated) {
          onClassesCreated();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create classes');
      }
    } catch (error) {
      console.error('Error creating classes:', error);
      toast({
        title: "Error",
        description: "Failed to create default classes",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const seedComprehensiveData = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/seed`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: `Setup completed! Created ${result.results?.classes || 0} classes and ${result.results?.students || 0} sample students`,
        });
        
        // Refresh classes list
        await fetchClasses();
        
        if (onClassesCreated) {
          onClassesCreated();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup school data');
      }
    } catch (error) {
      console.error('Error setting up school data:', error);
      toast({
        title: "Error",
        description: "Failed to setup school data",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colorTheme }}></div>
      </div>
    );
  }

  // Check if classes already exist
  const hasClasses = classes.length > 0;
  const hasStudents = classes.some(cls => cls.studentCount && cls.studentCount > 0);

  return (
    <div className="space-y-6">
      {/* Setup Mode - Show quick setup options */}
      {isSetupMode && !hasClasses && (
        <Card className="border-2 border-dashed" style={{ borderColor: colorTheme + '40' }}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colorTheme + '20' }}>
              <BookOpen className="h-6 w-6" style={{ color: colorTheme }} />
            </div>
            <CardTitle>Quick Class Setup</CardTitle>
            <CardDescription>
              Get started quickly with pre-configured classes for your school. 
              This will create standard class sections (A, B, C) for each grade level.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>What will be created:</strong>
              <ul className="mt-2 space-y-1 text-left">
                <li>• Classes for each grade (Grade 1A, 1B, 1C, etc.)</li>
                <li>• Academic years and terms</li>
                <li>• 2 sample students per grade with parent accounts</li>
                <li>• Real fee balance calculations</li>
              </ul>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={createDefaultClasses}
                disabled={creating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {creating ? 'Creating...' : 'Classes Only'}
              </Button>
              
              <Button
                onClick={seedComprehensiveData}
                disabled={creating}
                className="flex items-center gap-2"
                style={{ backgroundColor: colorTheme }}
              >
                <Users className="h-4 w-4" />
                {creating ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show current classes */}
      {hasClasses && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>School Classes</span>
              <Badge variant="outline">{classes.length} Classes</Badge>
            </CardTitle>
            <CardDescription>
              {hasStudents 
                ? "Your classes have been set up with sample students" 
                : "Classes created - ready for students"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{cls.name}</h4>
                      <p className="text-sm text-gray-600">{cls.grade.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {cls.studentCount || 0} students
                      </div>
                      <Badge 
                        variant={cls.studentCount && cls.studentCount > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {cls.studentCount && cls.studentCount > 0 ? "Active" : "Empty"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isSetupMode && !hasStudents && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Sample Students</span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Complete your setup by adding sample students to test the system
                </p>
                <Button
                  size="sm"
                  onClick={seedComprehensiveData}
                  disabled={creating}
                  className="mt-2"
                  style={{ backgroundColor: colorTheme }}
                >
                  {creating ? 'Adding Students...' : 'Add Sample Students'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state for non-setup mode */}
      {!isSetupMode && !hasClasses && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Start by creating classes for your school
            </p>
            <Button 
              onClick={createDefaultClasses}
              disabled={creating}
              style={{ backgroundColor: colorTheme }}
            >
              Create Default Classes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



