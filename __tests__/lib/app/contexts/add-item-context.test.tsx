import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  AddItemProvider,
  useAddItem,
} from "@/lib/app/contexts/add-item-context";

// Моки внешних зависимостей
const cameraProps: Record<string, unknown> = {};
jest.mock("@/components/common/camera-capture-dialog", () => ({
  CameraCaptureDialog: (props: unknown) => {
    Object.assign(cameraProps, props);
    return <div data-testid="camera-dialog" />;
  },
}));

const scannerProps: Record<string, unknown> = {};
jest.mock("@/components/common/scanner", () => ({
  BarcodeScanner: (props: unknown) => {
    Object.assign(scannerProps, props);
    return <div data-testid="barcode-scanner" />;
  },
}));

let lastFormProps: any = {};
jest.mock("@/components/forms/add-item-form", () => ({
  __esModule: true,
  default: (props: any) => {
    lastFormProps = props;
    return (
      <div
        data-testid="add-item-form"
        data-open={String(props.open)}
        data-initial-name={props.initialName ?? ""}
        data-initial-photo-url={props.initialPhotoUrl ?? ""}
      />
    );
  },
}));

jest.mock("@/lib/shared/api/barcode-lookup", () => ({
  barcodeLookupApiClient: { lookup: jest.fn() },
}));

jest.mock("@/lib/shared/api/photo", () => ({
  photoApiClient: {
    uploadPhoto: jest.fn(),
  },
}));

jest.mock("@/lib/shared/api/recognize-item-photo", () => ({
  recognizeItemPhotoApiClient: { recognize: jest.fn() },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(() => "toast-id"),
    dismiss: jest.fn(),
  },
}));

const { barcodeLookupApiClient } = jest.requireMock(
  "@/lib/shared/api/barcode-lookup"
) as { barcodeLookupApiClient: { lookup: jest.Mock } };
const { photoApiClient } = jest.requireMock(
  "@/lib/shared/api/photo"
) as { photoApiClient: { uploadPhoto: jest.Mock } };
const { recognizeItemPhotoApiClient } = jest.requireMock(
  "@/lib/shared/api/recognize-item-photo"
) as { recognizeItemPhotoApiClient: { recognize: jest.Mock } };
const { toast } = jest.requireMock("sonner") as {
  toast: {
    error: jest.Mock;
    info: jest.Mock;
    loading: jest.Mock;
    dismiss: jest.Mock;
  };
};

const Consumer = () => {
  const ctx = useAddItem();
  return (
    <div>
      <button
        type="button"
        aria-label="open-form"
        onClick={ctx.openByForm}
      />
      <button
        type="button"
        aria-label="open-barcode"
        onClick={ctx.openByBarcode}
      />
      <button
        type="button"
        aria-label="open-photo"
        onClick={ctx.openByPhoto}
      />
    </div>
  );
};

const OnSuccessConsumer = ({ onSuccess }: { onSuccess: () => void }) => {
  const ctx = useAddItem();

  React.useEffect(() => {
    ctx.setOnSuccess(onSuccess);
  }, [ctx, onSuccess]);

  return null;
};

describe("AddItemContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastFormProps = {};
    Object.keys(cameraProps).forEach((k) => delete cameraProps[k]);
    Object.keys(scannerProps).forEach((k) => delete scannerProps[k]);
  });

  it("useAddItem выбрасывает ошибку вне провайдера", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const Broken = () => {
      // вызов хука вне провайдера
      useAddItem();
      return null;
    };

    expect(() => render(<Broken />)).toThrow(
      "useAddItem must be used within an AddItemProvider"
    );

    consoleSpy.mockRestore();
  });

  it("openByForm открывает форму с пустыми initialName и initialPhotoUrl", () => {
    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-form").click();
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialName).toBeNull();
    expect(lastFormProps.initialPhotoUrl).toBeNull();
  });

  it("openByBarcode открывает сканер и при успешном скане заполняет initialName", async () => {
    barcodeLookupApiClient.lookup.mockResolvedValue({
      productName: "  Товар  ",
      error: undefined,
    });

    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-barcode").click();
    });

    expect(scannerProps.open).toBe(true);
    const onScanSuccess = scannerProps.onScanSuccess as (code: string) => void;

    await act(async () => {
      await onScanSuccess("4601234567890");
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialName).toBe("Товар");
  });

  it("показывает info-toast, если наименование по штрихкоду не найдено", async () => {
    barcodeLookupApiClient.lookup.mockResolvedValue({
      productName: "   ",
      error: undefined,
    });

    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-barcode").click();
    });

    const onScanSuccess = scannerProps.onScanSuccess as (code: string) => void;

    await act(async () => {
      await onScanSuccess("4601234567890");
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialName).toBeNull();
    expect(toast.info).toHaveBeenCalledWith(
      "Наименование не найдено. Введите название вручную."
    );
  });

  it("показывает ошибку и открывает форму, если barcodeLookupApiClient.lookup выбрасывает исключение", async () => {
    barcodeLookupApiClient.lookup.mockRejectedValue(new Error("network error"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-barcode").click();
    });

    const onScanSuccess = scannerProps.onScanSuccess as (code: string) => void;

    await act(async () => {
      await onScanSuccess("4601234567890");
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialName).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(
      "Не удалось получить данные по штрихкоду"
    );

    consoleSpy.mockRestore();
  });

  it("openByPhoto открывает диалог камеры и при capture заполняет initialPhotoUrl и initialName", async () => {
    photoApiClient.uploadPhoto.mockResolvedValue({
      data: { url: "https://example.com/photo.jpg" },
    });
    recognizeItemPhotoApiClient.recognize.mockResolvedValue({
      itemName: "  Стол  ",
      error: undefined,
    });

    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-photo").click();
    });

    expect(cameraProps.open).toBe(true);
    const onCapture = cameraProps.onCapture as (blob: Blob) => Promise<void>;

    await act(async () => {
      await onCapture(new Blob(["data"], { type: "image/jpeg" }));
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialPhotoUrl).toBe("https://example.com/photo.jpg");
    expect(lastFormProps.initialName).toBe("Стол");
    expect(toast.dismiss).toHaveBeenCalled();
  });

  it("показывает ошибки распознавания и отсутствие имени при обработке фотографии", async () => {
    photoApiClient.uploadPhoto.mockResolvedValue({
      data: { url: "https://example.com/photo2.jpg" },
    });
    recognizeItemPhotoApiClient.recognize.mockResolvedValue({
      itemName: "   ",
      error: "Ошибка распознавания",
    });

    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-photo").click();
    });

    const onCapture = cameraProps.onCapture as (blob: Blob) => Promise<void>;

    await act(async () => {
      await onCapture(new Blob(["data"], { type: "image/jpeg" }));
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialPhotoUrl).toBe("https://example.com/photo2.jpg");
    expect(lastFormProps.initialName).toBe("");
    expect(toast.error).toHaveBeenCalledWith("Ошибка распознавания");
    expect(toast.info).toHaveBeenCalledWith(
      "Название не распознано. Введите название вручную."
    );
  });

  it("вызывает сохраненный onSuccess при успешном добавлении", () => {
    const onSuccess = jest.fn();

    render(
      <AddItemProvider>
        <OnSuccessConsumer onSuccess={onSuccess} />
      </AddItemProvider>
    );

    act(() => {
      lastFormProps.onSuccess();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("сбрасывает initialName и initialPhotoUrl при закрытии формы", async () => {
    photoApiClient.uploadPhoto.mockResolvedValue({
      data: { url: "https://example.com/photo3.jpg" },
    });
    recognizeItemPhotoApiClient.recognize.mockResolvedValue({
      itemName: "  Lamp  ",
      error: undefined,
    });

    render(
      <AddItemProvider>
        <Consumer />
      </AddItemProvider>
    );

    act(() => {
      screen.getByLabelText("open-photo").click();
    });

    const onCapture = cameraProps.onCapture as (blob: Blob) => Promise<void>;

    await act(async () => {
      await onCapture(new Blob(["data"], { type: "image/jpeg" }));
    });

    expect(lastFormProps.open).toBe(true);
    expect(lastFormProps.initialName).toBe("Lamp");
    expect(lastFormProps.initialPhotoUrl).toBe("https://example.com/photo3.jpg");

    act(() => {
      lastFormProps.onOpenChange(false);
    });

    expect(lastFormProps.open).toBe(false);
    expect(lastFormProps.initialName).toBeNull();
    expect(lastFormProps.initialPhotoUrl).toBeNull();
  });
});
