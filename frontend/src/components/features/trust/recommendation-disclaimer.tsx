import Link from "next/link";

import { cn } from "@/lib/utils";

/** Product trust copy: recommendation is reference; catalog may lag retailer (P18). */
export function RecommendationDisclaimer({ className }: { className?: string }) {
  return (
    <div className={cn("break-keep text-sm leading-relaxed text-ca-on-surface-variant", className)}>
      추천은 설문 응답과 카탈로그 특성을 바탕으로 한 참고용 제안입니다. 실제 타건감·호환성·품질은
      달라질 수 있으며, 제품 정보·이미지는 판매처 공개 자료를 참고해 구성될 수 있습니다. 자세한
      기준은{" "}
      <Link href="/terms" className="underline underline-offset-2 hover:text-ca-on-surface">
        이용약관
      </Link>
      을 확인해 주세요.
    </div>
  );
}
