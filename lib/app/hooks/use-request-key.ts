"use client";

import { useRef } from "react";

export const useRequestKey = () => {
  const isLoadingRef = useRef(false);
  const requestKeyRef = useRef("");

  const shouldStart = (key: string) => {
    if (isLoadingRef.current && requestKeyRef.current === key) {
      return false;
    }
    isLoadingRef.current = true;
    requestKeyRef.current = key;
    return true;
  };

  const isLatest = (key: string) => requestKeyRef.current === key;

  const finish = (key: string) => {
    if (requestKeyRef.current === key) {
      isLoadingRef.current = false;
      requestKeyRef.current = "";
    }
  };

  return { shouldStart, isLatest, finish };
};
