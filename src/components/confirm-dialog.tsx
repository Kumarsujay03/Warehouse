"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Trash2, Info } from "lucide-react";

type ConfirmVariant = "destructive" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /** Show a loading state after confirming (useful for async operations) */
  loadingText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setOpen(true);
      setLoading(false);
      setResolveRef(() => resolve);
    });
  }, []);

  function handleConfirm() {
    if (options?.loadingText) {
      setLoading(true);
      // Brief animation delay then resolve
      setTimeout(() => {
        setOpen(false);
        setLoading(false);
        resolveRef?.(true);
      }, 400);
    } else {
      setOpen(false);
      resolveRef?.(true);
    }
  }

  function handleCancel() {
    setOpen(false);
    setLoading(false);
    resolveRef?.(false);
  }

  const variant = options?.variant || "destructive";
  const IconComponent = variant === "destructive" ? Trash2 : variant === "warning" ? AlertTriangle : Info;
  const iconBg = variant === "destructive" ? "bg-red-500/10" : variant === "warning" ? "bg-yellow-500/10" : "bg-blue-500/10";
  const iconColor = variant === "destructive" ? "text-red-500" : variant === "warning" ? "text-yellow-500" : "text-blue-500";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                <IconComponent className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="flex-1 pt-0.5">
                <DialogTitle className="text-base">{options?.title}</DialogTitle>
                <DialogDescription className="mt-1.5">
                  {options?.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {options?.cancelText || "Cancel"}
            </Button>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {options?.loadingText || "Processing..."}
                </>
              ) : (
                options?.confirmText || "Confirm"
              )}
            </Button>
          </DialogFooter>

          {/* Progress bar animation */}
          {loading && (
            <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-lg">
              <div className="h-full w-full animate-pulse bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
