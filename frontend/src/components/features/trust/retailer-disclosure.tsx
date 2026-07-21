import { cn } from "@/lib/utils";

/** Product trust copy: single-retailer / Swagkey linkage (P03). */
export function RetailerDisclosure({ className }: { className?: string }) {
  return (
    <div className={cn("break-keep text-sm leading-relaxed text-ca-on-surface-variant", className)}>
      구매 링크는 스웨그키(Swagkey) 판매 페이지로 연결됩니다. 추천·카탈로그는 스웨그키에서 판매 중인
      제품을 기준으로 구성합니다.
    </div>
  );
}
