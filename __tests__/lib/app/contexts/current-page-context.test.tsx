import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  CurrentPageProvider,
  useCurrentPage,
} from "@/lib/app/contexts/current-page-context";

const Consumer = () => {
  const { entityName, isLoading, setEntityName, setIsLoading } =
    useCurrentPage();
  return (
    <div>
      <span data-testid="entityName">{entityName ?? "null"}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
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

  it("useCurrentPage выбрасывает ошибку вне провайдера", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<Consumer />);
    }).toThrow("useCurrentPage must be used within a CurrentPageProvider");

    consoleSpy.mockRestore();
  });
});
