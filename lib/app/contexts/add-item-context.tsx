"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { BarcodeScanner } from "@/components/common/scanner";
import { CameraCaptureDialog } from "@/components/common/camera-capture-dialog";
import AddItemForm from "@/components/forms/add-item-form";
import { toast } from "sonner";
import { barcodeLookupApiClient } from "@/lib/shared/api/barcode-lookup";
import { photoApiClient } from "@/lib/shared/api/photo";
import { recognizeItemPhotoApiClient } from "@/lib/shared/api/recognize-item-photo";
import { logError } from "@/lib/shared/logger";

interface AddItemContextValue {
  openByPhoto: () => void;
  openByBarcode: () => void;
  openByForm: () => void;
  setOnSuccess: (callback: (() => void) | null) => void;
  isBarcodeLookupLoading: boolean;
  isRecognizeLoading: boolean;
}

const AddItemContext = createContext<AddItemContextValue | undefined>(undefined);

export function AddItemProvider({ children }: { children: ReactNode }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [initialName, setInitialName] = useState<string | null>(null);
  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string | null>(null);
  const [isBarcodeLookupLoading, setIsBarcodeLookupLoading] = useState(false);
  const [isRecognizeLoading, setIsRecognizeLoading] = useState(false);
  const onSuccessRef = useRef<(() => void) | null>(null);

  const setOnSuccess = useCallback((callback: (() => void) | null) => {
    onSuccessRef.current = callback;
  }, []);

  const openByPhoto = useCallback(() => {
    setCameraOpen(true);
  }, []);

  const openByBarcode = useCallback(() => {
    setBarcodeOpen(true);
  }, []);

  const openByForm = useCallback(() => {
    setInitialName(null);
    setInitialPhotoUrl(null);
    setAddFormOpen(true);
  }, []);

  const handleBarcodeScanSuccess = useCallback(async (barcode: string) => {
    setBarcodeOpen(false);
    setIsBarcodeLookupLoading(true);

    try {
      const data = await barcodeLookupApiClient.lookup(barcode);

      if (data.error) {
        toast.error(data.error);
      }

      const productName = data.productName?.trim() || null;
      setInitialName(productName);
      setAddFormOpen(true);

      if (!productName) {
        toast.info("Наименование не найдено. Введите название вручную.");
      }
    } catch (err) {
      logError("Barcode lookup error:", err);
      toast.error("Не удалось получить данные по штрихкоду");
      setInitialName(null);
      setAddFormOpen(true);
    } finally {
      setIsBarcodeLookupLoading(false);
    }
  }, []);

  const handleCameraCapture = useCallback(async (blob: Blob) => {
    setCameraOpen(false);
    setIsRecognizeLoading(true);
    const toastId = toast.loading("Распознавание предмета...");

    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

    try {
      const [uploadResult, recognizeResult] = await Promise.all([
        photoApiClient.uploadPhoto(file),
        recognizeItemPhotoApiClient.recognize(file),
      ]);

      const url = uploadResult.data?.url ?? null;
      const itemName = recognizeResult.itemName?.trim() ?? null;

      setInitialPhotoUrl(url);
      setInitialName(itemName);
      setAddFormOpen(true);

      if (recognizeResult.error) {
        toast.error(recognizeResult.error);
      }
      if (!itemName) {
        toast.info("Название не распознано. Введите название вручную.");
      }
    } catch (err) {
      logError("Photo capture/recognize error:", err);
      toast.error(
        err instanceof Error ? err.message : "Не удалось обработать фотографию"
      );
      setInitialPhotoUrl(null);
      setInitialName(null);
      setAddFormOpen(true);
    } finally {
      toast.dismiss(toastId);
      setIsRecognizeLoading(false);
    }
  }, []);

  const handleAddFormOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setInitialName(null);
      setInitialPhotoUrl(null);
    }
    setAddFormOpen(open);
  }, []);

  const handleAddSuccess = useCallback(() => {
    onSuccessRef.current?.();
  }, []);

  const value: AddItemContextValue = {
    openByPhoto,
    openByBarcode,
    openByForm,
    setOnSuccess,
    isBarcodeLookupLoading,
    isRecognizeLoading,
  };

  return (
    <AddItemContext.Provider value={value}>
      {children}
      <CameraCaptureDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
      <BarcodeScanner
        open={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        onScanSuccess={handleBarcodeScanSuccess}
      />
      <AddItemForm
        open={addFormOpen}
        onOpenChange={handleAddFormOpenChange}
        onSuccess={handleAddSuccess}
        initialName={initialName}
        initialPhotoUrl={initialPhotoUrl}
      />
    </AddItemContext.Provider>
  );
}

export function useAddItem() {
  const context = useContext(AddItemContext);
  if (context === undefined) {
    throw new Error("useAddItem must be used within an AddItemProvider");
  }
  return context;
}
