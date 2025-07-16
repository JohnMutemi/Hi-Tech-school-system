"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut,
  User,
  BookOpen,
  Users,
  Settings,
  Key,
  Menu,
  GraduationCap,
  FileText,
  Calendar,
  Bell,
  CheckCircle,
  Eye,
  Edit,
} from "lucide-react";
import { TeacherSidebar } from "@/components/teacher-dashboard/TeacherSidebar";

export default function TeacherDashboardPage({
  params,
}: {
  params: { schoolCode: string };
}) {
  const { schoolCode } = params;
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [editProfile, setEditProfile] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [schoolData, setSchoolData] = useState<any>(null);

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const sessionRes = await fetch(
          `/api/schools/${schoolCode}/teachers/session`
        );
        if (!sessionRes.ok) {
          router.replace(`/schools/${schoolCode}/teachers/login`);
          return;
        }
        const session = await sessionRes.json();
        const teacherId = session.teacherId;
        if (!teacherId) {
          router.replace(`/schools/${schoolCode}/teachers/login`);
          return;
        }
        const res = await fetch(
          `/api/schools/${schoolCode}/teachers/${teacherId}`
        );
        if (!res.ok) {
          router.replace(`/schools/${schoolCode}/teachers/login`);
          return;
        }
        const teacherData = await res.json();
        setTeacher(teacherData);
        
        // Fetch school data for color theme
        const schoolRes = await fetch(`/api/schools/${schoolCode}`);
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          setSchoolData(schoolData);
        }
      } catch (err) {
        router.replace(`/schools/${schoolCode}/teachers/login`);
      }
    }
    fetchTeacher();
  }, [schoolCode, router]);

  const handleLogout = async () => {
    await fetch(`/api/schools/${schoolCode}/teachers/logout`, {
      method: "POST",
    });
    router.replace(`/schools/${schoolCode}/teachers/login`);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be less than 5MB.");
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const avatarUrl = ev.target?.result as string;
      await fetch(`/api/schools/${schoolCode}/teachers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher.id, avatarUrl }),
      });
      setTeacher((prev: any) => ({ ...prev, avatarUrl }));
      setAvatarUploading(false);
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.");
      return;
    }
    if (oldPassword !== teacher?.tempPassword) {
      setPasswordMsg("Old password is incorrect.");
      return;
    }
    if (!teacher?.id) return;
    const teacherId = teacher.id;
    await fetch(`/api/schools/${schoolCode}/teachers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacherId, tempPassword: newPassword }),
    });
    setTeacher((prev: any) => ({ ...prev, tempPassword: newPassword }));
    setPasswordMsg("Password changed successfully!");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleEditProfile = () => {
    setEditData({
      name: teacher.name,
      phone: teacher.phone,
      qualification: teacher.qualification,
      avatarUrl: teacher.avatarUrl,
    });
    setEditProfile(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be less than 5MB.");
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const avatarUrl = ev.target?.result as string;
      setEditData((prev: any) => ({ ...prev, avatarUrl }));
      setAvatarUploading(false);
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher?.id) return;
    const teacherId = teacher.id;
    await fetch(`/api/schools/${schoolCode}/teachers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacherId, ...editData }),
    });
    setTeacher((prev: any) => ({ ...prev, ...editData }));
    setEditProfile(false);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditProfile(false);
    setEditData({});
  };

  const renderContent = () => {
    if (activeTab === "profile" && teacher) {
      return editProfile ? <EditProfileForm /> : <ProfileView />;
    }
    if (activeTab === "classes") {
      return <ClassesView />;
    }
    if (activeTab === "subjects") {
      return <SubjectsView />;
    }
    if (activeTab === "students") {
      return <StudentsView />;
    }
    if (activeTab === "settings") {
      return <SettingsView />;
    }
    return <WelcomeView />;
  };

  const WelcomeView = () => (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-2">Welcome, {teacher?.name}!</h2>
      <p className="text-gray-600">
        Select an option from the menu to get started.
      </p>
    </div>
  );

  const ProfileView = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          <strong>Name:</strong> {teacher.name}
        </p>
        <p>
          <strong>Email:</strong> {teacher.email}
        </p>
        <p>
          <strong>Phone:</strong> {teacher.phone || "N/A"}
        </p>
        <p>
          <strong>Qualification:</strong> {teacher.qualification || "N/A"}
        </p>
        <Button onClick={handleEditProfile}>Edit Profile</Button>
      </CardContent>
    </Card>
  );

  const EditProfileForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <input
            name="name"
            value={editData.name || ""}
            onChange={handleEditChange}
            placeholder="Name"
            className="w-full p-2 border rounded"
          />
          <input
            name="phone"
            value={editData.phone || ""}
            onChange={handleEditChange}
            placeholder="Phone"
            className="w-full p-2 border rounded"
          />
          <input
            name="qualification"
            value={editData.qualification || ""}
            onChange={handleEditChange}
            placeholder="Qualification"
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2">
            <Button type="submit">Save Changes</Button>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const ClassesView = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {teacher?.classes?.length > 0 ? (
          <ul className="space-y-2">
            {teacher.classes.map((c: any) => (
              <li key={c.id} className="p-2 border rounded">
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>You are not assigned to any classes yet.</p>
        )}
      </CardContent>
    </Card>
  );

  const SubjectsView = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Subjects</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Feature to view subjects is coming soon.</p>
      </CardContent>
    </Card>
  );

  const StudentsView = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Students</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Feature to view students is coming soon.</p>
      </CardContent>
    </Card>
  );

  const SettingsView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="font-semibold">Change Password</h3>
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
          {passwordMsg && <p className="text-sm text-red-500">{passwordMsg}</p>}
          <Button type="submit">Update Password</Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar with modern look */}
      {teacher && schoolData && (
        <TeacherSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          colorTheme={schoolData.colorTheme || "#3b82f6"} 
          onLogout={handleLogout} 
          teacher={teacher} 
        />
      )}
      
      {/* Main Content Area with vertical divider */}
      <div className="flex-1 flex justify-center items-start relative">
        {/* Vertical divider/shadow */}
        <div className="hidden md:block absolute left-0 top-0 h-full w-10 z-10">
          <div className="h-full w-2 ml-6 bg-gradient-to-b from-transparent via-blue-200 to-transparent shadow-2xl rounded-full opacity-80" />
        </div>
        
        <main className="flex-1 flex justify-center items-start p-2 md:p-6 transition-all duration-300">
          <section className="w-full max-w-7xl bg-white/80 rounded-3xl shadow-2xl p-4 md:p-14 backdrop-blur-lg mx-2 md:mx-6 ml-0 md:ml-20 lg:ml-32 pl-0 md:pl-16">
            {/* Header */}
            <div
              className="sticky top-0 z-20 bg-white/70 shadow-sm border-b rounded-2xl mb-8 px-4 py-8 flex items-center justify-between"
              style={{ borderTopColor: schoolData?.colorTheme || "#3b82f6", borderTopWidth: "4px" }}
            >
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-2 shadow-lg">
                  <AvatarImage src={teacher?.avatarUrl} alt={teacher?.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                    {teacher?.name?.charAt(0) || "T"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {teacher?.name}!
                  </h1>
                  <p className="text-gray-600">
                    Teacher Dashboard - {schoolData?.name || "School"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active Teacher
                </Badge>
              </div>
            </div>

            {/* Main Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* Summary Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <GraduationCap className="w-6 h-6 text-blue-500 mb-1" />
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-gray-500 text-sm">My Classes</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <FileText className="w-6 h-6 text-green-500 mb-1" />
                      <div className="text-2xl font-bold">5</div>
                      <div className="text-gray-500 text-sm">My Subjects</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <Users className="w-6 h-6 text-purple-500 mb-1" />
                      <div className="text-2xl font-bold">120</div>
                      <div className="text-gray-500 text-sm">My Students</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <Calendar className="w-6 h-6 text-orange-500 mb-1" />
                      <div className="text-2xl font-bold">95%</div>
                      <div className="text-gray-500 text-sm">Attendance</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-2xl border-0 px-4 py-4 md:px-12 md:py-10">
                  <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-xl">
                      <CheckCircle className="w-6 h-6 md:w-5 md:h-5 text-green-500" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        onClick={() => setActiveTab("classes")}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        <GraduationCap className="w-6 h-6" />
                        <span>View My Classes</span>
                      </Button>
                      <Button
                        onClick={() => setActiveTab("students")}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <Users className="w-6 h-6" />
                        <span>Manage Students</span>
                      </Button>
                      <Button
                        onClick={() => setActiveTab("settings")}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                      >
                        <Settings className="w-6 h-6" />
                        <span>Account Settings</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Other Tab Contents */}
              <TabsContent value="classes" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <ClassesView />
              </TabsContent>

              <TabsContent value="subjects" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <SubjectsView />
              </TabsContent>

              <TabsContent value="students" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <StudentsView />
              </TabsContent>

              <TabsContent value="attendance" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Attendance tracking functionality coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">No new notifications</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <SettingsView />
              </TabsContent>

              <TabsContent value="profile" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                {teacher && (editProfile ? <EditProfileForm /> : <ProfileView />)}
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </div>
  );
}
