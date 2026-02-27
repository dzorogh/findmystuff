import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { UserProvider, useUser } from "@/lib/users/context";

const mockGetClientUser = jest.fn();

const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

jest.mock("@/lib/users/api", () => ({
  getClientUser: () => mockGetClientUser(),
}));

jest.mock("@/lib/shared/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

const { toast } = jest.requireMock("sonner") as {
  toast: {
    error: jest.Mock;
  };
};

const Consumer = () => {
  const { user, isLoading } = useUser();
  return (
    <div>
      <span data-testid="user">{user ? user.id : "null"}</span>
      <span data-testid="loading">{String(isLoading)}</span>
    </div>
  );
};

describe("UserContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientUser.mockResolvedValue(null);
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("предоставляет user и isLoading", async () => {
    render(
      <UserProvider>
        <Consumer />
      </UserProvider>
    );

    await screen.findByTestId("loading");
    expect(screen.getByTestId("user")).toHaveTextContent("null");
  });

  it("обновляет пользователя при событии авторизации и не дублирует INITIAL_SESSION", async () => {
    const user = { id: "user-1" } as any;
    mockGetClientUser.mockResolvedValue(user);

    mockOnAuthStateChange.mockImplementation((callback: (event: any) => void) => {
      callback("SIGNED_IN");
      callback("INITIAL_SESSION");
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    });

    render(
      <UserProvider>
        <Consumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(mockGetClientUser).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("user")).toHaveTextContent("user-1");
    });
  });

  it("обрабатывает ошибку при получении пользователя и показывает toast", async () => {
    const error = new Error("load failed");
    mockGetClientUser.mockRejectedValue(error);

    mockOnAuthStateChange.mockImplementation((callback: (event: any) => void) => {
      callback("SIGNED_IN");
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    });

    render(
      <UserProvider>
        <Consumer />
      </UserProvider>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("load failed");
    });

    expect(screen.getByTestId("user")).toHaveTextContent("null");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });
});
