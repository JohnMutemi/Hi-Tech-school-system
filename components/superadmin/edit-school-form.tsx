"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPalettePicker } from "@/components/superadmin/color-palette-picker";
import { useToast } from "@/hooks/use-toast";
import { isAcceptableSchoolLogoFile, SCHOOL_LOGO_ACCEPT } from "@/lib/utils/school-logo-file";

type Props = {
  schoolCode: string;
};

export default function EditSchoolForm({ schoolCode }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [description, setDescription] = useState("");
  const [motto, setMotto] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [website, setWebsite] = useState("");
  const [colorTheme, setColorTheme] = useState("#d97706");
  const [colorPaletteSlug, setColorPaletteSlug] = useState("amber");
  const [packageType, setPackageType] = useState("full");
  const [status, setStatus] = useState<"active" | "suspended">("active");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoDirty, setLogoDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}`);
      if (!res.ok) throw new Error("School not found");
      const s = await res.json();
      setName(s.name || "");
      const profile = s.profile || {};
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || s.adminEmail || "");
      setAdminEmail(s.adminEmail || "");
      setAdminFirstName(s.adminFirstName || "");
      setAdminLastName(s.adminLastName || "");
      setDescription(s.description || profile.description || "");
      setMotto(profile.motto || "");
      setPrincipalName(profile.principalName || "");
      setEstablishedYear(profile.establishedYear?.toString() || "");
      setWebsite(profile.website || "");
      setColorTheme(s.colorTheme || "#d97706");
      setColorPaletteSlug(s.colorPaletteSlug || "amber");
      setPackageType((s.packageType || "full").toLowerCase());
      setStatus(s.status === "suspended" ? "suspended" : "active");
      const logo = s.logoUrl || s.logo || "";
      setLogoPreview(typeof logo === "string" ? logo : "");
      setLogoDirty(false);
    } catch {
      toast({ title: "Error", description: "Could not load school.", variant: "destructive" });
      router.push("/superadmin/schools");
    } finally {
      setLoading(false);
    }
  }, [schoolCode, router, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAcceptableSchoolLogoFile(file)) {
      toast({ title: "Invalid file", description: "Use PNG, JPG, GIF, or WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 500000) {
      toast({ title: "Too large", description: "Logo must be under 500KB.", variant: "destructive" });
      return;
    }
    try {
      const url = await readFileAsDataUrl(file);
      setLogoPreview(url);
      setLogoDirty(true);
    } catch {
      toast({ title: "Error", description: "Could not read logo file.", variant: "destructive" });
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          adminEmail,
          adminFirstName,
          adminLastName,
          description,
          colorTheme,
          status,
          logoUrl: logoDirty ? logoPreview : undefined,
          packageType,
          colorPaletteSlug,
          profile: {
            motto,
            principalName,
            establishedYear,
            description,
            website,
            email,
            address,
            phone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast({ title: "Saved", description: "School profile updated." });
      setLogoDirty(false);
      await load();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-stone-600">Loading school…</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/superadmin/schools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Schools
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-stone-900">Edit school</h1>
        <span className="font-mono text-sm text-stone-500">{schoolCode}</span>
      </div>

      <Card>
            <CardHeader>
              <CardTitle>School details</CardTitle>
              <CardDescription>
                Update contact information, admin account, portal colours, and logo. Public marketing sites are built
                separately in Lovable (`public-schools/*`).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>School name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Admin email</Label>
                  <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Admin first name</Label>
                  <Input value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Admin last name</Label>
                  <Input value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>School office email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Website URL</Label>
                  <Input
                    placeholder="https://www.yourschool.ac.ke"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                  <p className="text-xs text-stone-500">
                    Optional link to the school&apos;s Lovable marketing site (for reference only).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Principal</Label>
                  <Input value={principalName} onChange={(e) => setPrincipalName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Established year</Label>
                  <Input value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Motto</Label>
                  <Input value={motto} onChange={(e) => setMotto(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Package</Label>
                  <Select value={packageType} onValueChange={setPackageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full package</SelectItem>
                      <SelectItem value="finance_only">Finance only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "active" | "suspended")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ColorPalettePicker
                value={colorPaletteSlug}
                onChange={(slug, primary) => {
                  setColorPaletteSlug(slug);
                  setColorTheme(primary);
                }}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Accent colour</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorTheme}
                      onChange={(e) => setColorTheme(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border"
                    />
                    <Input className="font-mono" value={colorTheme} onChange={(e) => setColorTheme(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <Input type="file" accept={SCHOOL_LOGO_ACCEPT} onChange={(e) => void handleLogoChange(e)} />
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" className="mt-2 h-14 w-14 rounded border object-contain bg-white" />
                  ) : null}
                </div>
              </div>

              <Button type="button" onClick={() => void saveProfile()} disabled={saving}>
                {saving ? "Saving…" : "Save profile & branding"}
              </Button>
            </CardContent>
      </Card>
    </div>
  );
}
