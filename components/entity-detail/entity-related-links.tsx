import Link from "next/link";
import { cn } from "@/lib/utils";

interface RelatedLink {
  href: string;
  label: string;
}

interface EntityRelatedLinksProps {
  links: RelatedLink[];
}

const linkButtonClass =
  "inline-flex h-8 items-center justify-center gap-1 rounded-4xl border border-border bg-input/30 px-3 text-sm font-medium transition-colors hover:bg-input/50 hover:text-foreground";

export function EntityRelatedLinks({ links }: EntityRelatedLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(linkButtonClass)}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
