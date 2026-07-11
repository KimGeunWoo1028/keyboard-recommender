import { Badge } from "@/components/ui/badge";
import { layoutSizeShortLabel, normalizeLayoutSizes } from "@/lib/layout-size";
import { cn } from "@/lib/utils";

type Props = {
  layoutSize?: string | null;
  compatibleLayoutSizes?: string[] | null;
  className?: string;
  limit?: number;
  compact?: boolean;
};

export function CompatibleLayoutChips({
  layoutSize,
  compatibleLayoutSizes,
  className,
  limit = 4,
  compact = false,
}: Props) {
  const sizes = normalizeLayoutSizes(layoutSize, compatibleLayoutSizes).slice(0, limit);
  if (sizes.length === 0) return null;

  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-1.5">
        {sizes.map((size) => (
          <li key={size}>
            <Badge
              className={cn(
                "border-ca-outline-variant/50 bg-ca-surface-container/40 font-normal text-ca-on-surface-variant",
                compact && "px-1.5 py-0 text-[10px] leading-tight",
              )}
            >
              {layoutSizeShortLabel(size)}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
