import React from "react";
import { render, screen } from "@testing-library/react";
import { EntityActions } from "@/lib/entities/components/entity-actions";

jest.mock("next/navigation", () => ({
  usePathname: () => "/rooms/1",
}));

describe("EntityActions", () => {
  it("рендерит null при пустом actionsConfig", () => {
    const { container } = render(
      <EntityActions
        actionsConfig={{ actions: [] }}
        callbacks={{}}
        isDeleted={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("рендерит кнопки при actionsConfig с edit и callbacks.editHref", () => {
    render(
      <EntityActions
        actionsConfig={{ actions: ["edit"] }}
        callbacks={{ editHref: "/rooms/1" }}
        isDeleted={false}
      />
    );
    expect(screen.getByTitle("Редактировать")).toBeInTheDocument();
  });
});
