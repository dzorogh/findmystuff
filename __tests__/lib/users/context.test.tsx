import React from "react";
import { render, screen } from "@testing-library/react";
import { UserProvider, useUser } from "@/lib/users/context";

const mockGetSession = jest.fn().mockResolvedValue({ data: { session: null } });
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

jest.mock("@/lib/shared/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

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

});
