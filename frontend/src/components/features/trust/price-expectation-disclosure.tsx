import { cn } from "@/lib/utils";

/** Product trust copy: price/stock live on retailer (P04). */
export function PriceExpectationDisclosure({ className }: { className?: string }) {
  return (
    <div className={cn("break-keep text-sm leading-relaxed text-ca-on-surface-variant", className)}>
      가격·재고·배송 정보는 스웨그키 매장 페이지 기준이며 수시로 바뀔 수 있습니다. 구매 전 매장에서
      최종 확인해 주세요.
    </div>
  );
}
