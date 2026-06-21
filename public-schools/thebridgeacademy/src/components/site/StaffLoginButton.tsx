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
  variant?: "header" | "mobile";
  scrolled?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function StaffLoginButton({
  variant = "header",
  scrolled = false,
  onNavigate,
  className,
}: StaffLoginButtonProps) {
  const triggerClass =
    variant === "mobile"
      ? "min-h-12 px-4 rounded-lg text-foreground/80 active:bg-secondary font-medium inline-flex items-center gap-2 w-full"
      : cn(
          "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border transition",
          scrolled
            ? "border-border text-foreground/80 hover:text-primary hover:border-primary"
            : "border-white/30 text-white/90 hover:bg-white/10",
          variant === "header" && "ml-2",
        );

  const handleProceed = () => {
    onNavigate?.();
    const url = getStaffLoginUrl();
    console.log("[StaffLoginButton] navigating to:", url);
    window.location.href = url;
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className={cn(triggerClass, className)}>
          <Lock className={variant === "mobile" ? "h-4 w-4" : "h-3.5 w-3.5"} />
          Staff Login
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-md border-primary/20 shadow-elegant sm:mx-auto">
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldAlert className="h-7 w-7" aria-hidden />
          </span>
          <AlertDialogTitle className="font-display text-xl text-primary">
            Authorization required
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base leading-relaxed text-muted-foreground">
            You need authorization to access this page. The staff portal is restricted to
            authorized school personnel only.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2">
          <AlertDialogCancel className="min-w-[7rem]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleProceed}
            className="min-w-[7rem] bg-gradient-gold text-gold-foreground hover:opacity-90"
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}