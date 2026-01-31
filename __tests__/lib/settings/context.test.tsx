import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { SettingsProvider, useSettings } from "@/lib/settings/context";

jest.mock("@/lib/users/context", () => ({
  useUser: () => ({ user: { id: "1" }, isLoading: false }),
}));

jest.mock("@/lib/users/api", () => ({
  getSettings: jest.fn().mockResolvedValue({
    data: [{ id: 1, key: "theme", value: "dark", category: "ui", user_id: null }],
    error: null,
  }),
  updateSetting: jest.fn().mockResolvedValue({ data: {}, error: null }),
}));

jest.mock("@/components/theme/theme-sync", () => ({
  ThemeSync: ({ children }: { children: React.ReactNode }) => children,
}));

const Consumer = () => {
  const { settings, isLoading, error, getSetting } = useSettings();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? "null"}</span>
      <span data-testid="settings-count">{settings.length}</span>
      <span data-testid="theme">{getSetting("theme") ?? "null"}</span>
    </div>
  );
};

describe("SettingsContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getSettings } = require("@/lib/users/api");
    getSettings.mockResolvedValue({
      data: [{ id: 1, key: "theme", value: "dark", category: "ui", user_id: null }],
      error: null,
    });
  });

  it("предоставляет settings, isLoading, getSetting после загрузки", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("settings-count")).toHaveTextContent("1");
        expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      },
      { timeout: 3000 }
    );
  });

  it("useSettings выбрасывает ошибку вне провайдера", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<Consumer />);
    }).toThrow("useSettings must be used within a SettingsProvider");

    consoleSpy.mockRestore();
  });
});
