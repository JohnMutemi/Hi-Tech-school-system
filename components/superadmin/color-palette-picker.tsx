"use client";

import { COLOR_PALETTES } from "@/lib/school-website/palettes";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string;
  onChange: (slug: string, primaryHex: string) => void;
};

export function ColorPalettePicker({ value, onChange }: Props) {
  const current = COLOR_PALETTES.find((p) => p.slug === value) ?? COLOR_PALETTES[1];

  return (
    <div className="space-y-2">
      <p className="text-xs md:text-sm font-medium text-stone-700">Color palette</p>
      <Select
        value={current.slug}
        onValueChange={(slug) => {
          const palette = COLOR_PALETTES.find((p) => p.slug === slug);
          if (palette) onChange(slug, palette.primary);
        }}
      >
        <SelectTrigger className="h-9 md:h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLOR_PALETTES.map((palette) => (
            <SelectItem key={palette.slug} value={palette.slug}>
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-stone-200"
                  style={{ backgroundColor: palette.primary }}
                />
                {palette.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-2 pt-1">
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.slug}
            type="button"
            title={palette.name}
            onClick={() => onChange(palette.slug, palette.primary)}
            className={cn(
              "h-8 w-8 rounded-full border-2 transition",
              value === palette.slug ? "border-stone-900 scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: palette.primary }}
          />
        ))}
      </div>
    </div>
  );
}
