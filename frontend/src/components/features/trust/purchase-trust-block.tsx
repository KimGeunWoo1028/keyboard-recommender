import { cn } from "@/lib/utils";

import { LinkHealthDisclosure } from "@/components/features/trust/link-health-disclosure";
import { PriceExpectationDisclosure } from "@/components/features/trust/price-expectation-disclosure";
import { RecommendationDisclaimer } from "@/components/features/trust/recommendation-disclaimer";
import { RetailerDisclosure } from "@/components/features/trust/retailer-disclosure";

/**
 * Purchase/trust copy for results: always-visible price/stock line + foldable detail.
 * Keeps legal meaning; only changes information architecture (L10).
 */
export function PurchaseTrustBlock({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)} data-testid="e2e-purchase-trust">
      <PriceExpectationDisclosure />
      <details className="group rounded-lg border border-ca-outline-variant/35 bg-ca-surface-container/30">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-ca-on-surface [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>추천 기준과 구매 전 확인사항</span>
            <span className="text-xs font-normal text-ca-on-surface-variant group-open:hidden">펼치기</span>
            <span className="hidden text-xs font-normal text-ca-on-surface-variant group-open:inline">접기</span>
          </span>
        </summary>
        <div className="space-y-2 border-t border-ca-outline-variant/35 px-3 py-3">
          <RecommendationDisclaimer />
          <RetailerDisclosure />
          <LinkHealthDisclosure />
        </div>
      </details>
    </div>
  );
}
