import {
  RANKING_WHY_FALLBACK_COPY,
  rankingWhyMode,
  type RankingWhyMode,
} from "./results-ranking-thresholds";

const ALIGNMENT_TRAIT =
  /^(.+?)\s+선호\([+-]?\d+(?:\.\d+)?\).+정합 기여가 큽니다\(([+-]?\d+(?:\.\d+)?)\)\.?$/;

function alignmentContribution(line: string): number | null {
  const m = line.match(ALIGNMENT_TRAIT);
  if (!m) return null;
  return Math.abs(Number.parseFloat(m[2] ?? ""));
}

function humanizeAlignmentBullet(line: string): string | null {
  const m = line.match(ALIGNMENT_TRAIT);
  if (!m) return null;
  const axis = m[1]!.trim();
  return `선호하는 ${axis}와 가장 잘 맞아요`;
}

const SECOND_BULLET_BY_AXIS: Record<string, string> = {
  "매끈한 타건감": "2순위보다 타이핑 감이 더 안정적이에요",
  "차분한 감쇠음": "2순위보다 소리 톤이 더 차분해요",
  "푹신한 바닥감": "2순위보다 바닥감이 더 부드러워요",
  "가벼운 타건": "2순위보다 가볍게 쳐도 안정적이에요",
};

function secondRankingBullet(topAxis: string, secondAxis?: string): string {
  if (secondAxis && SECOND_BULLET_BY_AXIS[secondAxis]) {
    return SECOND_BULLET_BY_AXIS[secondAxis]!;
  }
  if (SECOND_BULLET_BY_AXIS[topAxis]) {
    return "2순위보다 취향 정합이 더 높아요";
  }
  return "2순위보다 타이핑 감이 더 안정적이에요";
}

export type EvidenceRankingWhyModel = {
  mode: RankingWhyMode;
  title?: string;
  body?: string;
  bullets: string[];
};

export function formatEvidenceRankingWhy(args: {
  domain: string;
  pickScore: number;
  runnerUpScore: number | undefined;
  whyTraits?: string[];
  mvpOnly?: boolean;
}): EvidenceRankingWhyModel {
  const mode = rankingWhyMode({
    domain: args.domain,
    pickScore: args.pickScore,
    runnerUpScore: args.runnerUpScore,
    mvpOnly: args.mvpOnly ?? true,
  });

  if (mode === "hidden") {
    return { mode, bullets: [] };
  }

  if (mode === "fallback") {
    return {
      mode,
      title: RANKING_WHY_FALLBACK_COPY.title,
      body: RANKING_WHY_FALLBACK_COPY.body,
      bullets: [],
    };
  }

  const ranked = (args.whyTraits ?? [])
    .map((line) => ({ line, contribution: alignmentContribution(line) }))
    .filter((row): row is { line: string; contribution: number } => row.contribution !== null)
    .sort((a, b) => b.contribution - a.contribution);

  const top = ranked[0];
  const second = ranked[1];
  const bullets: string[] = [];

  if (top) {
    const first = humanizeAlignmentBullet(top.line);
    if (first) bullets.push(first);
  }

  if (bullets.length < 2) {
    const topAxis = top ? (top.line.match(ALIGNMENT_TRAIT)?.[1]?.trim() ?? "") : "";
    const secondAxis = second ? (second.line.match(ALIGNMENT_TRAIT)?.[1]?.trim() ?? "") : undefined;
    bullets.push(secondRankingBullet(topAxis, secondAxis));
  } else if (second) {
    const secondBullet = humanizeAlignmentBullet(second.line);
    if (secondBullet) bullets.push(secondBullet.replace("가장 잘 맞아요", "면도 잘 맞아요"));
  }

  if (bullets.length === 0) {
    bullets.push("취향에 맞는 조합으로 상위에 올랐어요", "2순위보다 타이핑 감이 더 안정적이에요");
  }

  return {
    mode,
    bullets: bullets.slice(0, 2),
  };
}
