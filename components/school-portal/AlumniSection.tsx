"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Award,
  Star,
  Trophy,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Eye,
  RefreshCw,
  Plus,
  Crown,
  DollarSign
} from "lucide-react";

interface Alumni {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  graduationYear: string;
  finalGrade: string;
  achievements: string[];
  contactEmail?: string;
  contactPhone?: string;
  currentInstitution?: string;
  currentOccupation?: string;
  feeBalance: {
    totalPayments: number;
    totalArrears: number;
    outstandingBalance: number;
    hasOutstandingFees: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface GraduationYear {
  year: string;
  count: number;
  topPerformers: number;
}

interface AlumniSectionProps {
  schoolCode: string;
}

export default function AlumniSection({ schoolCode }: AlumniSectionProps) {
  const { toast } = useToast();
  const colorTheme = "#3b82f6"; // Default blue theme
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [graduationYears, setGraduationYears] = useState<GraduationYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAlumni: 0,
    totalYears: 0,
    thisYearGraduates: 0,
    topPerformers: 0,
    alumniWithOutstandingFees: 0,
    totalOutstandingFees: 0
  });
  const [viewingAlumni, setViewingAlumni] = useState<Alumni | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Load alumni data
  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/alumni`);
      if (response.ok) {
        const data = await response.json();
        setAlumni(data.alumni || []);
        setGraduationYears(data.graduationYears || []);
        setStats(data.stats || {
          totalAlumni: 0,
          totalYears: 0,
          thisYearGraduates: 0,
          topPerformers: 0
        });
      }
    } catch (error) {
      console.error("Error loading alumni:", error);
      toast({
        title: "Error",
        description: "Failed to load alumni data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Promote Grade 6 students to alumni
  const promoteGrade6Students = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/alumni/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Promoted ${data.promotedCount} Grade 6 students to alumni for ${data.graduationYear}`,
        });
        await loadAlumni(); // Reload data
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to promote students: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupAlumniStudents = async () => {
    setCleaningUp(true);
    try {
      const response = await fetch(`/api/schools/${schoolCode}/students/cleanup-alumni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Cleanup Complete",
          description: data.message,
        });
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: `Failed to cleanup: ${errorText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup alumni students",
        variant: "destructive"
      });
    } finally {
      setCleaningUp(false);
    }
  };

  // Filter alumni based on search and year
  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch = alum.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alum.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === "all" || alum.graduationYear === selectedYear;
    return matchesSearch && matchesYear;
  });

  // Get current year
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Crown className="h-8 w-8" style={{ color: colorTheme }} />
            Alumni Hall of Fame
          </h2>
          <p className="text-gray-600 mt-2">
            Celebrating our distinguished graduates and their achievements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={promoteGrade6Students}
            disabled={loading}
            className="flex items-center gap-2"
            style={{ backgroundColor: colorTheme }}
          >
            <GraduationCap className="h-4 w-4" />
            Promote Grade 6
          </Button>
          <Button
            onClick={cleanupAlumniStudents}
            disabled={cleaningUp}
            variant="outline"
            className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            {cleaningUp ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {cleaningUp ? 'Cleaning...' : 'Cleanup Alumni'}
          </Button>
          <Button
            variant="outline"
            onClick={loadAlumni}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Alumni</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalAlumni}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Graduation Years</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalYears}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">{currentYear} Graduates</p>
                <p className="text-2xl font-bold text-purple-900">{stats.thisYearGraduates}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Top Performers</p>
                <p className="text-2xl font-bold text-amber-900">{stats.topPerformers}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Outstanding Fees</p>
                <p className="text-2xl font-bold text-red-900">{stats.alumniWithOutstandingFees}</p>
                <p className="text-xs text-red-700">${stats.totalOutstandingFees.toLocaleString()}</p>
              </div>
              <BookOpen className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Alumni</TabsTrigger>
          <TabsTrigger value="recent">Recent Graduates</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search alumni..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {graduationYears.map((year) => (
                    <SelectItem key={year.year} value={year.year}>
                      {year.year} ({year.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Alumni Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alumni Directory
              </CardTitle>
              <CardDescription>
                {filteredAlumni.length} alumni found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAlumni.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Admission #</TableHead>
                        <TableHead>Graduation Year</TableHead>
                        <TableHead>Final Grade</TableHead>
                        <TableHead>Fee Balance</TableHead>
                        <TableHead>Achievements</TableHead>
                        <TableHead>Current Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlumni.map((alum) => (
                        <TableRow key={alum.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{alum.studentName}</div>
                              {alum.contactEmail && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {alum.contactEmail}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{alum.admissionNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{alum.graduationYear}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={alum.finalGrade === "A" ? "default" : "secondary"}
                              className={alum.finalGrade === "A" ? "bg-green-100 text-green-800" : ""}
                            >
                              {alum.finalGrade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {alum.feeBalance.hasOutstandingFees ? (
                                <Badge variant="destructive" className="text-xs">
                                  ${alum.feeBalance.outstandingBalance.toLocaleString()}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  Paid
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {alum.achievements.slice(0, 2).map((achievement, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {achievement}
                                </Badge>
                              ))}
                              {alum.achievements.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{alum.achievements.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {alum.currentInstitution && (
                                <div className="font-medium">{alum.currentInstitution}</div>
                              )}
                              {alum.currentOccupation && (
                                <div className="text-gray-500">{alum.currentOccupation}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setViewingAlumni(alum)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Alumni Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedYear !== "all" 
                      ? "Try adjusting your search criteria" 
                      : "Promote Grade 6 students to create alumni records"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Graduates ({currentYear})
              </CardTitle>
              <CardDescription>
                Students who graduated this academic year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alumni
                  .filter(alum => alum.graduationYear === currentYear)
                  .slice(0, 6)
                  .map((alum) => (
                    <Card key={alum.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{alum.studentName}</h4>
                            <p className="text-sm text-gray-500">{alum.admissionNumber}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Final Grade:</span>
                            <Badge variant="outline">{alum.finalGrade}</Badge>
                          </div>
                          {alum.achievements.length > 0 && (
                            <div className="text-sm">
                              <span className="text-gray-600">Achievements:</span>
                              <div className="flex gap-1 mt-1">
                                {alum.achievements.slice(0, 2).map((achievement, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {achievement}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievement Highlights
              </CardTitle>
              <CardDescription>
                Outstanding achievements and accomplishments of our alumni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Top Performers
                  </h3>
                  <div className="space-y-3">
                    {alumni
                      .filter(alum => alum.finalGrade === "A")
                      .slice(0, 5)
                      .map((alum, index) => (
                        <div key={alum.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-yellow-700">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{alum.studentName}</div>
                            <div className="text-sm text-gray-500">{alum.graduationYear}</div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Grade A
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Recent Achievements
                  </h3>
                  <div className="space-y-3">
                    {alumni
                      .filter(alum => alum.achievements.length > 0)
                      .slice(0, 5)
                      .map((alum) => (
                        <div key={alum.id} className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                          <div className="font-medium">{alum.studentName}</div>
                          <div className="text-sm text-gray-500 mb-2">{alum.graduationYear}</div>
                          <div className="flex flex-wrap gap-1">
                            {alum.achievements.slice(0, 3).map((achievement, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                {achievement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alumni View Modal */}
      <Dialog open={!!viewingAlumni} onOpenChange={() => setViewingAlumni(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Alumni Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about {viewingAlumni?.studentName}
            </DialogDescription>
          </DialogHeader>
          
          {viewingAlumni && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Student Name</Label>
                  <div className="text-sm bg-gray-50 p-2 rounded">{viewingAlumni.studentName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Admission Number</Label>
                  <div className="text-sm bg-gray-50 p-2 rounded">{viewingAlumni.admissionNumber}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Graduation Year</Label>
                  <div className="text-sm bg-gray-50 p-2 rounded">{viewingAlumni.graduationYear}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Final Grade</Label>
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    <Badge variant="outline">{viewingAlumni.finalGrade}</Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {(viewingAlumni.contactEmail || viewingAlumni.contactPhone) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingAlumni.contactEmail && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Email</Label>
                        <div className="text-sm bg-blue-50 p-2 rounded">{viewingAlumni.contactEmail}</div>
                      </div>
                    )}
                    {viewingAlumni.contactPhone && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Phone</Label>
                        <div className="text-sm bg-blue-50 p-2 rounded">{viewingAlumni.contactPhone}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current Status */}
              {(viewingAlumni.currentInstitution || viewingAlumni.currentOccupation) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Current Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingAlumni.currentInstitution && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Current Institution</Label>
                        <div className="text-sm bg-green-50 p-2 rounded">{viewingAlumni.currentInstitution}</div>
                      </div>
                    )}
                    {viewingAlumni.currentOccupation && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Current Occupation</Label>
                        <div className="text-sm bg-green-50 p-2 rounded">{viewingAlumni.currentOccupation}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fee Balance Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fee Balance Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${viewingAlumni.feeBalance.totalPayments.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Payments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        ${viewingAlumni.feeBalance.totalArrears.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Total Arrears</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${viewingAlumni.feeBalance.hasOutstandingFees ? 'text-red-600' : 'text-green-600'}`}>
                        ${viewingAlumni.feeBalance.outstandingBalance.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Outstanding Balance</div>
                    </div>
                  </div>
                  
                  {viewingAlumni.feeBalance.hasOutstandingFees ? (
                    <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-700 font-medium">⚠️ Outstanding Fees</div>
                      <div className="text-sm text-red-600">
                        This alumni has outstanding fees of ${viewingAlumni.feeBalance.outstandingBalance.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-green-700 font-medium">✅ Fees Cleared</div>
                      <div className="text-sm text-green-600">
                        All fees have been paid in full
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements */}
              {viewingAlumni.achievements.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Achievements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingAlumni.achievements.map((achievement, index) => (
                      <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 



