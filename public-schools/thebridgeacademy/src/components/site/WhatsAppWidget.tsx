import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SCHOOL_PHONE_DISPLAY, whatsAppUrl, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/contact";

export function WhatsAppWidget() {
  const [open, setOpen] = useState(false);

  const startChat = () => {
    window.open(whatsAppUrl(WHATSAPP_DEFAULT_MESSAGE), "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="fixed z-50 flex flex-col items-end gap-3 safe-bottom safe-right">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mr-1 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-elegant overflow-hidden sm:w-72"
          >
            <div className="flex items-center justify-between bg-[#25D366] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">The Bridge Academy</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-md text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-sm font-medium text-foreground">Leave us a message</p>
              <p className="mt-1 text-xs text-muted-foreground">
                WhatsApp: {SCHOOL_PHONE_DISPLAY} — we&apos;ll open chat so you can type your
                message.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground/80"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={startChat}
                  className="min-h-11 flex-1 rounded-md bg-[#25D366] px-3 text-sm font-semibold text-white hover:bg-[#1ebe57]"
                >
                  Start chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat on WhatsApp"
        aria-expanded={open}
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant active:scale-95 sm:hover:scale-105 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
