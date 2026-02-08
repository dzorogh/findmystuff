import React from "react";
import { render, screen } from "@testing-library/react";
import { EntityActions } from "@/components/entity-detail/entity-actions";

jest.mock("next/navigation", () => ({
  usePathname: () => "/rooms/1",
}));

describe("EntityActions", () => {
  it("рендерит null при пустом actions", () => {
    const { container } = render(
      <EntityActions
        actions={{ actions: [] }}
        callbacks={{}}
        isDeleted={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("рендерит кнопки при actions с edit и callbacks.editHref", () => {
    render(
      <EntityActions
        actions={{ actions: ["edit"] }}
        callbacks={{ editHref: "/rooms/1" }}
        isDeleted={false}
      />
    );
    expect(screen.getByTitle("Редактировать")).toBeInTheDocument();
  });
});
