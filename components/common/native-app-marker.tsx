"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const NativeAppMarker = () => {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      document.body.dataset.native = "true";
      return;
    }

    document.body.dataset.native = "false";
  }, []);

  return null;
};

export default NativeAppMarker;
