import { traitAxisDisplayLabel } from "@/lib/keyboard-terminology";

export { traitAxisDisplayLabel };

export function beginnerFriendlyWhyLine(line: string): string {
  const m = line.match(
    /^(.+?) 축에서 사용자 성향\(([+-]?\d+(?:\.\d+)?)\)과 잘 맞아, 해당 방향의 일치도가 높습니다\(([+-]?\d+(?:\.\d+)?)\)\.$/,
  );
  if (!m) return line;
  const [, axisLabel, userScore, contribution] = m;
  return `${axisLabel} 취향이 잘 맞습니다.\n(내 성향 ${userScore}, 점수 기여 ${contribution})`;
}

export function beginnerFriendlyTradeoffLine(line: string): string {
  const compromise = line.match(
    /^(.+?) 축은 타협이 있습니다\. 선호\([+-]?\d+(?:\.\d+)?\).+기여가 낮아집니다\(([+-]?\d+(?:\.\d+)?)\)\.?$/,
  );
  if (compromise) {
    const [, axisLabel, contribution] = compromise;
    return `${axisLabel} 쪽은 상대적으로 덜 맞습니다.\n(점수 기여 ${contribution})`;
  }

  const m = line.match(
    /^(.+?) 축은 트레이드오프가 있습니다\. 이 축의 가중 일치도가 상대적으로 낮아\(([+-]?\d+(?:\.\d+)?)\), 핵심 선호 축 대비 체감이 덜 맞을 수 있습니다\.$/,
  );
  if (!m) return line;
  const [, axisLabel, contribution] = m;
  return `${axisLabel} 쪽은 상대적으로 덜 맞습니다.\n(점수 기여 ${contribution})`;
}

export function beginnerFriendlyExplanation(text: string): string {
  const prefix = "가중 기여 축 요약:";
  if (!text.startsWith(prefix)) return text;
  const raw = text.slice(prefix.length).trim();
  const parts = raw
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const mm = p.match(/^([a-z_]+)\s+\(([+-]?\d+(?:\.\d+)?)\)\.?$/i);
      if (!mm) return p;
      const [, axisId, score] = mm;
      return `${traitAxisDisplayLabel(axisId)} ${score}`;
    });
  if (!parts.length) return text;
  return `점수에 크게 영향을 준 항목: ${parts.join(" · ")}`;
}

export function alternativeTagline(idx: number): string {
  if (idx === 0) return "더 부드러운 대안";
  if (idx === 1) return "더 또렷한 사운드 대안";
  return "대안 후보";
}

/** Catalog-style blurb for overview alternative cards (not engine summary). */
export function overviewAlternativeDescription(
  description: string | undefined,
  summary: string,
  itemName?: string,
): string {
  const catalog = (description ?? "").trim();
  if (catalog) return catalog;
  return extractSpecBlurbFromSummary(summary, itemName);
}

const GENERIC_BUILD_DESCRIPTION_PATTERNS = [
  /보강판 특성에 따라 타건 강성/,
  /사용 취향에 맞춰 조정하는 핵심 요소입니다\.?$/,
  /폭넓게 선택할 수 있는 타입/,
  /세팅 방향에 맞춰 유연하게 조합하기 좋습니다/,
  /배열 크기와 키 배치 밀도에 따라/,
  /키캡은 프로필·재질·각인 방식에 따라/,
  /상판 파츠·하우징은 기존 빌드에 맞춰/,
];

export function isGenericBuildPartDescription(description: string): boolean {
  const text = description.trim();
  if (!text) return true;
  return GENERIC_BUILD_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Overview 6-axis blurb: catalog description, or spec line when empty/generic. */
export function overviewBuildPartDescription(
  catalogDescription: string,
  pickSummary: string | undefined,
  itemName?: string,
): string {
  const catalog = catalogDescription.trim();
  if (catalog && !isGenericBuildPartDescription(catalog)) {
    return catalog;
  }
  const spec = extractSpecBlurbFromSummary(pickSummary ?? "", itemName);
  return spec || catalog;
}

function extractSpecBlurbFromSummary(summary: string, itemName?: string): string {
  let blurb = summary.trim();
  if (!blurb) return "";

  const name = (itemName ?? "").trim();
  if (name) {
    for (const prefix of [`${name}은(는) `, `${name}는 `, `${name}은 `]) {
      if (blurb.startsWith(prefix)) {
        blurb = blurb.slice(prefix.length);
        break;
      }
    }
  }

  const andIdx = blurb.indexOf(" 그리고 ");
  if (andIdx !== -1) blurb = blurb.slice(0, andIdx);

  blurb = blurb
    .replace(/\s*성향 정합이 높아 상위 추천되었습니다\.?$/, "")
    .replace(/\s*축 정합이 높아 상위 추천되었습니다\.?$/, "")
    .replace(/\s*상위 추천되었습니다\.?$/, "")
    .replace(/\s*가장 안정적인 선택입니다\.?$/, "")
    .trim();

  if (/추천되었습니다\.?$/.test(blurb) || /정합/.test(blurb)) return "";

  return blurb;
}

const ENGINE_WHY_TRAIT_AUDIT =
  /선호\([+-]?\d|정합 기여|축에서 사용자 성향|후보 특성|트레이드오프|타협이 있습니다|가중 일치도|점수 기여|상위 추천되었/;

/** Engine audit lines — hide from user-facing Evidence details. */
export function isEvidenceEngineAuditLine(line: string): boolean {
  return ENGINE_WHY_TRAIT_AUDIT.test(line.trim());
}

/** Collapsed «제품 특징» — spec / feel lines only, no engine scores (≤3). */
export function formatEvidenceDetailLines(
  whyTraits: string[] | undefined,
  whyLine?: string,
): string[] {
  const skip = (whyLine ?? "").trim();
  return (whyTraits ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isEvidenceEngineAuditLine(line))
    .filter((line) => !skip || line !== skip)
    .slice(0, 3);
}

const EVIDENCE_ALIGNMENT_TRAIT =
  /^(.+?)\s+선호\([+-]?\d+(?:\.\d+)?\).+정합 기여가 큽니다\(([+-]?\d+(?:\.\d+)?)\)\.?$/;

/** Prefer domain-relevant trait axes so six pick cards do not repeat the same phrase. */
const DOMAIN_AXIS_PRIORITY: Record<string, string[]> = {
  switch: [
    "차분한 소리",
    "차분한 감쇠음",
    "매끈한 타건감",
    "묵직한 타격감",
    "가벼운 타건",
    "가벼운 입력",
    "뚜렷한 구분감",
    "구분감 있는 키감",
    "또렷한 고음",
    "묵직한 저음",
    "깊은 저음",
  ],
  plate: ["부드러운 바닥감", "푹신한 바닥감", "묵직한 타격감", "또렷한 고음", "차분한 소리", "차분한 감쇠음", "유연한 키감"],
  foam: ["차분한 소리", "차분한 감쇠음", "깊은 저음", "부드러운 바닥감", "푹신한 바닥감", "울림"],
  layout: ["타이핑", "밀도", "컴팩트", "배열", "묵직한 타격감", "차분한 소리", "차분한 감쇠음"],
  case: ["차분한 소리", "차분한 감쇠음", "깊은 저음", "묵직한", "울림", "소리"],
  keycap: ["차분한 소리", "차분한 감쇠음", "또렷한 고음", "매끈한 타건감", "소리"],
};

type ParsedAlignment = { axisLabel: string; contribution: number; line: string };

export function parseEvidenceAlignments(whyTraits: string[] | undefined): ParsedAlignment[] {
  return (whyTraits ?? [])
    .map((line) => {
      const m = line.trim().match(EVIDENCE_ALIGNMENT_TRAIT);
      if (!m) return null;
      return {
        axisLabel: m[1]!.trim(),
        contribution: Math.abs(Number.parseFloat(m[2] ?? "")),
        line: line.trim(),
      };
    })
    .filter((row): row is ParsedAlignment => row !== null)
    .sort((a, b) => b.contribution - a.contribution);
}

function normalizeEvidenceDomain(domain?: string): string {
  const d = (domain ?? "").trim().toLowerCase();
  if (d === "switches") return "switch";
  if (d === "plates") return "plate";
  if (d === "foams") return "foam";
  if (d === "layouts") return "layout";
  if (d === "cases") return "case";
  if (d === "keycaps") return "keycap";
  return d;
}

export function pickDomainAlignmentAxis(alignments: ParsedAlignment[], domain?: string): string | null {
  if (alignments.length === 0) return null;
  const priorities = DOMAIN_AXIS_PRIORITY[normalizeEvidenceDomain(domain)] ?? [];
  let best: ParsedAlignment | null = null;
  let bestRank = Number.POSITIVE_INFINITY;

  for (const row of alignments) {
    const rank = priorities.findIndex(
      (needle) => row.axisLabel.includes(needle) || needle.includes(row.axisLabel),
    );
    if (rank === -1) continue;
    if (
      rank < bestRank ||
      (rank === bestRank && row.contribution > (best?.contribution ?? Number.NEGATIVE_INFINITY))
    ) {
      bestRank = rank;
      best = row;
    }
  }

  return (best ?? alignments[0])?.axisLabel ?? null;
}

function pickEvidenceSpecLines(whyTraits: string[] | undefined, excludeLines: Set<string>): string[] {
  return (whyTraits ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isEvidenceEngineAuditLine(line) && !excludeLines.has(line));
}

function buildDomainSpecFeelHook(domain: string, specText: string): string | null {
  if (domain === "switch") {
    if (/택타일|갈축|구분감/.test(specText)) return "중간에 구분감이 느껴지는 스위치예요";
    if (/리니어|매끈/i.test(specText)) return "처음부터 끝까지 매끈하게 눌리는 스위치예요";
    if (/저소음|무소음|silent/i.test(specText)) return "저소음 환경에 무난한 스위치예요";
    if (/클릭|청축/.test(specText)) return "또렷한 클릭감이 있는 스위치예요";
  }
  if (domain === "plate") {
    if (/FR4/i.test(specText)) return "FR4로 타건 강성과 소리 톤을 잡아줘요";
    if (/PC|폴리/i.test(specText)) return "유연한 PC 플레이트로 바닥감을 살려줘요";
    if (/알루|ALU|alumin/i.test(specText)) return "단단한 알루미늄 플레이트로 타건을 또렷하게 해줘요";
  }
  if (domain === "foam") {
    if (/흡음|EPDM|PORON|IXPE|폼/i.test(specText)) return "울림과 공명을 줄여 소리를 다듬어 줘요";
    if (/하부|케이스|case/i.test(specText)) return "케이스 공명을 줄여 저음을 안정화해요";
  }
  if (domain === "layout") {
    if (/풀사이즈|Full-size|104|108/i.test(specText)) return "숫자 키패드를 포함한 풀사이즈 배열이에요";
    if (/75%/.test(specText)) return "F열을 유지하면서도 컴팩트한 75% 배열이에요";
    if (/65%/.test(specText)) return "화살표를 유지한 컴팩트 65% 배열이에요";
    if (/60%/.test(specText)) return "최소 구성의 60% 배열이에요";
    if (/TKL|tenkeyless/i.test(specText)) return "텐키리스로 마우스 공간을 확보해요";
  }
  if (domain === "case") {
    if (/알루|ALU|alumin/i.test(specText)) return "알루미늄 하우징으로 무게감과 울림을 잡아줘요";
    if (/가스켓|gasket/i.test(specText)) return "가스켓 구조로 타건감과 소음 밸런스에 유리해요";
    if (/PC|폴리/i.test(specText)) return "가벼운 PC 하우징으로 부담을 줄여줘요";
  }
  if (domain === "keycap") {
    if (/PBT/i.test(specText)) return "PBT 재질로 마모와 소음 변화가 적어요";
    if (/ABS/i.test(specText)) return "ABS 재질로 가벼운 타건감을 살려줘요";
    if (/염료|염료승화|더블샷/i.test(specText)) return "각인이 오래 유지되는 키캡이에요";
  }
  return null;
}

function domainDefaultFeelHook(domain: string): string {
  const domainDefault: Record<string, string> = {
    switch: "타건과 소리 균형이 이 조합에 맞아요",
    plate: "타건의 단단함과 소리 톤을 잡아주는 플레이트예요",
    foam: "울림을 줄이거나 다듬어 줘요",
    layout: "키 배열과 사용 동선이 맞아요",
    case: "케이스 울림·무게감이 조합에 맞아요",
    keycap: "키캡 소재·프로필이 소리 성향에 맞아요",
  };
  return domainDefault[domain] ?? "이 부품이 추천 조합에 잘 맞아요";
}

function buildEvidenceFeelHook(
  domain: string | undefined,
  axisLabel: string | null,
  whyTraits: string[] | undefined,
  options?: { preferDomainSpecific?: boolean },
): string {
  const specText = pickEvidenceSpecLines(whyTraits, new Set()).join(" ");
  const d = normalizeEvidenceDomain(domain);
  const axis = (axisLabel ?? "").trim();
  const preferDomainSpecific = options?.preferDomainSpecific === true;

  // Part-specific copy: domain/spec only — never reuse shared preference-axis phrases.
  if (preferDomainSpecific) {
    const domainSpecHook = buildDomainSpecFeelHook(d, specText);
    if (domainSpecHook) return domainSpecHook;

    const firstSpec = pickEvidenceSpecLines(whyTraits, new Set())[0];
    if (firstSpec) {
      const shortened = firstSpec.replace(/입니다\.?$/u, "").trim();
      if (shortened) return `${shortened} 특성이 이 조합에 맞아요`;
    }
    return domainDefaultFeelHook(d);
  }

  // Legacy combined why line: keep switch-type inference, then axis hooks.
  if (d === "switch") {
    const switchHook = buildDomainSpecFeelHook("switch", specText);
    if (switchHook) return switchHook;
  }

  const axisHooks: [string, string][] = [
    ["차분한 소리", "차분한 소리 톤을 내기 좋아요"],
    ["차분한 감쇠음", "차분한 소리 톤을 내기 좋아요"],
    ["매끈한 타건감", "매끈하고 안정적인 타건감이에요"],
    ["묵직한 타격감", "묵직하게 눌리는 타건이에요"],
    ["부드러운 바닥감", "부드러운 바닥감을 살려줘요"],
    ["푹신한 바닥감", "부드러운 바닥감을 살려줘요"],
    ["또렷한 고음", "고음이 비교적 또렷한 편이에요"],
    ["가벼운 타건", "가볍게 쳐도 안정적인 타건이에요"],
    ["가벼운 입력", "가볍게 쳐도 안정적인 타건이에요"],
    ["뚜렷한 구분감", "키 구분감이 잘 살아 있어요"],
    ["구분감 있는 키감", "키 구분감이 잘 살아 있어요"],
    ["깊은 저음", "묵직한 저음감을 살리기 좋아요"],
    ["묵직한 저음", "묵직한 저음감을 살리기 좋아요"],
  ];
  for (const [match, hook] of axisHooks) {
    if (axis.includes(match)) return hook;
  }

  return domainDefaultFeelHook(d);
}

function combineEvidenceWhyLine(axisLabel: string | null, feelHook: string): string {
  const hook = feelHook.replace(/\s+/g, " ").replace(/\.+$/u, "").trim();
  const axis = (axisLabel ?? "").trim();

  if (axis && hook) return `${axis} 취향에 맞게, ${hook}.`;
  if (axis) return `${axis} 취향이 잘 맞아요`;
  if (hook) return /[.!?]$/.test(hook) ? hook : `${hook}.`;
  return "";
}

/** Evidence pick — part-specific feel hook only (no shared preference axis phrase). */
export function formatEvidencePartWhyLine(
  summary: string | undefined,
  whyTraits: string[] | undefined,
  _itemName?: string,
  domain?: string,
): string {
  const alignments = parseEvidenceAlignments(whyTraits);
  const axisLabel = pickDomainAlignmentAxis(alignments, domain);
  const feelHook = buildEvidenceFeelHook(domain, axisLabel, whyTraits, {
    preferDomainSpecific: true,
  });
  const hook = feelHook.replace(/\s+/g, " ").replace(/\.+$/u, "").trim();
  if (hook) return /[.!?]$/.test(hook) ? hook : `${hook}.`;

  const trimmed = (summary ?? "").trim();
  if (!trimmed) return "";

  const withoutTail = trimmed
    .replace(/\s*그리고\s+.+상위 추천되었습니다\.?$/, "")
    .replace(/\s*성향 정합이 높아 상위 추천되었습니다\.?$/, "")
    .trim();

  return withoutTail.length > 0 ? withoutTail : trimmed;
}

/** Evidence pick — preference axis + short feel hook (spec lines stay in «제품 특징»). */
export function formatEvidenceWhyLine(
  summary: string | undefined,
  whyTraits: string[] | undefined,
  itemName?: string,
  domain?: string,
): string {
  const alignments = parseEvidenceAlignments(whyTraits);
  const axisLabel = pickDomainAlignmentAxis(alignments, domain);
  const feelHook = buildEvidenceFeelHook(domain, axisLabel, whyTraits);

  const combined = combineEvidenceWhyLine(axisLabel, feelHook);
  if (combined) return combined;

  const trimmed = (summary ?? "").trim();
  if (!trimmed) return "";

  const withoutTail = trimmed
    .replace(/\s*그리고\s+.+상위 추천되었습니다\.?$/, "")
    .replace(/\s*성향 정합이 높아 상위 추천되었습니다\.?$/, "")
    .trim();

  return withoutTail.length > 0 ? withoutTail : trimmed;
}

/** Evidence pick — single tradeoff line; null when none (do not render block). */
export function formatEvidenceTradeoff(tradeOffs: string[] | undefined): string | null {
  const first = (tradeOffs ?? [])
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("대안 "));
  if (!first) return null;
  return beginnerFriendlyTradeoffLine(first).split("\n")[0]?.trim() ?? first;
}

/** @deprecated Use formatEvidenceTradeoff */
export const formatEvidenceTradeoffLine = formatEvidenceTradeoff;

const DATASHEET_DOMAIN_SPEC: Record<string, string> = {
  switch: "SWITCH",
  plate: "PLATE",
  foam: "FOAM",
  layout: "LAYOUT",
  case: "CASE",
  keycap: "KEYCAP",
};

const DATASHEET_BRAND_SLUGS = [
  "gateron",
  "cherry",
  "ttc",
  "hmx",
  "kailh",
  "akko",
  "domikey",
  "keychron",
  "epomaker",
  "wekt",
  "owlab",
  "qwertykeys",
  "monokei",
  "tx",
  "durock",
] as const;

/** Uppercase spec ribbon for overview datasheet cards (domain + material/type hints). */
export function overviewDatasheetSpecLine(
  domain: string,
  whyTraits?: string[],
  summary?: string,
): string {
  const d = normalizeEvidenceDomain(domain);
  const domainLabel = DATASHEET_DOMAIN_SPEC[d] ?? d.toUpperCase();
  const specLines = formatEvidenceDetailLines(whyTraits);
  const combined = `${specLines.join(" ")} ${(summary ?? "").trim()}`;
  const subtypes: string[] = [];

  if (d === "switch") {
    if (/저소음|무소음|silent/i.test(combined)) subtypes.push("SILENT");
    if (/리니어|linear/i.test(combined)) subtypes.push("LINEAR");
    else if (/택타일|tactile|갈축/i.test(combined)) subtypes.push("TACTILE");
    else if (/클릭|clicky|청축/i.test(combined)) subtypes.push("CLICKY");
  } else if (d === "plate") {
    if (/FR4/i.test(combined)) subtypes.push("FR4");
    else if (/PC|폴리/i.test(combined)) subtypes.push("PC");
    else if (/알루|ALU|alumin/i.test(combined)) subtypes.push("ALU");
    else if (/brass|황동/i.test(combined)) subtypes.push("BRASS");
  } else if (d === "foam") {
    if (/케이스|case/i.test(combined)) subtypes.push("CASE");
    else if (/플레이트|plate/i.test(combined)) subtypes.push("PLATE");
  } else if (d === "keycap") {
    if (/PBT/i.test(combined)) subtypes.push("PBT");
    else if (/ABS/i.test(combined)) subtypes.push("ABS");
  } else if (d === "layout") {
    if (/75%/.test(combined)) subtypes.push("75%");
    else if (/TKL|tenkeyless/i.test(combined)) subtypes.push("TKL");
    else if (/60%/.test(combined)) subtypes.push("60%");
    else if (/65%/.test(combined)) subtypes.push("65%");
  } else if (d === "case") {
    if (/PC|폴리/i.test(combined)) subtypes.push("PC");
    else if (/알루|ALU|alumin/i.test(combined)) subtypes.push("ALU");
  }

  if (subtypes.length === 0) return domainLabel;
  return `${domainLabel} / ${subtypes.join(" · ")}`;
}

/** Brand ribbon from product name or catalog id (no fake placeholders). */
export function overviewDatasheetBrand(itemName?: string, itemId?: string): string {
  const name = (itemName ?? "").trim();
  if (name) {
    const first = name.split(/\s+/)[0]?.trim() ?? "";
    if (first && /^[A-Za-z0-9][A-Za-z0-9+.&-]*$/u.test(first) && first.length <= 24) {
      return first.toUpperCase();
    }
  }

  const id = (itemId ?? "").trim().toLowerCase();
  for (const slug of DATASHEET_BRAND_SLUGS) {
    if (id.includes(slug)) {
      return slug.toUpperCase();
    }
  }

  return "";
}

function shortenSpecToTraitPill(line: string): string {
  const text = line.trim();
  if (!text) return "";
  if (/FR4/i.test(text)) return "FR4";
  if (/PBT/i.test(text)) return "PBT";
  if (/ABS/i.test(text)) return "ABS";
  if (/저소음|무소음/.test(text)) return "저소음";
  if (/윤활/.test(text)) return "윤활";
  const spring = text.match(/\((\d+g)\)/);
  if (spring?.[1]) return spring[1];
  const trimmed = text.replace(/입니다\.?$/, "").trim();
  if (trimmed.length <= 10) return trimmed;
  return trimmed.slice(0, 10);
}

/** Lavender trait pills for overview datasheet cards (≤3). */
export function overviewDatasheetTraitPills(
  whyTraits?: string[],
  _domain?: string,
  whyLine?: string,
): string[] {
  const pills: string[] = [];
  const alignments = parseEvidenceAlignments(whyTraits);

  for (const row of alignments) {
    if (pills.length >= 2) break;
    if (!pills.includes(row.axisLabel)) pills.push(row.axisLabel);
  }

  for (const line of formatEvidenceDetailLines(whyTraits, whyLine)) {
    if (pills.length >= 3) break;
    const short = shortenSpecToTraitPill(line);
    if (short && !pills.includes(short)) pills.push(short);
  }

  return pills.slice(0, 3);
}

export function truncateForMobile(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}
