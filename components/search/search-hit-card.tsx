"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Container, DoorOpen, LayoutGrid, Package, Sofa } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchHit, SearchLocationLine, SearchMode } from "@/lib/search/types";
import { cn } from "@/lib/utils";

const ICONS = {
  item: Package,
  place: LayoutGrid,
  container: Container,
  room: DoorOpen,
  building: Building2,
  furniture: Sofa,
} as const;

const ENTITY_LABELS = {
  item: "Вещь",
  place: "Место",
  container: "Контейнер",
  room: "Помещение",
  building: "Здание",
  furniture: "Мебель",
} as const;

const LOCATION_VALUE_CLASSNAME = "truncate text-sm font-medium text-foreground/90";
const SCORE_RING_RADIUS = 18;
const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * SCORE_RING_RADIUS;

function getScoreLabel(score?: number | null): string | null {
  if (typeof score !== "number") {
    return null;
  }

  return `${Math.round(score * 100)}%`;
}

function getScorePercent(score?: number | null): number | null {
  if (typeof score !== "number") {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function renderLocationLine(line: SearchLocationLine, entityId: number) {
  const Icon = ICONS[line.key];

  return (
    <div key={`${entityId}-${line.key}`} className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/80" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
          {line.label}
        </p>
        <p className={LOCATION_VALUE_CLASSNAME}>{line.value}</p>
      </div>
    </div>
  );
}

export function SearchHitCard({ hit, mode = "text" }: { hit: SearchHit; mode?: SearchMode }) {
  const Icon = ICONS[hit.entityType];
  const entityLabel = ENTITY_LABELS[hit.entityType];
  const scoreLabel = getScoreLabel(hit.match?.score);
  const scorePercent = getScorePercent(hit.match?.score);
  const visibleLocationLines = hit.locationLines.slice(0, 2);
  const scoreStrokeOffset =
    scorePercent == null
      ? SCORE_RING_CIRCUMFERENCE
      : SCORE_RING_CIRCUMFERENCE - (scorePercent / 100) * SCORE_RING_CIRCUMFERENCE;

  if (mode === "image") {
    return (
      <Link href={hit.href} className="group block h-full">
        <Card className="h-full flex flex-col overflow-hidden transition-all hover:bg-muted/30 hover:shadow-md">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted">
            {hit.preview?.imageUrl ? (
              <>
                <Image
                  src={hit.preview.imageUrl}
                  alt={hit.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-background/50">
                <Icon className="h-10 w-10 text-muted-foreground/60 transition-transform duration-300 group-hover:scale-110" />
              </div>
            )}
            
            <div className="absolute left-2 top-2">
              <Badge variant="secondary" className="rounded-full shadow-sm bg-background/90 backdrop-blur">
                {entityLabel}
              </Badge>
            </div>
            
            {scoreLabel && scorePercent != null ? (
              <div className="absolute right-2 top-2">
                <Badge variant="default" className="rounded-full shadow-sm bg-primary/90 text-primary-foreground backdrop-blur">
                  {scoreLabel}
                </Badge>
              </div>
            ) : null}
          </div>

          <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
            <CardTitle className="line-clamp-2 text-base font-semibold transition-colors group-hover:text-primary">
              {hit.title}
            </CardTitle>
            {hit.subtitle && (
              <p className="mt-1 line-clamp-1 text-xs font-medium text-muted-foreground">
                {hit.subtitle}
              </p>
            )}
            
            {visibleLocationLines.length > 0 && (
              <div className="mt-auto pt-3">
                <div className="flex flex-col gap-1.5 overflow-hidden border-t pt-3 border-border/50">
                  {visibleLocationLines.map((line) => {
                    const LineIcon = ICONS[line.key];
                    return (
                      <div key={`${hit.entityId}-${line.key}`} className="flex items-center gap-1.5 min-w-0 text-muted-foreground/80">
                        <LineIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-xs font-medium text-foreground/80">{line.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={hit.href} className="group block h-full">
      <Card className="h-full overflow-hidden">
        <CardContent className="h-full">
          <div className="flex h-full min-w-0 items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-28">
              {hit.preview?.imageUrl ? (
                <>
                  <Image
                    src={hit.preview.imageUrl}
                    alt={hit.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(min-width: 640px) 112px, 96px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-background">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm backdrop-blur">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              )}

              <div className="absolute left-2.5 top-2.5">
                <Badge variant="secondary" className="rounded-full bg-background/90 backdrop-blur">
                  {entityLabel}
                </Badge>
              </div>
            </div>

            <div className="flex h-full min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <CardTitle className="line-clamp-2 text-lg font-semibold sm:text-xl">
                    {hit.title}
                  </CardTitle>
                  {hit.subtitle ? (
                    <p className="line-clamp-1 text-sm font-medium text-foreground/65">
                      {hit.subtitle}
                    </p>
                  ) : null}
                </div>

                {scoreLabel && scorePercent != null ? (
                  <div
                    title={`Релевантность ${scoreLabel}`}
                    aria-label={`Релевантность ${scoreLabel}`}
                    className="relative flex size-5 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
                  >
                    <svg
                      viewBox="0 0 44 44"
                      className="-rotate-90 size-5"
                      aria-hidden="true"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r={SCORE_RING_RADIUS}
                        fill="none"
                        className="stroke-border/70"
                        strokeWidth="5"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={SCORE_RING_RADIUS}
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={SCORE_RING_CIRCUMFERENCE}
                        strokeDashoffset={scoreStrokeOffset}
                      />
                    </svg>
                  </div>
                ) : null}
              </div>

              {visibleLocationLines.length > 0 ? (
                <div
                  className={cn(
                    "mt-4 grid gap-x-4 gap-y-2 overflow-hidden",
                    visibleLocationLines.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {visibleLocationLines.map((line) => renderLocationLine(line, hit.entityId))}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
