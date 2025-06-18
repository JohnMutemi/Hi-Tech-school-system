"use client";

import type React from "react";
import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  School,
  Upload,
  Palette,
  Link as LinkIcon,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  generateSchoolCode,
  generateTempPassword,
} from "@/lib/utils/school-generator";
import { SchoolCreationSuccess } from "./school-creation-success";
import { createSchoolClient } from "@/lib/actions/school-actions";
import { useToast } from "@/hooks/use-toast";

interface AddSchoolFormProps {
  onSchoolAdded?: () => void;
}

const AddSchoolForm: React.FC<AddSchoolFormProps> = ({ onSchoolAdded }) => {
  const { toast } = useToast();
  const [schoolData, setSchoolData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    code: "",
    colorTheme: "#3b82f6",
    description: "",
    website: "",
    principalName: "",
    establishedYear: new Date().getFullYear().toString(),
    motto: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    schoolCode: "",
    tempPassword: "",
    portalUrl: "",
    schoolName: "",
    adminEmail: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSchoolData({ ...schoolData, [name]: value });

    // Auto-generate portal URL when school name changes
    if (name === "name" && value) {
      const code = schoolData.code || generateSchoolCode(value);
      setGeneratedPortalUrl(
        `https://app.yourdomain.com/schools/${code.toLowerCase()}`
      );
    }
  };

  const generateSchoolCode = (schoolName: string): string => {
    const cleanName = schoolName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const prefix = cleanName.substring(0, 3) || "SCH";
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${suffix}`;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Logo file size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      setLogoFile(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolData({ ...schoolData, colorTheme: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const {
        name,
        address,
        phone,
        email,
        code,
        colorTheme,
        description,
        website,
        principalName,
        establishedYear,
        motto,
      } = schoolData;

      // Validate required fields
      if (!name || !address || !phone || !email) {
        setError("All required fields must be filled");
        setIsSubmitting(false);
        return;
      }

      // Handle logo upload if provided
      let logoUrl = "";
      if (logoFile) {
        try {
          // Create a data URL for the logo
          const reader = new FileReader();
          reader.onload = (e) => {
            logoUrl = e.target?.result as string;
          };
          reader.readAsDataURL(logoFile);
        } catch (error) {
          console.error("Error processing logo:", error);
          // Continue without logo if there's an error
        }
      }

      // Create school using client-side function
      const result = await createSchoolClient({
        name,
        address,
        phone,
        email,
        code,
        colorTheme,
        description,
        website,
        principalName,
        establishedYear,
        motto,
        logoUrl,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Show success modal
        setSuccessData({
          schoolCode: result.schoolCode,
          tempPassword: result.tempPassword,
          portalUrl: result.portalUrl,
          schoolName: name,
          adminEmail: email,
        });
        setShowSuccessModal(true);
        onSchoolAdded?.();

        // Reset form
        setSchoolData({
          name: "",
          address: "",
          phone: "",
          email: "",
          code: "",
          colorTheme: "#3b82f6",
          description: "",
          website: "",
          principalName: "",
          establishedYear: new Date().getFullYear().toString(),
          motto: "",
        });
        setLogoFile(null);
        setLogoPreview("");
        setGeneratedPortalUrl("");
      }
    } catch (error) {
      console.error("Error creating school:", error);
      setError("Failed to create school. Please try again.");
    }

    setIsSubmitting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Credentials copied to clipboard",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="w-6 h-6" />
            <span>Add New School</span>
          </CardTitle>
          <CardDescription>
            Create a new school portal with unique branding and admin access.
            The system will automatically generate a unique portal URL and
            initial admin credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">School Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={schoolData.name}
                    onChange={handleChange}
                    placeholder="Enter school name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">School Code (Optional)</Label>
                  <Input
                    id="code"
                    name="code"
                    value={schoolData.code}
                    onChange={handleChange}
                    placeholder="Auto-generated if left empty"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={schoolData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the school"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={schoolData.email}
                    onChange={handleChange}
                    placeholder="admin@school.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={schoolData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={schoolData.address}
                  onChange={handleChange}
                  placeholder="Full school address"
                  required
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={schoolData.website}
                    onChange={handleChange}
                    placeholder="https://school.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principalName">Principal Name</Label>
                  <Input
                    id="principalName"
                    name="principalName"
                    value={schoolData.principalName}
                    onChange={handleChange}
                    placeholder="Principal's full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    name="establishedYear"
                    value={schoolData.establishedYear}
                    onChange={handleChange}
                    placeholder="2020"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motto">School Motto</Label>
                  <Input
                    id="motto"
                    name="motto"
                    value={schoolData.motto}
                    onChange={handleChange}
                    placeholder="School motto or tagline"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Branding & Customization
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label>School Logo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {logoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-20 h-20 mx-auto object-contain rounded-lg border"
                        />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {logoFile?.name}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview("");
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                          >
                            Remove Logo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Color Theme */}
                <div className="space-y-4">
                  <Label htmlFor="colorTheme">Color Theme</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        id="colorTheme"
                        name="colorTheme"
                        type="color"
                        value={schoolData.colorTheme}
                        onChange={handleColorThemeChange}
                        className="w-12 h-12 rounded-lg border cursor-pointer"
                      />
                      <div className="flex-1">
                        <Input
                          value={schoolData.colorTheme}
                          onChange={handleColorThemeChange}
                          placeholder="#3b82f6"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                        "#06b6d4",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setSchoolData({ ...schoolData, colorTheme: color })
                          }
                          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Generated Portal Preview */}
            {generatedPortalUrl && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Generated Portal</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Portal URL:</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedPortalUrl)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {generatedPortalUrl}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(generatedPortalUrl, "_blank")}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? "Creating School..." : "Create School Portal"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      {showSuccessModal && (
        <SchoolCreationSuccess
          schoolCode={successData.schoolCode}
          tempPassword={successData.tempPassword}
          portalUrl={successData.portalUrl}
          schoolName={successData.schoolName}
          adminEmail={successData.adminEmail}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default AddSchoolForm;
