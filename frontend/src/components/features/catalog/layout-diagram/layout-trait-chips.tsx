import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

type Chip = { label: string };

function layoutSizeLabel(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const map: Record<string, string> = {
    "60": "책상 점유 · 작음",
    "65": "책상 점유 · 작음",
    "75": "책상 점유 · 중간",
    "80_tkl": "책상 점유 · 중간",
    full: "책상 점유 · 큼",
    alice: "책상 점유 · 중간",
    split: "책상 점유 · 작음",
  };
  return map[value] ?? null;
}

function typingDensityLabel(raw: unknown): string | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n <= 4) return "키 밀도 · 낮음";
  if (n <= 7) return "키 밀도 · 중간";
  return "키 밀도 · 높음";
}

export function deriveLayoutTraitChips(metadata: Record<string, unknown>, limit = 5): Chip[] {
  const chips: Chip[] = [];

  const size = layoutSizeLabel(metadata.layout_size);
  if (size) chips.push({ label: size });

  if (metadata.has_function_row === true) chips.push({ label: "Function row · 있음" });
  else if (metadata.has_function_row === false) chips.push({ label: "Function row · 없음" });

  if (metadata.has_arrow_cluster === true) chips.push({ label: "방향키 · 분리" });
  else if (metadata.has_arrow_cluster === false) chips.push({ label: "방향키 · 레이어" });

  if (metadata.is_exploded === true) chips.push({ label: "익스플로디드 갭" });

  const density = typingDensityLabel(metadata.typing_density);
  if (density) chips.push({ label: density });

  if (metadata.layout_size === "split") chips.push({ label: "마우스 공간 · 넓음" });
  if (metadata.layout_size === "full") chips.push({ label: "숫자 입력 · 유리" });
  if (metadata.layout_size === "60" || metadata.layout_size === "65") {
    chips.push({ label: "휴대성 · 높음" });
  }

  const seen = new Set<string>();
  return chips.filter((chip) => {
    if (seen.has(chip.label)) return false;
    seen.add(chip.label);
    return true;
  }).slice(0, limit);
}

type Props = {
  metadata: Record<string, unknown>;
  className?: string;
  limit?: number;
  compact?: boolean;
};

export function LayoutTraitChips({ metadata, className, limit = 5, compact = false }: Props) {
  const chips = deriveLayoutTraitChips(metadata, limit);
  if (chips.length === 0) return null;

  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <li key={chip.label}>
            <Badge
              className={cn(
                "border-ca-outline-variant/50 bg-ca-surface-container/40 font-normal text-ca-on-surface-variant",
                compact && "px-1.5 py-0 text-[10px] leading-tight",
              )}
            >
              {chip.label}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
