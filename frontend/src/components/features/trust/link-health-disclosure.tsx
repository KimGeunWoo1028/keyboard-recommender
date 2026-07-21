import Link from "next/link";

import { cn } from "@/lib/utils";

/** Product trust copy: single-retailer SPOF / link freshness (P16). */
export function LinkHealthDisclosure({ className }: { className?: string }) {
  return (
    <div className={cn("break-keep text-sm leading-relaxed text-ca-on-surface-variant", className)}>
      판매 페이지가 바뀌거나 품절되면 링크가 열리지 않거나 다른 상품으로 이어질 수 있습니다. 문제가
      보이면{" "}
      <Link href="/contact" className="underline underline-offset-2 hover:text-ca-on-surface">
        문의
      </Link>
      로 알려 주세요.
    </div>
  );
}
