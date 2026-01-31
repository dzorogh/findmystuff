import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  CurrentPageProvider,
  useCurrentPage,
} from "@/lib/app/contexts/current-page-context";

const Consumer = () => {
  const { entityName, isLoading, entityActions, setEntityName, setIsLoading, setEntityActions } =
    useCurrentPage();
  return (
    <div>
      <span data-testid="entityName">{entityName ?? "null"}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="hasActions">{entityActions ? "yes" : "no"}</span>
      <button
        type="button"
        onClick={() => setEntityName("Test Entity")}
        aria-label="set name"
      />
      <button
        type="button"
        onClick={() => setIsLoading(true)}
        aria-label="set loading"
      />
      <button
        type="button"
        onClick={() => setEntityActions(<span>Actions</span>)}
        aria-label="set actions"
      />
    </div>
  );
};

describe("CurrentPageContext", () => {
  it("предоставляет начальные значения", () => {
    render(
      <CurrentPageProvider>
        <Consumer />
      </CurrentPageProvider>
    );

    expect(screen.getByTestId("entityName")).toHaveTextContent("null");
    expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
    expect(screen.getByTestId("hasActions")).toHaveTextContent("no");
  });

  it("обновляет entityName через setEntityName", () => {
    render(
      <CurrentPageProvider>
        <Consumer />
      </CurrentPageProvider>
    );

    act(() => {
      screen.getByLabelText("set name").click();
    });

    expect(screen.getByTestId("entityName")).toHaveTextContent("Test Entity");
  });

  it("обновляет isLoading через setIsLoading", () => {
    render(
      <CurrentPageProvider>
        <Consumer />
      </CurrentPageProvider>
    );

    act(() => {
      screen.getByLabelText("set loading").click();
    });

    expect(screen.getByTestId("isLoading")).toHaveTextContent("true");
  });

  it("обновляет entityActions через setEntityActions", () => {
    render(
      <CurrentPageProvider>
        <Consumer />
      </CurrentPageProvider>
    );

    act(() => {
      screen.getByLabelText("set actions").click();
    });

    expect(screen.getByTestId("hasActions")).toHaveTextContent("yes");
  });

  it("useCurrentPage выбрасывает ошибку вне провайдера", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<Consumer />);
    }).toThrow("useCurrentPage must be used within a CurrentPageProvider");

    consoleSpy.mockRestore();
  });
});
