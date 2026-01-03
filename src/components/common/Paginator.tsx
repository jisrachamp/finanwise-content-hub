import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pages: number; // total de páginas
  total?: number;
  limit?: number;
  onPageChange: (p: number) => void;
  disabled?: boolean;
  siblingCount?: number; // cuántas páginas a cada lado
};

function range(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

/**
 * Devuelve algo como: [1, "…", 5, 6, 7, "…", 20]
 */
function getPaginationItems(page: number, pages: number, siblingCount: number) {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current +- siblings, +2 dots
  if (pages <= totalNumbers) return range(1, pages);

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, pages);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < pages - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = range(1, 3 + siblingCount * 2);
    return [...leftRange, "…", pages];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = range(pages - (3 + siblingCount * 2) + 1, pages);
    return [1, "…", ...rightRange];
  }

  // ambos dots
  const middleRange = range(leftSibling, rightSibling);
  return [1, "…", ...middleRange, "…", pages];
}

export default function Paginator({
  page,
  pages,
  total,
  limit,
  onPageChange,
  disabled,
  siblingCount = 1,
}: Props) {
  const safePages = Math.max(1, pages || 1);
  const safePage = Math.min(Math.max(1, page), safePages);

  const items = React.useMemo(
    () => getPaginationItems(safePage, safePages, siblingCount),
    [safePage, safePages, siblingCount]
  );

  const canPrev = safePage > 1;
  const canNext = safePage < safePages;

  const startIdx = total && limit ? (safePage - 1) * limit + 1 : undefined;
  const endIdx = total && limit ? Math.min(safePage * limit, total) : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        {typeof total === "number" && typeof startIdx === "number" && typeof endIdx === "number" ? (
          <>
            Mostrando <span className="font-medium text-foreground">{startIdx}</span>–{" "}
            <span className="font-medium text-foreground">{endIdx}</span> de{" "}
            <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>
            Página <span className="font-medium text-foreground">{safePage}</span> /{" "}
            <span className="font-medium text-foreground">{safePages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safePage - 1)}
          disabled={disabled || !canPrev}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {items.map((it, idx) =>
          it === "…" ? (
            <Button key={`dots-${idx}`} variant="ghost" size="icon" disabled className="cursor-default">
              …
            </Button>
          ) : (
            <Button
              key={`p-${it}`}
              variant={it === safePage ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(it)}
              disabled={disabled}
            >
              {it}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(safePage + 1)}
          disabled={disabled || !canNext}
          aria-label="Siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
