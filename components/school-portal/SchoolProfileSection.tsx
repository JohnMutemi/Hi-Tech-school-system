import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, School, Edit, CheckCircle } from "lucide-react";
import type { SchoolProfile } from "@/lib/school-storage";

interface SchoolProfileSectionProps {
  schoolCode: string;
  colorTheme: string;
  toast: any;
}

const defaultProfile: SchoolProfile = {
  address: "",
  phone: "",
  website: "",
  principalName: "",
  establishedYear: "",
  description: "",
  email: "",
  motto: "",
  type: "primary",
};

export default function SchoolProfileSection({ schoolCode, colorTheme, toast }: SchoolProfileSectionProps) {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(defaultProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setSchoolProfile({ ...defaultProfile, ...data.profile });
            setProfileSaved(true);
          } else {
            setSchoolProfile(defaultProfile);
            setProfileSaved(false);
          }
        }
      } catch (err) {
        setError("Failed to load school profile");
      }
    }
    if (schoolCode) fetchProfile();
    // eslint-disable-next-line
  }, [schoolCode]);

  // Save or update profile
  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      // Validate required fields
      if (!schoolProfile.address || !schoolProfile.phone || !schoolProfile.email || !schoolProfile.principalName || !schoolProfile.establishedYear || !schoolProfile.type) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/schools/${schoolCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: schoolProfile }),
      });
      if (!res.ok) throw new Error("Failed to update school profile");
      setProfileSaved(true);
      setIsEditingProfile(false);
      toast({ title: "Success!", description: "School profile saved successfully!" });
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
      toast({ title: "Error", description: err.message || "Failed to save profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <School className="w-5 h-5" />
            School Profile
          </span>
          {profileSaved && !isEditingProfile && (
            <Button onClick={() => setIsEditingProfile(true)} variant="outline" style={{ borderColor: colorTheme, color: colorTheme }}>
              <Edit className="w-4 h-4 mr-2" />
              Update Profile
            </Button>
          )}
          {profileSaved && isEditingProfile && (
            <Button onClick={() => setIsEditingProfile(false)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel Edit
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {profileSaved && !isEditingProfile
            ? "Complete school information and administrative details"
            : isEditingProfile
            ? "Update your school's information and contact details"
            : "Complete your school's basic information and contact details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profileSaved && !isEditingProfile ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Contact & Location
                </h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Campus Address</Label>
                    <p className="text-gray-900 font-medium">{schoolProfile.address || "Address not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Contact Phone</Label>
                    <p className="text-gray-900 font-medium">{schoolProfile.phone || "Phone not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Email Address</Label>
                    <p className="text-gray-900 font-medium">{schoolProfile.email || "Email not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Website</Label>
                    <p className="text-gray-900 font-medium">
                      {schoolProfile.website ? (
                        <a href={schoolProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {schoolProfile.website}
                        </a>
                      ) : (
                        "Website not set"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  School Information
                </h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Principal</Label>
                    <p className="text-gray-900 font-medium">{schoolProfile.principalName || "Principal not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Founded</Label>
                    <p className="text-gray-900 font-medium">{schoolProfile.establishedYear || "Year not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">Institution Type</Label>
                    <p className="text-gray-900 font-medium capitalize">{schoolProfile.type || "Type not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1">School Motto</Label>
                    <p className="text-gray-900 font-medium italic">"{schoolProfile.motto || "Motto not set"}"</p>
                  </div>
                </div>
              </div>
              {schoolProfile.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    About Our School
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{schoolProfile.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleSave();
            }}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">School Address *</Label>
                <Textarea
                  id="address"
                  value={schoolProfile.address}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                  placeholder="Enter school address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={schoolProfile.phone}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, phone: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">School Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={schoolProfile.email}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })}
                  placeholder="info@school.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={schoolProfile.website}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, website: e.target.value })}
                  placeholder="https://www.school.edu"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Principal/Head Teacher *</Label>
                <Input
                  id="principal"
                  value={schoolProfile.principalName}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, principalName: e.target.value })}
                  placeholder="Enter principal's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="established">Year Established *</Label>
                <Input
                  id="established"
                  value={schoolProfile.establishedYear}
                  onChange={(e) => setSchoolProfile({ ...schoolProfile, establishedYear: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">School Type *</Label>
                <select
                  id="type"
                  value={schoolProfile.type}
                  onChange={e => setSchoolProfile({ ...schoolProfile, type: e.target.value as SchoolProfile["type"] })}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="mixed">Mixed</option>
                  <option value="college">College</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motto">School Motto (Optional)</Label>
              <Input
                id="motto"
                value={schoolProfile.motto}
                onChange={(e) => setSchoolProfile({ ...schoolProfile, motto: e.target.value })}
                placeholder="Enter school motto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">School Description</Label>
              <Textarea
                id="description"
                value={schoolProfile.description}
                onChange={(e) => setSchoolProfile({ ...schoolProfile, description: e.target.value })}
                placeholder="Brief description of the school..."
                rows={4}
              />
            </div>
            {error && <div className="text-red-600">{error}</div>}
            <Button type="submit" style={{ backgroundColor: colorTheme }} disabled={loading}>
              {loading ? "Saving..." : profileSaved ? "Update School Profile" : "Save School Profile"}
            </Button>
          </form>
        )}
        {profileSaved && !isEditingProfile && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Profile Complete</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 