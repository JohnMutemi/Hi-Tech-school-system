"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, Sparkles, RefreshCw } from "lucide-react";
import type { PublicSchoolPayload } from "@/lib/school-website/types";
import { schoolWebsiteCssVars } from "@/lib/school-website/theme-vars";
import { SchoolPublicSite } from "@/components/school-website/school-public-site";

type PublicSitePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PublicSchoolPayload | null;
  publicLinkLabel: string;
  onRefreshFromForm: () => void;
  onGenerateAi: () => void | Promise<void>;
  aiLoading: boolean;
  aiConfigured: boolean;
  aiError: string | null;
};

export function PublicSitePreviewDialog({
  open,
  onOpenChange,
  data,
  publicLinkLabel,
  onRefreshFromForm,
  onGenerateAi,
  aiLoading,
  aiConfigured,
  aiError,
}: PublicSitePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(100vw-1.5rem,1120px)] gap-0 overflow-hidden p-0 flex flex-col">
        <DialogHeader className="shrink-0 space-y-1 border-b bg-amber-50/90 px-4 py-3 text-left sm:px-6">
          <DialogTitle className="text-base font-semibold text-stone-900 sm:text-lg">
            Public website preview
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-600 sm:text-sm">
            This is how the marketing site will look with your template, colours, logo, and content. The
            live link only works after the school is created.
          </DialogDescription>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-600">Public link</span>
              <Badge
                variant="outline"
                className="max-w-full shrink font-mono text-[10px] text-left break-all sm:text-xs"
              >
                {publicLinkLabel || "—"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onRefreshFromForm}
                disabled={aiLoading}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Reset to form
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-violet-600 text-xs text-white hover:bg-violet-700"
                onClick={() => void onGenerateAi()}
                disabled={aiLoading || !aiConfigured}
                title={
                  aiConfigured
                    ? "Generate copy with Gemini using the fields in the form"
                    : "Set GEMINI_API_KEY on the server to enable AI preview"
                }
              >
                {aiLoading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-3 w-3" />
                )}
                AI preview
              </Button>
              {publicLinkLabel.startsWith("http") && (
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild>
                  <a href={publicLinkLabel} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Domain
                  </a>
                </Button>
              )}
            </div>
          </div>
          {aiError ? (
            <p className="pt-1 text-xs text-red-700">{aiError}</p>
          ) : !aiConfigured ? (
            <p className="pt-1 text-xs text-stone-500">
              AI preview is optional. Without a Gemini key, use &quot;Reset to form&quot; to see template copy
              and your About / News / Admissions notes.
            </p>
          ) : null}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto bg-stone-100">
          {data ? (
            <div
              className="min-h-[70vh] bg-white shadow-inner"
              style={schoolWebsiteCssVars(data.colorTheme)}
            >
              <SchoolPublicSite data={data} />
            </div>
          ) : (
            <div className="flex min-h-[50vh] items-center justify-center p-8 text-sm text-stone-500">
              Fill in the school name (and optional code) to generate a preview.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
