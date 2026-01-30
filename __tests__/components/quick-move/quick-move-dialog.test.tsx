import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuickMoveDialog from "@/components/quick-move/quick-move-dialog";
import { apiClient } from "@/lib/api-client";

jest.mock("@/lib/api-client");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

declare global {
  interface Window {
    __quickMoveScanSuccess?: (p: { type: string; id: number }) => void;
  }
}

jest.mock("@/components/common/qr-scanner", () => ({
  __esModule: true,
  default: function MockQRScanner({
    onScanSuccess,
  }: {
    onScanSuccess: (p: { type: string; id: number }) => void;
    onClose: () => void;
  }) {
    if (typeof window !== "undefined") {
      window.__quickMoveScanSuccess = onScanSuccess;
    }
    return <div data-testid="qr-scanner-mock" />;
  },
}));

describe("QuickMoveDialog", () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getItem as jest.Mock).mockResolvedValue({ item: { name: "Item 1" } });
    (apiClient.getContainer as jest.Mock).mockResolvedValue({ container: { name: "Container 2" } });
    (apiClient.getPlace as jest.Mock).mockResolvedValue({ place: { name: "Place" } });
    (apiClient.getRoom as jest.Mock).mockResolvedValue({ room: { name: "Room" } });
    (apiClient.createTransition as jest.Mock).mockResolvedValue({ data: { id: 1 } });
  });

  it("does not render dialog content when open is false", () => {
    render(
      <QuickMoveDialog open={false} onOpenChange={mockOnOpenChange} />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows scanner when open (first step)", async () => {
    render(
      <QuickMoveDialog open={true} onOpenChange={mockOnOpenChange} />
    );
    await waitFor(() => {
      expect(screen.getByTestId("qr-scanner-mock")).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  const triggerScan = (type: string, id: number) => {
    window.__quickMoveScanSuccess?.({ type, id });
  };

  it("full flow: scan first → scan second (different type) → confirm → createTransition", async () => {
    const user = userEvent.setup();
    const mockCreateTransition = jest.fn().mockResolvedValue({ data: { id: 1 } });
    (apiClient.createTransition as jest.Mock) = mockCreateTransition;

    render(
      <QuickMoveDialog open={true} onOpenChange={mockOnOpenChange} onSuccess={mockOnSuccess} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("qr-scanner-mock")).toBeInTheDocument();
    });

    await act(async () => {
      triggerScan("item", 1);
    });

    await act(async () => {
      triggerScan("container", 2);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Подтвердить/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Переместить/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Подтвердить/i }));

    await waitFor(() => {
      expect(mockCreateTransition).toHaveBeenCalledTimes(1);
      expect(mockCreateTransition).toHaveBeenCalledWith({
        item_id: 1,
        destination_type: "container",
        destination_id: 2,
      });
    });
  });

  it("shows error toast when second scan is same type", async () => {
    const { toast } = await import("sonner");

    render(
      <QuickMoveDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("qr-scanner-mock")).toBeInTheDocument();
    });

    await act(async () => {
      triggerScan("item", 1);
    });

    await act(async () => {
      triggerScan("item", 99);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Нужна сущность другого типа",
      expect.any(Object)
    );
    expect(screen.queryByRole("button", { name: /Подтвердить/i })).not.toBeInTheDocument();
  });

  it("shows error toast when second scan is same entity (same type and id)", async () => {
    const { toast } = await import("sonner");

    render(
      <QuickMoveDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("qr-scanner-mock")).toBeInTheDocument();
    });

    await act(async () => {
      triggerScan("item", 1);
    });

    await act(async () => {
      triggerScan("item", 1);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Отсканирована та же сущность",
      expect.objectContaining({
        description: "Отсканируйте другую сущность (другой QR-код)",
      })
    );
    expect(screen.queryByRole("button", { name: /Подтвердить/i })).not.toBeInTheDocument();
  });
});
