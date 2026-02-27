import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { SettingsProvider, useSettings } from "@/lib/settings/context";

jest.mock("@/lib/users/context", () => ({
  useUser: jest.fn(() => ({ user: { id: "1" }, isLoading: false })),
}));

jest.mock("@/lib/settings/api", () => ({
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
    const { getSettings } = require("@/lib/settings/api");
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

  it("при ошибке getSettings показывает error", async () => {
    const { getSettings } = require("@/lib/settings/api");
    getSettings.mockResolvedValue({ data: [], error: "Server error" });

    render(
      <SettingsProvider>
        <Consumer />
      </SettingsProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("error")).toHaveTextContent("Server error");
      },
      { timeout: 3000 }
    );
  });

  it("getUserSetting возвращает значение пользовательской настройки", async () => {
    const { getSettings } = require("@/lib/settings/api");
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

    const { updateSetting } = require("@/lib/settings/api");
    updateSetting.mockResolvedValue({ data: {}, error: null });

    await act(async () => {
      screen.getByTestId("update-user-setting").click();
    });

    await waitFor(() => {
      expect(updateSetting).toHaveBeenCalledWith("theme", "light", true);
    });
  });

  it("updateUserSetting без user возвращает ошибку авторизации", async () => {
    const { useUser } = require("@/lib/users/context");
    useUser.mockImplementation(() => ({ user: null, isLoading: false }));

    const TestConsumer = () => {
      const [result, setResult] = React.useState<string | null>(null);
      const { updateUserSetting } = useSettings();
      return (
        <div>
          <button
            data-testid="update-no-user"
            onClick={async () => {
              const r = await updateUserSetting("theme", "light");
              setResult(r.error ?? "ok");
            }}
          />
          <span data-testid="result">{result ?? "pending"}</span>
        </div>
      );
    };

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await act(async () => {
      screen.getByTestId("update-no-user").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent(
        "Пользователь не авторизован"
      );
    });
  });

  it("updateSetting при ошибке API возвращает сообщение об ошибке", async () => {
    const { updateSetting } = require("@/lib/settings/api");
    updateSetting.mockResolvedValue({ data: null, error: "Update failed" });

    const TestConsumer = () => {
      const [result, setResult] = React.useState<string | null>(null);
      const { updateSetting } = useSettings();
      return (
        <div>
          <button
            data-testid="update-setting-error"
            onClick={async () => {
              const r = await updateSetting("theme", "light");
              setResult(r.error ?? "ok");
            }}
          />
          <span data-testid="update-result">{result ?? "pending"}</span>
        </div>
      );
    };

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await act(async () => {
      screen.getByTestId("update-setting-error").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("update-result")).toHaveTextContent(
        "Update failed"
      );
    });
  });
});
