"use client";

import { useCallback, useState } from "react";

export const useListPanelState = (
  externalOpen?: boolean,
  onOpenChange?: (open: boolean) => void
) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (externalOpen === undefined) {
        setInternalOpen(open);
      }
      onOpenChange?.(open);
    },
    [externalOpen, onOpenChange]
  );

  return { isOpen, setIsOpen };
};
