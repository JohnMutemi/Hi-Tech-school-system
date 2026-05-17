import type { PublicSchoolPayload } from "@/lib/school-website/types";

export function SiteFooter({ data }: { data: PublicSchoolPayload }) {
  return (
    <footer className="border-t bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{data.name}</p>
            {data.motto && <p className="mt-1 text-sm text-slate-400">{data.motto}</p>}
          </div>
          <div className="space-y-1 text-sm">
            <p>{data.address}</p>
            <p>{data.phone}</p>
            <p>{data.email}</p>
          </div>
        </div>
        <p className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} {data.name}. Powered by Hi-Tech School Management.
        </p>
      </div>
    </footer>
  );
}
