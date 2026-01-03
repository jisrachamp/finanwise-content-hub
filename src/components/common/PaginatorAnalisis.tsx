import { Button } from "@/components/ui/button";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

type Props = {
  page: number;
  pages: number;
  total?: number;
  limit: number;
  disabled?: boolean;
  siblingCount?: number;
  onPageChange: (p: number) => void;
};

export default function Paginator({
  page,
  pages,
  total,
  limit,
  disabled,
  siblingCount = 1,
  onPageChange,
}: Props) {
  const p = clamp(page, 1, Math.max(1, pages));
  const maxPages = Math.max(1, pages);

  const left = Math.max(1, p - siblingCount);
  const right = Math.min(maxPages, p + siblingCount);

  const showLeftDots = left > 2;
  const showRightDots = right < maxPages - 1;

  const numbers = [
    1,
    ...(showLeftDots ? [] : range(2, left - 1)),
    ...range(left, right).filter((x) => x !== 1 && x !== maxPages),
    ...(showRightDots ? [] : range(right + 1, maxPages - 1)),
    ...(maxPages > 1 ? [maxPages] : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const start = total !== undefined ? (p - 1) * limit + 1 : undefined;
  const end = total !== undefined ? Math.min(p * limit, total) : undefined;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        {total !== undefined ? (
          <>
            Mostrando <span className="font-medium text-foreground">{start}</span>–
            <span className="font-medium text-foreground">{end}</span> de{" "}
            <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>
            Página <span className="font-medium text-foreground">{p}</span> /{" "}
            <span className="font-medium text-foreground">{maxPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || p <= 1}
          onClick={() => onPageChange(1)}
        >
          « Primero
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || p <= 1}
          onClick={() => onPageChange(p - 1)}
        >
          Anterior
        </Button>

        {showLeftDots && <span className="px-1 text-muted-foreground">…</span>}

        {numbers.map((n) => (
          <Button
            key={n}
            variant={n === p ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => onPageChange(n)}
          >
            {n}
          </Button>
        ))}

        {showRightDots && <span className="px-1 text-muted-foreground">…</span>}

        <Button
          variant="outline"
          size="sm"
          disabled={disabled || p >= maxPages}
          onClick={() => onPageChange(p + 1)}
        >
          Siguiente
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || p >= maxPages}
          onClick={() => onPageChange(maxPages)}
        >
          Último »
        </Button>
      </div>
    </div>
  );
}
