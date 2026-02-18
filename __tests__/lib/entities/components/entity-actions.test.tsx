import React from "react";
import { render, screen } from "@testing-library/react";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import { Pencil } from "lucide-react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/rooms/1",
  useRouter: () => ({ push: jest.fn() }),
}));

describe("EntityActions", () => {
  it("рендерит null при пустом actions", () => {
    const { container } = render(<EntityActions actions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("рендерит кнопки при actions с edit (href)", () => {
    render(
      <EntityActions
        actions={[
          {
            key: "edit",
            label: "Редактировать",
            icon: Pencil,
            href: "/rooms/1",
          },
        ]}
      />
    );
    expect(screen.getByLabelText("Редактировать")).toBeInTheDocument();
  });
});
