/** Engine audit / ops notes from API `build.highlights` — not user-facing copy. */
const NON_USER_HIGHLIGHT =
  /추천 엔진|v2\s*[—-]|0\.\d{3}|주요 성향 축|다양성 재정렬|추천 신뢰도|^\s*(?:스위치|플레이트|폼|레이아웃|케이스|키캡)\s+0\.|^호환성 (?:요약|보정):|^운영 자동화 메모:|^안정 복구 모드|soft compatibility penalty|operational automation/i;

export function formatBuildHighlights(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !NON_USER_HIGHLIGHT.test(line))
    .slice(0, 2);
}
