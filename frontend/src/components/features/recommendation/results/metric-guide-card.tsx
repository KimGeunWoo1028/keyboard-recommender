import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricGuideCard({ embedded = false }: { embedded?: boolean }) {
  return (
    <Card className={embedded ? "border-0 bg-transparent shadow-none" : "border-dashed border-primary/25 bg-primary/5"}>
      {!embedded ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">지표 해석 가이드</CardTitle>
          <CardDescription>
            결과 화면의 숫자는 아래 기준으로 해석하면 빠르게 이해할 수 있어요.
          </CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={embedded ? "space-y-2 px-0 pb-0 pt-0 text-xs leading-relaxed text-muted-foreground sm:text-sm" : "space-y-2 text-xs leading-relaxed text-muted-foreground sm:text-sm"}>
        <p>
          <span className="font-semibold text-foreground">순위 점수 / 점수:</span> 같은 카테고리(스위치끼리, 플레이트끼리) 안에서의 상대 점수입니다.
          기준 범위는 대체로 <span className="font-mono text-foreground">-1 ~ 1</span>이며, 값이 높을수록 현재 취향에 더 가깝습니다.
          (인기도/보정 가중치로 실측값이 범위를 약간 벗어날 수 있습니다.)
        </p>
        <p>
          <span className="font-semibold text-foreground">유사도 신뢰도(%):</span> 추천 근거가 얼마나 안정적으로 맞는지 보여줍니다. 보통{" "}
          <span className="font-mono text-foreground">70%+</span>면 비교적 명확,{" "}
          <span className="font-mono text-foreground">50%대</span>는 취향 경계 구간으로 보면 됩니다. 범위는{" "}
          <span className="font-mono text-foreground">0 ~ 100%</span>입니다.
        </p>
        <p>
          <span className="font-semibold text-foreground">추천 일치도(%):</span> 이번 추천 전체의 종합 일치도입니다. 범위는{" "}
          <span className="font-mono text-foreground">0 ~ 100%</span>이며, 낮게 나오면 추가 질문(정교화)을 통해 정확도를 높일 수 있어요.
        </p>
        <p>
          <span className="font-semibold text-foreground">유효 페널티:</span> 호환성 보정 강도입니다.{" "}
          범위는 <span className="font-mono text-foreground">0 ~ 0.95</span>이며,{" "}
          <span className="font-mono text-foreground">0</span>에 가까울수록 충돌이 적고 값이 커질수록 주의할 조합 요소가 많다는 뜻입니다.
        </p>
        <p>
          <span className="font-semibold text-foreground">성향 점수(세부/6축):</span> 각 축에서의 선호 강도입니다. 양수는 해당 성향 선호, 음수는 반대 성향을 의미합니다.
          절대값이 클수록 성향이 뚜렷합니다.
        </p>
      </CardContent>
    </Card>
  );
}
