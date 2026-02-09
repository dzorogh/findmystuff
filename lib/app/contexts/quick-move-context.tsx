"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import QuickMoveDialog from "@/components/quick-move/quick-move-dialog";

interface QuickMoveContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const QuickMoveContext = createContext<QuickMoveContextValue | undefined>(undefined);

export const QuickMoveProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
  }, []);

  return (
    <QuickMoveContext.Provider value={{ open, setOpen }}>
      {children}
      <QuickMoveDialog open={open} onOpenChange={handleOpenChange} />
    </QuickMoveContext.Provider>
  );
};

export const useQuickMove = () => {
  const context = useContext(QuickMoveContext);
  if (context === undefined) {
    throw new Error("useQuickMove must be used within a QuickMoveProvider");
  }
  return context;
};
