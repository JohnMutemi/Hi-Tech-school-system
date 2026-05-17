"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Globe, RefreshCw } from "lucide-react";
import { WEBSITE_TEMPLATES } from "@/lib/school-website/templates";
import { COLOR_PALETTES } from "@/lib/school-website/palettes";
import type { SectionContent, WebsiteSectionKey } from "@/lib/school-website/types";
import { WebsiteSectionFields } from "./website-section-fields";
import { CustomDomainSettings } from "./custom-domain-settings";

type SectionRow = {
  id?: string;
  sectionKey: WebsiteSectionKey;
  title: string | null;
  content: SectionContent;
  isVisible: boolean;
  sortOrder: number;
};

type Props = {
  schoolCode: string;
  colorTheme: string;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
};

const SECTION_LABELS: Record<WebsiteSectionKey, string> = {
  hero: "Hero / Welcome",
  about: "About Us",
  programmes: "Programmes",
  gallery: "Campus & gallery",
  admissions: "Admissions",
  news: "News & Events",
  contact: "Contact",
};

export default function WebsiteContentSection({ schoolCode, colorTheme, toast }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publicSiteUrl, setPublicSiteUrl] = useState("");
  const [templateSlug, setTemplateSlug] = useState("classic");
  const [paletteSlug, setPaletteSlug] = useState("amber");
  const [theme, setTheme] = useState(colorTheme);
  const [publicEnabled, setPublicEnabled] = useState(true);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [platformSiteUrl, setPlatformSiteUrl] = useState("");
  const [platformCnameTarget, setPlatformCnameTarget] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/website`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPublicSiteUrl(data.publicSiteUrl || `/site/${schoolCode}`);
      setCustomDomain(data.customDomain || "");
      setPlatformSiteUrl(data.platformSiteUrl || data.pathSiteUrl || `/site/${schoolCode}`);
      setPlatformCnameTarget(data.platformCnameTarget || "");
      setTemplateSlug(data.websiteTemplateSlug || "classic");
      setPaletteSlug(data.colorPaletteSlug || "amber");
      setTheme(data.colorTheme || colorTheme);
      setPublicEnabled(data.publicWebsiteEnabled !== false);
      setSections(
        (data.sections || []).map((s: SectionRow) => ({
          ...s,
          content: (s.content || {}) as SectionContent,
        }))
      );
    } catch {
      toast({ title: "Error", description: "Could not load website settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [schoolCode, colorTheme, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSection = (key: WebsiteSectionKey, patch: Partial<SectionRow>) => {
    setSections((prev) =>
      prev.map((s) => (s.sectionKey === key ? { ...s, ...patch } : s))
    );
  };

  const updateContent = (key: WebsiteSectionKey, contentPatch: Partial<SectionContent>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.sectionKey === key
          ? { ...s, content: { ...s.content, ...contentPatch } }
          : s
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteTemplateSlug: templateSlug,
          colorPaletteSlug: paletteSlug,
          colorTheme: theme,
          publicWebsiteEnabled: publicEnabled,
          customDomain: customDomain.trim() || null,
          sections,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      toast({ title: "Saved", description: "Public website updated." });
      await load();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Could not save website",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReseed = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reseed: true, websiteTemplateSlug: templateSlug }),
      });
      if (!res.ok) throw new Error("Reseed failed");
      toast({ title: "Reset", description: "Default content restored for this template." });
      await load();
    } catch {
      toast({ title: "Error", description: "Could not reset content", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading website settings…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-[var(--school-primary,#d97706)]" style={{ color: theme }} />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Public Website</h2>
            <p className="text-sm text-slate-500">Customize your school&apos;s public-facing site</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={publicSiteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              View live site
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={handleReseed} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset to template defaults
          </Button>
        </div>
      </div>

      <CustomDomainSettings
        customDomain={customDomain}
        onCustomDomainChange={setCustomDomain}
        platformSiteUrl={platformSiteUrl}
        platformCnameTarget={platformCnameTarget}
        disabled={saving}
      />

      <div className="grid gap-4 md:grid-cols-3 rounded-xl border p-4 bg-slate-50/80">
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={templateSlug} onValueChange={setTemplateSlug}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEBSITE_TEMPLATES.map((t) => (
                <SelectItem key={t.slug} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color palette</Label>
          <Select
            value={paletteSlug}
            onValueChange={(slug) => {
              setPaletteSlug(slug);
              const p = COLOR_PALETTES.find((x) => x.slug === slug);
              if (p) setTheme(p.primary);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_PALETTES.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={publicEnabled} onCheckedChange={setPublicEnabled} id="pub-enabled" />
            <Label htmlFor="pub-enabled">Site published</Label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {[...sections].sort((a, b) => a.sortOrder - b.sortOrder).map((section) => (
          <article key={section.sectionKey} className="rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-slate-900">
                {SECTION_LABELS[section.sectionKey] || section.sectionKey}
              </h3>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Visible</Label>
                <Switch
                  checked={section.isVisible}
                  onCheckedChange={(v) => updateSection(section.sectionKey, { isVisible: v })}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Section title</Label>
                <Input
                  value={section.title || ""}
                  onChange={(e) => updateSection(section.sectionKey, { title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={section.content.headline || ""}
                  onChange={(e) => updateContent(section.sectionKey, { headline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Body text</Label>
              <Textarea
                rows={3}
                value={section.content.body || ""}
                onChange={(e) => updateContent(section.sectionKey, { body: e.target.value })}
              />
            </div>
            <WebsiteSectionFields
              sectionKey={section.sectionKey}
              content={section.content}
              onChange={(patch) => updateContent(section.sectionKey, patch)}
            />
          </article>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: theme }}>
        {saving ? "Saving…" : "Save website"}
      </Button>
    </div>
  );
}
