import React from "react";
import { render, screen } from "@testing-library/react";
import { SearchHitCard } from "@/components/search/search-hit-card";
import type { SearchHit } from "@/lib/search/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SearchHitCard", () => {
  it("показывает упрощенную карточку без текстовых статусов и нижнего CTA", () => {
    const hit: SearchHit = {
      entityType: "item",
      entityId: 42,
      title: "Холодильник LG",
      subtitle: "Электроника",
      href: "/items/42",
      badges: [
        { label: "Вещь", variant: "secondary" },
        { label: "Совпадение по фото", variant: "outline" },
        { label: "Релевантность 43%", variant: "outline" },
      ],
      locationLines: [
        { key: "room", label: "Помещение", value: "1 этаж. Кухня" },
        { key: "place", label: "Место", value: "У стены" },
      ],
      match: {
        source: "image",
        score: 0.43,
      },
      preview: {
        imageUrl: "https://example.com/item.jpg",
      },
    };

    render(<SearchHitCard hit={hit} />);

    expect(screen.getByAltText("Холодильник LG")).toBeInTheDocument();
    expect(screen.getByText("Холодильник LG")).toBeInTheDocument();
    expect(screen.getByText("Электроника")).toBeInTheDocument();
    expect(screen.getAllByText("Вещь")).toHaveLength(1);
    expect(screen.getByLabelText("Релевантность 43%")).toBeInTheDocument();
    expect(screen.getByText("Помещение")).toBeInTheDocument();
    expect(screen.getByText("1 этаж. Кухня")).toBeInTheDocument();
    expect(screen.queryByText("Совпадение по фото")).not.toBeInTheDocument();
    expect(screen.queryByText("Лучшая найденная карточка")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Открыть/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/items/42");
  });
});
