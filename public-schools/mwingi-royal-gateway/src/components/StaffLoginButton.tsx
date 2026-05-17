import { Lock, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getStaffLoginUrl } from "@/lib/staff-login";

type StaffLoginButtonProps = {
  variant?: "header" | "mobile" | "footer";
  onNavigate?: () => void;
  className?: string;
};

export function StaffLoginButton({
  variant = "header",
  onNavigate,
  className,
}: StaffLoginButtonProps) {
  const staffUrl = getStaffLoginUrl();

  const triggerClass =
    variant === "mobile"
      ? "inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
      : variant === "footer"
        ? "inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-[11px] font-medium text-primary-foreground/80 hover:bg-white/10"
        : "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  const handleProceed = () => {
    onNavigate?.();
    window.location.href = staffUrl;
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className={cn(triggerClass, className)}>
          <Lock size={variant === "footer" ? 12 : 13} />
          Staff Login
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md sm:mx-auto">
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-ocean">
            <ShieldAlert size={22} aria-hidden />
          </span>
          <AlertDialogTitle className="font-serif text-xl">Authorization required</AlertDialogTitle>
          <AlertDialogDescription>
            You need authorization to access this page. The staff finance portal is restricted to
            authorized Mwingi Royal Junior Academy personnel only. Unauthorized access is prohibited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-center">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleProceed}>Proceed</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
