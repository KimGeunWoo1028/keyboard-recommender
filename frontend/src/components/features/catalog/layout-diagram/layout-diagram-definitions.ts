import type {
  LayoutBlueprint,
  LayoutDiagramId,
  LayoutKeyDef,
  LayoutKeyRole,
} from "./layout-diagram-types";

type Segment = { w: number; role?: LayoutKeyRole };

function row(y: number, segments: Segment[], startX = 0): LayoutKeyDef[] {
  const keys: LayoutKeyDef[] = [];
  let x = startX;
  for (const seg of segments) {
    keys.push({ x, y, w: seg.w, role: seg.role ?? "default" });
    x += seg.w;
  }
  return keys;
}

function fillRow(y: number, count: number, startX = 0, roleAt?: Record<number, LayoutKeyRole>): LayoutKeyDef[] {
  return Array.from({ length: count }, (_, index) => ({
    x: startX + index,
    y,
    w: 1,
    role: roleAt?.[index] ?? "default",
  }));
}

/** Inverted-T arrow cluster; up key centered above left/right. */
function arrowCluster(x: number, y: number): LayoutKeyDef[] {
  return [
    { x: x + 1, y, w: 1, role: "arrow" },
    { x, y: y + 1, w: 1, role: "arrow" },
    { x: x + 1, y: y + 1, w: 1, role: "arrow" },
    { x: x + 2, y: y + 1, w: 1, role: "arrow" },
  ];
}

/** ISO L자 Enter — 3행 끝 가로 + (선택) 4행 우측 1u×1u 2칸. */
function isoEnterL(startY: number, enterX = 12, includeFoot = true, enterW = 2): LayoutKeyDef[] {
  const y = startY;
  const keys: LayoutKeyDef[] = [{ x: enterX, y: y + 2, w: enterW, h: 1, role: "enter" }];
  if (includeFoot) {
    keys.push({ x: enterX, y: y + 3, w: 1 }, { x: enterX + 1, y: y + 3, w: 1 });
  }
  return keys;
}

const SIXTY_STANDARD_RIGHT_EDGE = 15;
const SIXTY_STANDARD_BOTTOM_KEY_W = 1.25;
const SIXTY_STANDARD_CAPS_W = 1.8;
const SIXTY_STANDARD_ENTER_W = 2.2;
const SIXTY_STANDARD_ENTER_X = SIXTY_STANDARD_RIGHT_EDGE - SIXTY_STANDARD_ENTER_W;
const MAIN_BLOCK_RIGHT_COL_GAP = 0.25;
const SIXTY_FIVE_RIGHT_COL_X = SIXTY_STANDARD_RIGHT_EDGE;
const SEVENTY_FIVE_RIGHT_COL_X = SIXTY_STANDARD_RIGHT_EDGE + MAIN_BLOCK_RIGHT_COL_GAP;

/** 60% 1행 — ESC + 12칸 + 마지막 2×1 (Backspace, 우측 끝 15u). */
function sixtyStandardTopRow(y: number, accentEsc = true): LayoutKeyDef[] {
  const roleAt = accentEsc ? { 0: "accent" as const } : undefined;
  return [...fillRow(y, 13, 0, roleAt), { x: 13, y, w: 2 }];
}

/** 60% 2행 — 첫·마지막 1.5×1 (Tab / \\, 1.5+12+1.5=15u). */
function sixtyStandardSecondRow(y: number): LayoutKeyDef[] {
  const edge = 1.5;
  const keys: LayoutKeyDef[] = [{ x: 0, y, w: edge }];
  for (let index = 0; index < 12; index += 1) {
    keys.push({ x: edge + index, y, w: 1 });
  }
  keys.push({ x: SIXTY_STANDARD_RIGHT_EDGE - edge, y, w: edge });
  return keys;
}

/** 60% 3행 — 첫 1.8×1 (Caps Lock) + 1×1 11칸; 마지막 2.2×1은 Enter(1.8+11+2.2=15u). */
function sixtyStandardThirdRow(y: number): LayoutKeyDef[] {
  const firstW = SIXTY_STANDARD_CAPS_W;
  const keys: LayoutKeyDef[] = [{ x: 0, y, w: firstW }];
  for (let index = 0; index < 11; index += 1) {
    keys.push({ x: firstW + index, y, w: 1 });
  }
  return keys;
}

/** 60% 4행 — 첫 2.3×1 + 1×1 10칸 + 마지막 2.7×1 (Shift, 2.3+10+2.7=15u). */
function sixtyStandardFourthRow(y: number): LayoutKeyDef[] {
  const firstW = 2.3;
  const lastW = 2.7;
  const keys: LayoutKeyDef[] = [{ x: 0, y, w: firstW }];
  for (let index = 0; index < 10; index += 1) {
    keys.push({ x: firstW + index, y, w: 1 });
  }
  keys.push({ x: SIXTY_STANDARD_RIGHT_EDGE - lastW, y, w: lastW });
  return keys;
}

/** 60% 5행 — 1.25×1 3칸 + Space(4~8번) 6.25×1 + 1.25×1 4칸. */
function sixtyStandardFifthRow(y: number): LayoutKeyDef[] {
  const w = SIXTY_STANDARD_BOTTOM_KEY_W;
  const spaceStart = 3 * w;
  const spaceW = 5 * w;
  const tailStart = spaceStart + spaceW;
  return [
    ...Array.from({ length: 3 }, (_, index) => ({ x: index * w, y, w })),
    { x: spaceStart, y, w: spaceW, role: "space" },
    ...Array.from({ length: 4 }, (_, index) => ({ x: tailStart + index * w, y, w })),
  ];
}

/** 60% 1행~5행 전체. */
function sixtyStandardMainBlock(row1Y: number, accentEsc = true): LayoutKeyDef[] {
  const coreOrigin = row1Y;
  return [
    ...sixtyStandardTopRow(row1Y, accentEsc),
    ...sixtyStandardSecondRow(row1Y + 1),
    ...sixtyStandardThirdRow(row1Y + 2),
    ...isoEnterL(coreOrigin, SIXTY_STANDARD_ENTER_X, false, SIXTY_STANDARD_ENTER_W),
    ...sixtyStandardFourthRow(row1Y + 3),
    ...sixtyStandardFifthRow(row1Y + 4),
  ];
}

function sixtyPercentCore(startY = 0): LayoutKeyDef[] {
  return sixtyStandardMainBlock(startY, true);
}

/** 65% 우측 열 — 메인 블록(15u) 오른쪽 1×1, 전체 우측 끝 16u. */
function sixtyFiveRightColKey(y: number, rowIndex: number): LayoutKeyDef {
  const role: LayoutKeyRole | undefined = rowIndex === 4 ? "arrow" : undefined;
  return mainBlockRightColKey(y, role);
}

/** 65% 4행 — 2 1×10 2 1 1 (13번째 칸·↑ arrow). */
function sixtyFiveFourthRow(y: number): LayoutKeyDef[] {
  const segments: Segment[] = [{ w: 2 }];
  for (let index = 0; index < 10; index += 1) {
    segments.push({ w: 1 });
  }
  segments.push({ w: 2 }, { w: 1, role: "arrow" }, { w: 1 });
  return row(y, segments);
}

/** 65% 5행 — 1.25×1 3칸 + Space + 1×1 4칸(스페이스 오른쪽), 메인 15u. */
function sixtyFiveFifthRow(y: number): LayoutKeyDef[] {
  const leftW = SIXTY_STANDARD_BOTTOM_KEY_W;
  const tailCount = 4;
  const tailW = 1;
  const spaceStart = 3 * leftW;
  const spaceW = SIXTY_STANDARD_RIGHT_EDGE - spaceStart - tailCount * tailW;
  const tailStart = spaceStart + spaceW;
  return [
    ...Array.from({ length: 3 }, (_, index) => ({ x: index * leftW, y, w: leftW })),
    { x: spaceStart, y, w: spaceW, role: "space" },
    ...Array.from({ length: tailCount }, (_, index) => ({
      x: tailStart + index * tailW,
      y,
      w: tailW,
      role: index >= 2 ? "arrow" : undefined,
    })),
  ];
}

/** 65% — 60% 메인 블록 + 우측 1열(×16 정렬). */
function sixtyFiveCore(startY = 0): LayoutKeyDef[] {
  const y = startY;
  const row2Y = y + 1;
  const coreOrigin = row2Y - 1;
  return [
    ...sixtyStandardTopRow(y),
    sixtyFiveRightColKey(y, 0),
    ...sixtyStandardSecondRow(row2Y),
    sixtyFiveRightColKey(row2Y, 1),
    ...sixtyStandardThirdRow(row2Y + 1),
    ...isoEnterL(coreOrigin, SIXTY_STANDARD_ENTER_X, false, SIXTY_STANDARD_ENTER_W),
    sixtyFiveRightColKey(row2Y + 1, 2),
    ...sixtyFiveFourthRow(row2Y + 2),
    ...sixtyFiveFifthRow(row2Y + 3),
    sixtyFiveRightColKey(row2Y + 3, 4),
  ];
}

const TKL_ROW_ONE_TWO_GAP = 0.25;
const TKL_NAV_GAP = MAIN_BLOCK_RIGHT_COL_GAP;
const TKL_NAV_X = SIXTY_STANDARD_RIGHT_EDGE + TKL_NAV_GAP;
const TKL_NUMPAD_GAP = 0.25;
const TKL_NUMPAD_X = TKL_NAV_X + 3 + TKL_NUMPAD_GAP;
const TKL_TOP_ROW_ESC_GAP = 1;
const TKL_TOP_ROW_SECOND_GAP = 0.5;

/** TKL 1행 — ESC + F1~F12; 10~13번은 메인 블록 우측(15u) 정렬. */
function tklTopRow(y: number): LayoutKeyDef[] {
  const keys: LayoutKeyDef[] = [{ x: 0, y, w: 1, role: "accent" }];
  for (let index = 1; index <= 4; index += 1) {
    keys.push({ x: index + TKL_TOP_ROW_ESC_GAP, y, w: 1 });
  }
  for (let index = 5; index <= 8; index += 1) {
    keys.push({ x: index + TKL_TOP_ROW_ESC_GAP + TKL_TOP_ROW_SECOND_GAP, y, w: 1 });
  }
  const tailCount = 4;
  const tailStart = SIXTY_STANDARD_RIGHT_EDGE - tailCount;
  for (let index = 0; index < tailCount; index += 1) {
    keys.push({ x: tailStart + index, y, w: 1 });
  }
  return keys;
}

function tklMainBlock(startY = 0): LayoutKeyDef[] {
  const y = startY;
  const gap = TKL_ROW_ONE_TWO_GAP;
  const row1Y = y + 1 + gap;
  return [...tklTopRow(y), ...sixtyStandardMainBlock(row1Y, false)];
}

/** 메인 블록 우측 1×1. */
function mainBlockRightColKey(y: number, role?: LayoutKeyRole, colX = SIXTY_FIVE_RIGHT_COL_X): LayoutKeyDef {
  return { x: colX, y, w: 1, role };
}

/** 75% Exploded 1행 — ESC·F그룹·우측 2칸, 그룹 간 0.25u. */
function seventyFiveExplodedTopRow(y: number): LayoutKeyDef[] {
  const groupGap = MAIN_BLOCK_RIGHT_COL_GAP;
  const keys: LayoutKeyDef[] = [{ x: 0, y, w: 1, role: "accent" }];
  let x = 1 + groupGap;
  for (let group = 0; group < 3; group += 1) {
    for (let index = 0; index < 4; index += 1) {
      keys.push({ x, y, w: 1 });
      x += 1;
    }
    x += groupGap;
  }
  keys.push({ x, y, w: 1 });
  x += 1 + groupGap;
  keys.push({ x, y, w: 1 });
  return keys;
}

/** 75% 5행 — 2 1×10 2 + ↑(x=14.25, y+0.25). */
function seventyFiveExplodedFifthRow(y: number): LayoutKeyDef[] {
  const segments: Segment[] = [{ w: 2 }];
  for (let index = 0; index < 10; index += 1) {
    segments.push({ w: 1 });
  }
  segments.push({ w: 2 });
  return [
    ...row(y, segments),
    {
      x: SIXTY_STANDARD_RIGHT_EDGE - 1 + MAIN_BLOCK_RIGHT_COL_GAP,
      y: y + MAIN_BLOCK_RIGHT_COL_GAP,
      w: 1,
      role: "arrow",
    },
  ];
}

/** 75% 6행 — 65% 5행과 동일하나 ←·↓·→는 y+0.25(←·↓는 x도 +0.25). */
function seventyFiveExplodedSixthRow(y: number): LayoutKeyDef[] {
  const leftW = SIXTY_STANDARD_BOTTOM_KEY_W;
  const tailCount = 4;
  const tailW = 1;
  const spaceStart = 3 * leftW;
  const spaceW = SIXTY_STANDARD_RIGHT_EDGE - spaceStart - tailCount * tailW;
  const tailStart = spaceStart + spaceW;
  const gap = MAIN_BLOCK_RIGHT_COL_GAP;
  return [
    ...Array.from({ length: 3 }, (_, index) => ({ x: index * leftW, y, w: leftW })),
    { x: spaceStart, y, w: spaceW, role: "space" },
    ...Array.from({ length: tailCount }, (_, index) => {
      const isArrow = index >= 2;
      return {
        x: tailStart + index * tailW + (isArrow ? gap : 0),
        y: y + (isArrow ? gap : 0),
        w: tailW,
        role: isArrow ? "arrow" : undefined,
      };
    }),
    { x: SEVENTY_FIVE_RIGHT_COL_X, y: y + gap, w: 1, role: "arrow" },
  ];
}

/** 75% Exploded — TKL 메인 블록 + 각 행 우측 1열. */
function seventyFiveExplodedMain(startY = 0): LayoutKeyDef[] {
  const y = startY;
  const gap = TKL_ROW_ONE_TWO_GAP;
  const row1Y = y + 1 + gap;
  const coreOrigin = row1Y;
  return [
    ...seventyFiveExplodedTopRow(y),
    ...sixtyStandardTopRow(row1Y, false),
    mainBlockRightColKey(row1Y, undefined, SEVENTY_FIVE_RIGHT_COL_X),
    ...sixtyStandardSecondRow(row1Y + 1),
    mainBlockRightColKey(row1Y + 1, undefined, SEVENTY_FIVE_RIGHT_COL_X),
    ...sixtyStandardThirdRow(row1Y + 2),
    ...isoEnterL(coreOrigin, SIXTY_STANDARD_ENTER_X, false, SIXTY_STANDARD_ENTER_W),
    mainBlockRightColKey(row1Y + 2, undefined, SEVENTY_FIVE_RIGHT_COL_X),
    ...seventyFiveExplodedFifthRow(row1Y + 3),
    ...seventyFiveExplodedSixthRow(row1Y + 4),
  ];
}

function functionRow(y = 0): LayoutKeyDef[] {
  return row(y, [{ w: 1, role: "accent" }, ...Array.from({ length: 12 }, () => ({ w: 1 }))]);
}

function tklNavCluster(x: number, y: number): LayoutKeyDef[] {
  return [
    ...fillRow(y, 3, x),
    ...fillRow(y + 1, 3, x),
    ...arrowCluster(x, y + 2),
  ];
}

function tklRightColumn(x: number): LayoutKeyDef[] {
  const gap = TKL_ROW_ONE_TWO_GAP;
  return [
    ...fillRow(0, 3, x),
    ...fillRow(1 + gap, 3, x),
    ...fillRow(2 + gap, 3, x),
    ...arrowCluster(x, 4 + gap),
  ];
}

/** 넘패드 — 2행 4칸, 3–4·5–6행 각 3칸+세로 1×2(3–4는 와이어프레임), 6행 2×1+1×1. */
function numpad(x: number, y: number): LayoutKeyDef[] {
  return [
    ...fillRow(y, 4, x),
    ...fillRow(y + 1, 3, x),
    { x: x + 3, y: y + 1, w: 1, h: 2 },
    ...fillRow(y + 2, 3, x),
    ...fillRow(y + 3, 3, x),
    { x: x + 3, y: y + 3, w: 1, h: 2, role: "enter" },
    { x, y: y + 4, w: 2 },
    { x: x + 2, y: y + 4, w: 1 },
  ];
}

function splitHalf(offsetX: number, mirror = false): LayoutKeyDef[] {
  const keys: LayoutKeyDef[] = [
    ...fillRow(0, 6, offsetX, mirror ? undefined : { 0: "accent" }),
    ...fillRow(1, 6, offsetX),
    ...fillRow(2, 6, offsetX),
    ...fillRow(3, 5, offsetX),
  ];

  if (mirror) {
    keys.push(
      { x: offsetX + 5, y: 3, w: 1, role: "enter" },
      { x: offsetX, y: 4, w: 3, role: "space" },
      { x: offsetX + 3, y: 4, w: 2 },
    );
  } else {
    keys.push(
      { x: offsetX, y: 4, w: 3, role: "space" },
      { x: offsetX + 3, y: 4, w: 2 },
    );
  }

  return keys;
}

function aliceHalf(mirror: boolean): LayoutKeyDef[] {
  const keys = splitHalf(0, mirror);
  if (!mirror) return keys;
  return keys.map((key) => ({
    ...key,
    x: 5.5 - key.x - (key.w - 1),
  }));
}

const BLUEPRINTS: Record<LayoutDiagramId, LayoutBlueprint> = {
  "60-standard": {
    id: "60-standard",
    viewBox: "0 0 220 92",
    blocks: [{ keys: sixtyPercentCore(0) }],
    callouts: [
      "가장 작은 풀사이즈 배열 중 하나로, 책상 점유가 작습니다.",
      "펑션 행이 없어 단축키 레이어 사용 비중이 상대적으로 높습니다.",
      "숫자패드가 없어 숫자 입력은 상단 숫자열에 의존합니다.",
    ],
  },
  "65-compact": {
    id: "65-compact",
    viewBox: "0 0 220 92",
    blocks: [{ keys: sixtyFiveCore(0) }],
    callouts: [
      "60% 크기에 방향키 클러스터를 유지한 실용적인 소형 배열입니다.",
      "펑션 행 없이도 방향키가 분리되어 있어 게임·문서 작업 모두 무난합니다.",
      "숫자패드는 없지만 마우스 공간 확보에 유리합니다.",
    ],
  },
  tkl: {
    id: "tkl",
    viewBox: "0 0 280 115",
    blocks: [
      {
        keys: tklMainBlock(0),
      },
      {
        keys: tklRightColumn(TKL_NAV_X),
        transform: "translate(0 0)",
      },
    ],
    callouts: [
      "펑션 행과 방향키는 유지하고 숫자패드만 제거한 80% 배열입니다.",
      "업무용 키는 남기면서 책상 폭을 줄이기 좋은 타협형입니다.",
      "풀사이즈 대비 넘패드 영역이 없는 타입입니다.",
    ],
  },
  "full-size": {
    id: "full-size",
    viewBox: "0 0 360 115",
    blocks: [
      { keys: tklMainBlock(0) },
      { keys: tklRightColumn(TKL_NAV_X) },
      { keys: numpad(TKL_NUMPAD_X, 1 + TKL_ROW_ONE_TWO_GAP) },
    ],
    callouts: [
      "숫자패드를 포함한 완전형 배열로 숫자 입력·회계 작업에 익숙합니다.",
      "책상 점유는 크지만 별도 넘패드 없이도 표 입력이 편합니다.",
      "게임·업무 겸용 데스크에서 가장 익숙한 형태입니다.",
    ],
  },
  "75-exploded": {
    id: "75-exploded",
    viewBox: "0 0 265 92",
    blocks: [{ keys: seventyFiveExplodedMain(0) }],
    callouts: [
      "펑션·숫자열과 알파 블록 사이에 간격이 있는 익스플로디드 75%입니다.",
      "키 블록이 분리되어 시각적으로 구역이 나뉩니다.",
      "방향키는 유지하면서도 75%급 컴팩트함을 노립니다.",
    ],
  },
  alice: {
    id: "alice",
    viewBox: "0 0 260 110",
    blocks: [
      { keys: aliceHalf(false), transform: "translate(16 16) rotate(-12 30 30)" },
      { keys: aliceHalf(true), transform: "translate(144 16) rotate(12 30 30)" },
    ],
    callouts: [
      "양손을 가운데로 모으는 인체공학 배열입니다.",
      "손목 부담을 줄이려는 사용자에게 맞는 참고 타입입니다.",
      "각 블록이 안쪽으로 기울어진 것이 Alice 레이아웃의 핵심 특징입니다.",
    ],
  },
  "split-60": {
    id: "split-60",
    viewBox: "0 0 260 88",
    blocks: [{ keys: splitHalf(0, false) }, { keys: splitHalf(9.5, true) }],
    callouts: [
      "두 개의 독립 블록으로 나뉘어 어깨 너비에 맞게 배치할 수 있습니다.",
      "중앙 간격만큼 마우스·트랙패드 공간을 확보하기 쉽습니다.",
      "60%급 키 수를 유지하면서 자세 조정에 유리합니다.",
    ],
  },
};

export function getLayoutBlueprint(id: LayoutDiagramId): LayoutBlueprint {
  return BLUEPRINTS[id];
}

export function listLayoutBlueprintIds(): LayoutDiagramId[] {
  return Object.keys(BLUEPRINTS) as LayoutDiagramId[];
}
