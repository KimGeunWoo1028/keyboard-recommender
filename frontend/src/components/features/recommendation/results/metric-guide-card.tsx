export function MetricGuideCard({ embedded = false }: { embedded?: boolean }) {
  const body = (
    <div className="space-y-2 text-sm leading-relaxed text-ca-on-surface-variant">
      <p>
        <span className="font-medium text-ca-on-surface">순위 점수:</span> 같은 카테고리 안에서의 상대 점수입니다.
        대체로 -1~1이며, 높을수록 취향에 가깝습니다.
      </p>
      <p>
        <span className="font-medium text-ca-on-surface">설문 일치도:</span> 설문 답이 서로 얼마나 일관되는지,
        그리고 추천이 그에 얼마나 잘 맞는지를 보여 줍니다. 「높은 편·보통·참고용」으로 읽으면 됩니다.
        품질·구매 만족 보증이나 실험실 측정·정확도 %가 아닙니다.
      </p>
      <p>
        <span className="font-medium text-ca-on-surface">추천 일치도:</span> 이번 추천 전체의 종합 일치도입니다.
      </p>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <details className="group rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ca-on-surface [&::-webkit-details-marker]:hidden sm:px-5">
        <span className="flex items-center justify-between gap-2">
          <span>지표 해석 가이드</span>
          <span className="text-xs font-normal text-ca-on-surface-variant group-open:hidden">펼치기</span>
          <span className="hidden text-xs font-normal text-ca-on-surface-variant group-open:inline">접기</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-ca-outline-variant/35 px-4 py-4 sm:px-5">
        <p className="text-sm text-ca-on-surface-variant">결과 화면의 숫자는 아래 기준으로 읽으면 됩니다.</p>
        {body}
      </div>
    </details>
  );
}
