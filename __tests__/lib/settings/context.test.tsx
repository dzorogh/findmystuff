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
  const { settings, isLoading, error, getSetting, getUserSetting, updateSetting, updateUserSetting } = useSettings();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="error">{error ?? "null"}</span>
      <span data-testid="settings-count">{settings.length}</span>
      <span data-testid="theme">{getSetting("theme") ?? "null"}</span>
      <span data-testid="user-theme">{getUserSetting("theme") ?? "null"}</span>
      <button
        data-testid="update-setting"
        onClick={() => updateSetting("theme", "light")}
      />
      <button
        data-testid="update-user-setting"
        onClick={() => updateUserSetting("theme", "light")}
      />
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

  it("getUserSetting возвращает значение пользовательской настройки", async () => {
    const { getSettings } = require("@/lib/users/api");
    getSettings.mockResolvedValue({
      data: [
        { id: 1, key: "theme", value: "dark", category: "ui", user_id: null },
        { id: 2, key: "theme", value: "light", category: "ui", user_id: "1" },
      ],
      error: null,
    });

    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("user-theme")).toHaveTextContent("light");
      },
      { timeout: 3000 }
    );
  });

  it("updateUserSetting при успехе возвращает success", async () => {
    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("settings-count")).toHaveTextContent("1");
    });

    const { updateSetting } = require("@/lib/users/api");
    updateSetting.mockResolvedValue({ data: {}, error: null });

    await act(async () => {
      screen.getByTestId("update-user-setting").click();
    });

    await waitFor(() => {
      expect(updateSetting).toHaveBeenCalledWith("theme", "light", true);
    });
  });
});
