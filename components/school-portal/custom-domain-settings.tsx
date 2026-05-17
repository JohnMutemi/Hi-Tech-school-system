"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

type Props = {
  customDomain: string;
  onCustomDomainChange: (value: string) => void;
  platformSiteUrl: string;
  platformCnameTarget: string;
  disabled?: boolean;
};

export function CustomDomainSettings({
  customDomain,
  onCustomDomainChange,
  platformSiteUrl,
  platformCnameTarget,
  disabled,
}: Props) {
  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">Custom domain</h3>
        <p className="text-sm text-slate-500 mt-1">
          Point your school&apos;s domain at this platform to show your public website at{" "}
          <span className="font-mono text-slate-700">www.yourschool.ac.ke</span> instead of{" "}
          <span className="font-mono text-slate-700">{platformSiteUrl}</span>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-domain">Domain (hostname)</Label>
        <Input
          id="custom-domain"
          placeholder="www.bridgeacademy.ac.ke"
          value={customDomain}
          onChange={(e) => onCustomDomainChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-slate-500">
          Enter without <span className="font-mono">https://</span>. Leave empty to use only the
          platform URL. Staff login always stays on the platform host.
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-3">
        <p className="font-medium text-slate-800">DNS setup (at your domain registrar)</p>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
          <li>
            <span className="font-medium">WWW / subdomain:</span> CNAME{" "}
            <span className="font-mono">www</span> →{" "}
            <span className="font-mono">{platformCnameTarget}</span>
          </li>
          <li>
            <span className="font-medium">Root domain (@):</span> use your host&apos;s apex/ALIAS
            instructions (Vercel: A record or ALIAS to the same target).
          </li>
          <li>
            Add the domain in your hosting dashboard (e.g. Vercel → Domains) so SSL is issued.
          </li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(platformCnameTarget)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy CNAME target
          </Button>
        </div>
      </div>
    </div>
  );
}
