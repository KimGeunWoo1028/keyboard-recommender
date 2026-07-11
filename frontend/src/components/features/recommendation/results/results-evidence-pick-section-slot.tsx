import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Subgrid row slots shared by sibling pick cards in the evidence grid (header + 5 body slots). */
export const EVIDENCE_PICK_SUBGRID_ROWS = 6;

type EvidencePickSectionSlotProps = {
  children?: ReactNode;
  stretch?: boolean;
};

/** Always rendered so paired cards share row tracks (md+ subgrid). */
export function EvidencePickSectionSlot({ children, stretch = false }: EvidencePickSectionSlotProps) {
  return <div className={cn("min-h-0", stretch && "h-full")}>{children}</div>;
}
