"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import type { GalleryImageItem, SectionContent, WebsiteSectionKey } from "@/lib/school-website/types";

const BULLET_SECTIONS: WebsiteSectionKey[] = ["about", "admissions", "contact"];
const ITEM_SECTIONS: WebsiteSectionKey[] = ["programmes", "news"];

type Props = {
  sectionKey: WebsiteSectionKey;
  content: SectionContent;
  onChange: (patch: Partial<SectionContent>) => void;
};

export function WebsiteSectionFields({ sectionKey, content, onChange }: Props) {
  const items = content.items ?? [];
  const galleryImages = content.galleryImages ?? [];

  const updateGalleryImage = (index: number, patch: Partial<GalleryImageItem>) => {
    const next = galleryImages.map((img, i) => (i === index ? { ...img, ...patch } : img));
    onChange({ galleryImages: next });
  };

  const addGalleryRow = () => {
    onChange({ galleryImages: [...galleryImages, { url: "", alt: "", caption: "" }] });
  };

  const removeGalleryImage = (index: number) => {
    onChange({ galleryImages: galleryImages.filter((_, i) => i !== index) });
  };

  const onGalleryFile = async (index: number, file: File | undefined) => {
    if (!file) return;
    if (file.size > 900 * 1024) {
      window.alert("Image is too large. Use a file under 900KB or paste an image URL instead.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    updateGalleryImage(index, { url: dataUrl });
  };

  const updateItem = (index: number, patch: { title?: string; description?: string }) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ items: next });
  };

  const addItem = () => {
    onChange({ items: [...items, { title: "New item", description: "" }] });
  };

  const removeItem = (index: number) => {
    onChange({ items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {sectionKey === "hero" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Input
              value={content.subheadline || ""}
              onChange={(e) => onChange({ subheadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Button label</Label>
            <Input
              value={content.ctaLabel || ""}
              onChange={(e) => onChange({ ctaLabel: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Button link (e.g. #admissions)</Label>
            <Input
              value={content.ctaHref || ""}
              onChange={(e) => onChange({ ctaHref: e.target.value })}
            />
          </div>
        </div>
      )}

      {sectionKey === "admissions" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Button label</Label>
            <Input
              value={content.ctaLabel || ""}
              onChange={(e) => onChange({ ctaLabel: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Button link</Label>
            <Input
              value={content.ctaHref || ""}
              onChange={(e) => onChange({ ctaHref: e.target.value })}
            />
          </div>
        </div>
      )}

      {BULLET_SECTIONS.includes(sectionKey) && (
        <div className="space-y-2">
          <Label>Bullet points (one per line)</Label>
          <Textarea
            rows={4}
            value={(content.bullets ?? []).join("\n")}
            onChange={(e) =>
              onChange({
                bullets: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
      )}

      {ITEM_SECTIONS.includes(sectionKey) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{sectionKey === "programmes" ? "Programme cards" : "News / event cards"}</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add card
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No cards yet. Add one to show on the public site.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${sectionKey}-item-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Card {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 h-8"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) => updateItem(index, { title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Short description"
                    rows={2}
                    value={item.description || ""}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sectionKey === "gallery" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label>Gallery images</Label>
              <p className="text-xs text-slate-500 mt-1">
                Campus, buildings, staff, sports, clubs — shown as two scrolling rows on the public site (max 24
                images).
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addGalleryRow}>
              <ImagePlus className="h-4 w-4 mr-1" />
              Add image
            </Button>
          </div>
          {galleryImages.length === 0 ? (
            <p className="text-sm text-slate-500">No photos yet. Add URLs or upload images below.</p>
          ) : (
            <div className="space-y-4">
              {galleryImages.map((img, index) => (
                <div
                  key={`gallery-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Image {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 h-8"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Image URL (https://…)"
                    disabled={Boolean(img.url?.startsWith("data:"))}
                    value={img.url?.startsWith("data:") ? "" : img.url || ""}
                    onChange={(e) => updateGalleryImage(index, { url: e.target.value })}
                  />
                  {img.url?.startsWith("data:") ? (
                    <p className="text-xs text-slate-500">Embedded upload — delete this row to remove, or paste a URL above to replace.</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs shrink-0">Upload</Label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="max-w-xs text-xs"
                      onChange={(e) => void onGalleryFile(index, e.target.files?.[0])}
                    />
                  </div>
                  {img.url ? (
                    <div className="flex gap-3 items-start">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="h-16 w-24 rounded border object-cover shrink-0 bg-white"
                      />
                      <div className="flex-1 space-y-2 min-w-0">
                        <Input
                          placeholder="Alt text (accessibility)"
                          value={img.alt || ""}
                          onChange={(e) => updateGalleryImage(index, { alt: e.target.value })}
                        />
                        <Input
                          placeholder="Caption (optional)"
                          value={img.caption || ""}
                          onChange={(e) => updateGalleryImage(index, { caption: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Alt text"
                        value={img.alt || ""}
                        onChange={(e) => updateGalleryImage(index, { alt: e.target.value })}
                      />
                      <Input
                        placeholder="Caption (optional)"
                        value={img.caption || ""}
                        onChange={(e) => updateGalleryImage(index, { caption: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
