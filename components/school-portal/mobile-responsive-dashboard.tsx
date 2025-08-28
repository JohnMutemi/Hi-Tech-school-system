'use client';

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveCard, 
  TouchButton, 
  MobileNavigation,
  CollapsibleSection,
  ResponsiveModal,
  ResponsiveTable,
  ResponsiveForm,
  ResponsiveFormRow,
  ResponsiveFormGroup,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveText,
  ResponsiveSpacing
} from '@/components/ui/responsive-components';
import { useResponsive, useResponsiveVisibility } from '@/hooks/useResponsive';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  Search
} from 'lucide-react';

// ===== MOBILE RESPONSIVE SCHOOL SETUP DASHBOARD =====

interface DashboardStats {
  students: number;
  teachers: number;
  classes: number;
  subjects: number;
  fees: number;
  revenue: number;
}

interface DashboardProps {
  schoolCode: string;
  stats: DashboardStats;
  onRefresh: () => void;
}

export const MobileResponsiveDashboard: React.FC<DashboardProps> = ({
  schoolCode,
  stats,
  onRefresh
}) => {
  const responsive = useResponsive();
  const visibility = useResponsiveVisibility();
  
  // State for modals and forms
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Sample data for demonstration
  const recentStudents = [
    { id: 1, name: 'John Doe', class: 'Grade 1A', status: 'Active' },
    { id: 2, name: 'Jane Smith', class: 'Grade 2B', status: 'Active' },
    { id: 3, name: 'Mike Johnson', class: 'Grade 1A', status: 'Active' },
  ];

  const recentTeachers = [
    { id: 1, name: 'Sarah Wilson', subject: 'Mathematics', status: 'Active' },
    { id: 2, name: 'David Brown', subject: 'English', status: 'Active' },
    { id: 3, name: 'Lisa Davis', subject: 'Science', status: 'Active' },
  ];

  const recentClasses = [
    { id: 1, name: 'Grade 1A', teacher: 'Sarah Wilson', students: 25 },
    { id: 2, name: 'Grade 2B', teacher: 'David Brown', students: 28 },
    { id: 3, name: 'Grade 3A', teacher: 'Lisa Davis', students: 22 },
  ];

  return (
    <ResponsiveContainer maxWidth="full">
      <ResponsiveSpacing>
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <ResponsiveText size="2xl" className="font-bold text-gray-900">
                School Dashboard
              </ResponsiveText>
              <ResponsiveText size="base" className="text-gray-600">
                {schoolCode} - Welcome back!
              </ResponsiveText>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex items-center gap-2">
              <MobileNavigation>
                <a href="#overview" className="mobile-nav-item">Overview</a>
                <a href="#students" className="mobile-nav-item">Students</a>
                <a href="#teachers" className="mobile-nav-item">Teachers</a>
                <a href="#classes" className="mobile-nav-item">Classes</a>
                <a href="#subjects" className="mobile-nav-item">Subjects</a>
                <a href="#fees" className="mobile-nav-item">Fees</a>
                <a href="#settings" className="mobile-nav-item">Settings</a>
              </MobileNavigation>
              
              <TouchButton
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="hide-mobile"
              >
                Refresh
              </TouchButton>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }} gap="md" className="mb-8">
          <ResponsiveCard>
            <div className="flex items-center justify-between">
              <div>
                <ResponsiveText size="sm" className="text-gray-600">Total Students</ResponsiveText>
                <ResponsiveText size="2xl" className="font-bold text-blue-600">{stats.students}</ResponsiveText>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard>
            <div className="flex items-center justify-between">
              <div>
                <ResponsiveText size="sm" className="text-gray-600">Total Teachers</ResponsiveText>
                <ResponsiveText size="2xl" className="font-bold text-green-600">{stats.teachers}</ResponsiveText>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard>
            <div className="flex items-center justify-between">
              <div>
                <ResponsiveText size="sm" className="text-gray-600">Total Classes</ResponsiveText>
                <ResponsiveText size="2xl" className="font-bold text-purple-600">{stats.classes}</ResponsiveText>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard>
            <div className="flex items-center justify-between">
              <div>
                <ResponsiveText size="sm" className="text-gray-600">Monthly Revenue</ResponsiveText>
                <ResponsiveText size="2xl" className="font-bold text-orange-600">${stats.revenue}</ResponsiveText>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Quick Actions */}
        <ResponsiveCard className="mb-8">
          <ResponsiveText size="lg" className="font-semibold mb-4">Quick Actions</ResponsiveText>
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }} gap="sm">
            <TouchButton
              onClick={() => setShowAddStudent(true)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowAddTeacher(true)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Teacher
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowAddClass(true)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Class
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowImportModal(true)}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Data
            </TouchButton>
          </ResponsiveGrid>
        </ResponsiveCard>

        {/* Collapsible Sections for Mobile */}
        <div className="space-y-4">
          {/* Recent Students */}
          <CollapsibleSection title="Recent Students" defaultOpen={!responsive.isMobile}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ResponsiveText size="lg" className="font-semibold">Students</ResponsiveText>
                <TouchButton
                  onClick={() => setShowAddStudent(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </TouchButton>
              </div>
              
              {/* Mobile Table Cards */}
              {responsive.isMobile ? (
                <div className="space-y-3">
                  {recentStudents.map((student) => (
                    <div key={student.id} className="mobile-table-card">
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Name:</span>
                        <span className="mobile-table-card-value">{student.name}</span>
                      </div>
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Class:</span>
                        <span className="mobile-table-card-value">{student.class}</span>
                      </div>
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Status:</span>
                        <span className="mobile-table-card-value">{student.status}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <TouchButton size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </TouchButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ResponsiveTable>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.class}</td>
                        <td>{student.status}</td>
                        <td>
                          <div className="flex gap-2">
                            <TouchButton size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </TouchButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
              )}
            </div>
          </CollapsibleSection>

          {/* Recent Teachers */}
          <CollapsibleSection title="Recent Teachers" defaultOpen={!responsive.isMobile}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ResponsiveText size="lg" className="font-semibold">Teachers</ResponsiveText>
                <TouchButton
                  onClick={() => setShowAddTeacher(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </TouchButton>
              </div>
              
              {responsive.isMobile ? (
                <div className="space-y-3">
                  {recentTeachers.map((teacher) => (
                    <div key={teacher.id} className="mobile-table-card">
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Name:</span>
                        <span className="mobile-table-card-value">{teacher.name}</span>
                      </div>
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Subject:</span>
                        <span className="mobile-table-card-value">{teacher.subject}</span>
                      </div>
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Status:</span>
                        <span className="mobile-table-card-value">{teacher.status}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <TouchButton size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </TouchButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ResponsiveTable>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td>{teacher.name}</td>
                        <td>{teacher.subject}</td>
                        <td>{teacher.status}</td>
                        <td>
                          <div className="flex gap-2">
                            <TouchButton size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </TouchButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
              )}
            </div>
          </CollapsibleSection>

          {/* Recent Classes */}
          <CollapsibleSection title="Recent Classes" defaultOpen={!responsive.isMobile}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ResponsiveText size="lg" className="font-semibold">Classes</ResponsiveText>
                <TouchButton
                  onClick={() => setShowAddClass(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </TouchButton>
              </div>
              
              {responsive.isMobile ? (
                <div className="space-y-3">
                  {recentClasses.map((classItem) => (
                    <div key={classItem.id} className="mobile-table-card">
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Class:</span>
                        <span className="mobile-table-card-value">{classItem.name}</span>
                      </div>
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Teacher:</span>
                        <span className="mobile-table-card-value">{classItem.teacher}</span>
                      </div>
                      <div className="mobile-table-card-row">
                        <span className="mobile-table-card-label">Students:</span>
                        <span className="mobile-table-card-value">{classItem.students}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <TouchButton size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </TouchButton>
                        <TouchButton size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </TouchButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ResponsiveTable>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Teacher</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClasses.map((classItem) => (
                      <tr key={classItem.id}>
                        <td>{classItem.name}</td>
                        <td>{classItem.teacher}</td>
                        <td>{classItem.students}</td>
                        <td>
                          <div className="flex gap-2">
                            <TouchButton size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </TouchButton>
                            <TouchButton size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </TouchButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* Add Student Modal */}
        <ResponsiveModal
          isOpen={showAddStudent}
          onClose={() => setShowAddStudent(false)}
          title="Add New Student"
          footer={
            <div className="flex gap-2">
              <TouchButton variant="outline" onClick={() => setShowAddStudent(false)}>
                Cancel
              </TouchButton>
              <TouchButton onClick={() => setShowAddStudent(false)}>
                Add Student
              </TouchButton>
            </div>
          }
        >
          <ResponsiveForm>
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Full Name" required>
                <ResponsiveInput placeholder="Enter full name" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Email" required>
                <ResponsiveInput type="email" placeholder="Enter email" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Phone">
                <ResponsiveInput placeholder="Enter phone number" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Admission Number" required>
                <ResponsiveInput placeholder="Enter admission number" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Date of Birth">
                <ResponsiveInput type="date" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Gender">
                <ResponsiveSelect>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </ResponsiveSelect>
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormGroup label="Class">
              <ResponsiveSelect>
                <option value="">Select class</option>
                <option value="grade1a">Grade 1A</option>
                <option value="grade1b">Grade 1B</option>
                <option value="grade2a">Grade 2A</option>
              </ResponsiveSelect>
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Parent Name">
              <ResponsiveInput placeholder="Enter parent name" />
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Parent Phone">
              <ResponsiveInput placeholder="Enter parent phone" />
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Parent Email">
              <ResponsiveInput type="email" placeholder="Enter parent email" />
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Address">
              <ResponsiveInput placeholder="Enter address" />
            </ResponsiveFormGroup>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Emergency Contact">
                <ResponsiveInput placeholder="Emergency contact" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Status">
                <ResponsiveSelect>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </ResponsiveSelect>
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormGroup label="Medical Information">
              <ResponsiveInput placeholder="Any medical conditions" />
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Notes">
              <ResponsiveInput placeholder="Additional notes" />
            </ResponsiveFormGroup>
          </ResponsiveForm>
        </ResponsiveModal>

        {/* Add Teacher Modal */}
        <ResponsiveModal
          isOpen={showAddTeacher}
          onClose={() => setShowAddTeacher(false)}
          title="Add New Teacher"
          footer={
            <div className="flex gap-2">
              <TouchButton variant="outline" onClick={() => setShowAddTeacher(false)}>
                Cancel
              </TouchButton>
              <TouchButton onClick={() => setShowAddTeacher(false)}>
                Add Teacher
              </TouchButton>
            </div>
          }
        >
          <ResponsiveForm>
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Full Name" required>
                <ResponsiveInput placeholder="Enter full name" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Email" required>
                <ResponsiveInput type="email" placeholder="Enter email" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Phone">
                <ResponsiveInput placeholder="Enter phone number" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Employee ID">
                <ResponsiveInput placeholder="Enter employee ID" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Qualification">
                <ResponsiveInput placeholder="Enter qualification" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Date Joined">
                <ResponsiveInput type="date" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Assigned Class">
                <ResponsiveInput placeholder="Enter assigned class" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Academic Year">
                <ResponsiveInput placeholder="Enter academic year" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormGroup label="Status">
              <ResponsiveSelect>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </ResponsiveSelect>
            </ResponsiveFormGroup>
          </ResponsiveForm>
        </ResponsiveModal>

        {/* Add Class Modal */}
        <ResponsiveModal
          isOpen={showAddClass}
          onClose={() => setShowAddClass(false)}
          title="Add New Class"
          footer={
            <div className="flex gap-2">
              <TouchButton variant="outline" onClick={() => setShowAddClass(false)}>
                Cancel
              </TouchButton>
              <TouchButton onClick={() => setShowAddClass(false)}>
                Add Class
              </TouchButton>
            </div>
          }
        >
          <ResponsiveForm>
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Class Name" required>
                <ResponsiveInput placeholder="Enter class name" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Grade">
                <ResponsiveSelect>
                  <option value="">Select grade</option>
                  <option value="grade1">Grade 1</option>
                  <option value="grade2">Grade 2</option>
                  <option value="grade3">Grade 3</option>
                  <option value="grade4">Grade 4</option>
                  <option value="grade5">Grade 5</option>
                  <option value="grade6">Grade 6</option>
                </ResponsiveSelect>
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Level">
                <ResponsiveSelect>
                  <option value="">Select level</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </ResponsiveSelect>
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Section">
                <ResponsiveInput placeholder="e.g., A, B, C" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Academic Year">
                <ResponsiveInput placeholder="e.g., 2024" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormRow>
              <ResponsiveFormGroup label="Capacity">
                <ResponsiveInput type="number" placeholder="e.g., 30" />
              </ResponsiveFormGroup>
              <ResponsiveFormGroup label="Room Number">
                <ResponsiveInput placeholder="e.g., Room 101" />
              </ResponsiveFormGroup>
            </ResponsiveFormRow>
            
            <ResponsiveFormGroup label="Status">
              <ResponsiveSelect>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </ResponsiveSelect>
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Description">
              <ResponsiveInput placeholder="Additional information about the class" />
            </ResponsiveFormGroup>
          </ResponsiveForm>
        </ResponsiveModal>

        {/* Import Modal */}
        <ResponsiveModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Data"
          footer={
            <div className="flex gap-2">
              <TouchButton variant="outline" onClick={() => setShowImportModal(false)}>
                Cancel
              </TouchButton>
              <TouchButton onClick={() => setShowImportModal(false)}>
                Import
              </TouchButton>
            </div>
          }
        >
          <div className="space-y-4">
            <ResponsiveFormGroup label="Data Type">
              <ResponsiveSelect>
                <option value="">Select data type</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="classes">Classes</option>
                <option value="subjects">Subjects</option>
              </ResponsiveSelect>
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="File">
              <ResponsiveInput type="file" accept=".xlsx,.xls,.csv" />
            </ResponsiveFormGroup>
            
            <ResponsiveFormGroup label="Options">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>Update existing records</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>Skip duplicates</span>
                </label>
              </div>
            </ResponsiveFormGroup>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <ResponsiveText size="sm" className="text-blue-800">
                <strong>Note:</strong> Please ensure your Excel file has the correct column headers. 
                Download the template for reference.
              </ResponsiveText>
            </div>
          </div>
        </ResponsiveModal>
      </ResponsiveSpacing>
    </ResponsiveContainer>
  );
};

export default MobileResponsiveDashboard; 