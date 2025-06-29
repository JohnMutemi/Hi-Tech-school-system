"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  BookOpen,
  Users,
  Settings,
  Key,
  Menu,
} from "lucide-react";

const sidebarNav = [
  { label: "My Classes", icon: BookOpen, section: "classes" },
  { label: "My Subjects", icon: BookOpen, section: "subjects" },
  { label: "My Students", icon: Users, section: "students" },
  { label: "Settings", icon: Settings, section: "settings" },
  { label: "Profile", icon: User, section: "profile" },
];

export default function TeacherDashboardPage({
  params,
}: {
  params: { schoolCode: string };
}) {
  const { schoolCode } = params;
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [editProfile, setEditProfile] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    if (activeSection === "profile" && teacher) {
      return editProfile ? <EditProfileForm /> : <ProfileView />;
    }
    if (activeSection === "classes") {
      return <ClassesView />;
    }
    if (activeSection === "subjects") {
      return <SubjectsView />;
    }
    if (activeSection === "students") {
      return <StudentsView />;
    }
    if (activeSection === "settings") {
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r p-4 transform transition-transform md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center text-center p-4 border-b">
          <Avatar className="w-24 h-24 mb-4 relative group">
            <img
              src={teacher?.avatarUrl || "/placeholder-user.jpg"}
              alt={teacher?.name}
            />
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </label>
          </Avatar>
          <h2 className="font-bold text-xl">{teacher?.name}</h2>
          <p className="text-sm text-gray-500">{teacher?.email}</p>
        </div>
        <nav className="mt-6 space-y-2">
          {sidebarNav.map((item) => (
            <Button
              key={item.section}
              variant={activeSection === item.section ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActiveSection(item.section);
                setIsSidebarOpen(false);
              }}
            >
              <item.icon className="w-4 h-4 mr-2" /> {item.label}
            </Button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu />
          </Button>
          <h1 className="font-semibold text-lg">Teacher Dashboard</h1>
          <Avatar className="w-8 h-8">
            <img
              src={teacher?.avatarUrl || "/placeholder-user.jpg"}
              alt={teacher?.name}
            />
          </Avatar>
        </header>

        <main className="flex-grow p-4 md:p-6">
          {teacher ? renderContent() : <p>Loading...</p>}
        </main>
      </div>
    </div>
  );
}
