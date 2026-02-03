"use client";

import { useEffect } from "react";

const PRINT_DELAY_MS = 120;
const CLOSE_DELAY_MS = 300;

export const PrintAutoActions = () => {
  useEffect(() => {
    const printNow = () => {
      window.setTimeout(() => {
        window.focus();
        window.print();
      }, PRINT_DELAY_MS);
    };

    if (document.readyState === "complete") {
      printNow();
    } else {
      window.addEventListener("load", printNow, { once: true });
    }

    const handleAfterPrint = () => {
      window.setTimeout(() => {
        // window.close();
      }, CLOSE_DELAY_MS);
    };

    window.addEventListener("afterprint", handleAfterPrint, { once: true });

    return () => {
      window.removeEventListener("load", printNow);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return null;
};
