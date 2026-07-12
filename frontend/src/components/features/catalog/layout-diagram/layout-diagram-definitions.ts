import type {
  LayoutBlockDef,
  LayoutBlueprint,
  LayoutDiagramId,
  LayoutJackDef,
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
const ALICE_RIGHT_BLOCK_MIN_X = 9;
const ALICE_RIGHT_BLOCK_X_SHIFT_U = 0.5;
const ALICE_RIGHT_ROW_ALIGN_PX = -2.6;
const ALICE_RIGHT_NON_ROTATED_SHIFT_U = 0.1875;
const ALICE_RIGHT_ROW4_EXTRA_SHIFT_U = 0.375;
const ALICE_RIGHT_ROW1_TO3_EXTRA_SHIFT_U = 0.3125;
const ALICE_RIGHT_ROW1_EXTRA_SHIFT_U = 0.625;
const ALICE_RIGHT_ROW2_EXTRA_SHIFT_U = 0.125;
const ALICE_RIGHT_ROW3_EXTRA_SHIFT_U = 0;
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

/** Split 60 — 60% 기반, 1~4행만 지정 칸 사이에 1.5u 분리 (5행 유지). */
const SPLIT_SIXTY_CENTER_GAP_U = 1.5;

/** 행별 분리 x: 1행 7|8번, 2~4행 6|7번 경계. */
const SPLIT_SIXTY_SPLIT_X_BY_ROW: Record<number, number> = {
  0: 7, // 1행 8번 키 시작
  1: 6.5, // 2행 7번 키 시작 (Tab 1.5 + 6×1u)
  2: 6.8, // 3행 7번 키 시작 (Caps 1.8 + 5×1u)
  3: 7.3, // 4행 7번 키 시작 (Shift 2.3 + 5×1u)
};

function applySplitCenterGap(keys: LayoutKeyDef[], splitX: number, gapU: number): LayoutKeyDef[] {
  const out: LayoutKeyDef[] = [];
  const rightStartX = splitX + gapU;

  for (const key of keys) {
    const keyLeft = key.x;
    const keyRight = key.x + key.w;
    if (keyRight <= splitX + 1e-6) {
      out.push({ ...key });
      continue;
    }
    if (keyLeft >= splitX - 1e-6) {
      out.push({ ...key, x: keyLeft + gapU });
      continue;
    }
    const leftW = splitX - keyLeft;
    const rightW = keyRight - splitX;
    if (leftW > 1e-6) {
      out.push({ ...key, w: leftW });
    }
    if (rightW > 1e-6) {
      out.push({ ...key, x: rightStartX, w: rightW });
    }
  }

  return out;
}

/** 5행 스페이스바(6.25u)를 첫 칸과 동일한 1.25u 단위로 분할. */
function subdivideSplitSixtySpacebar(keys: LayoutKeyDef[]): LayoutKeyDef[] {
  const unitW = SIXTY_STANDARD_BOTTOM_KEY_W;
  const out: LayoutKeyDef[] = [];
  for (const key of keys) {
    if (key.role !== "space" || key.w <= unitW + 1e-6) {
      out.push(key);
      continue;
    }
    const segmentCount = Math.round(key.w / unitW);
    for (let index = 0; index < segmentCount; index += 1) {
      out.push({
        ...key,
        x: key.x + index * unitW,
        w: unitW,
        role: "space",
      });
    }
  }
  return out;
}

const SPLIT_SIXTY_ROW5_MERGE_FROM_KEY_INDEX = 3;
const SPLIT_SIXTY_ROW5_MERGE_KEY_COUNT = 3;
const SPLIT_SIXTY_ROW5_MERGED_KEY_W = 3.125;

/** 5행 4·5·6번째 칸(스페이스 분할 1~3)을 w=3 하나로 합침. */
function mergeSplitSixtyRow5Keys456(keys: LayoutKeyDef[]): LayoutKeyDef[] {
  const sorted = [...keys].sort((a, b) => a.x - b.x);
  const mergeEnd = SPLIT_SIXTY_ROW5_MERGE_FROM_KEY_INDEX + SPLIT_SIXTY_ROW5_MERGE_KEY_COUNT;
  if (sorted.length < mergeEnd) return keys;

  const toMerge = sorted.slice(SPLIT_SIXTY_ROW5_MERGE_FROM_KEY_INDEX, mergeEnd);
  const merged: LayoutKeyDef = {
    ...toMerge[0]!,
    x: toMerge[0]!.x,
    w: SPLIT_SIXTY_ROW5_MERGED_KEY_W,
    role: "space",
  };

  return [...sorted.slice(0, SPLIT_SIXTY_ROW5_MERGE_FROM_KEY_INDEX), merged, ...sorted.slice(mergeEnd)];
}

const SPLIT_SIXTY_ROW5_MERGE_56_FROM_KEY_INDEX = 4;
const SPLIT_SIXTY_ROW5_MERGE_56_KEY_COUNT = 2;

/** 5행 5·6번째 칸을 w=3.125 하나로 합침. */
function mergeSplitSixtyRow5Keys56(keys: LayoutKeyDef[]): LayoutKeyDef[] {
  const sorted = [...keys].sort((a, b) => a.x - b.x);
  const mergeEnd = SPLIT_SIXTY_ROW5_MERGE_56_FROM_KEY_INDEX + SPLIT_SIXTY_ROW5_MERGE_56_KEY_COUNT;
  if (sorted.length < mergeEnd) return sorted;

  const toMerge = sorted.slice(SPLIT_SIXTY_ROW5_MERGE_56_FROM_KEY_INDEX, mergeEnd);
  const merged: LayoutKeyDef = {
    ...toMerge[0]!,
    x: toMerge[0]!.x,
    w: SPLIT_SIXTY_ROW5_MERGED_KEY_W,
    role: "space",
  };

  return [...sorted.slice(0, SPLIT_SIXTY_ROW5_MERGE_56_FROM_KEY_INDEX), merged, ...sorted.slice(mergeEnd)];
}

/** 5행 5번째 칸부터 우측 끝(15u + 1.5u 분리 간격)에 맞춰 오른쪽 정렬. */
function rightAlignSplitSixtyRow5FromKey5(keys: LayoutKeyDef[]): LayoutKeyDef[] {
  const sorted = [...keys].sort((a, b) => a.x - b.x);
  const fromKeyIndex = 4;
  if (sorted.length <= fromKeyIndex) return sorted;

  const fixed = sorted.slice(0, fromKeyIndex);
  const trailing = sorted.slice(fromKeyIndex);
  const trailingWidth = trailing.reduce((sum, key) => sum + key.w, 0);
  const rightEdge = SIXTY_STANDARD_RIGHT_EDGE + SPLIT_SIXTY_CENTER_GAP_U;
  let cursorX = rightEdge - trailingWidth;
  const aligned = trailing.map((key) => {
    const placed = { ...key, x: cursorX };
    cursorX += key.w;
    return placed;
  });
  return [...fixed, ...aligned];
}

function processSplitSixtyRow5(keys: LayoutKeyDef[]): LayoutKeyDef[] {
  return rightAlignSplitSixtyRow5FromKey5(
    mergeSplitSixtyRow5Keys56(mergeSplitSixtyRow5Keys456(subdivideSplitSixtySpacebar(keys))),
  );
}

/** Split 60 — 1행 n번째(1-based) 키 중심 위 잭 사각형. */
function jackAboveRowKey(rowKeys: LayoutKeyDef[], keyNumber: number, jack: { w: number; h: number; gapU: number }): LayoutJackDef {
  const key = [...rowKeys].sort((a, b) => a.x - b.x)[keyNumber - 1];
  if (!key) {
    throw new Error(`row key ${keyNumber} not found`);
  }
  const centerX = key.x + key.w / 2;
  return {
    x: centerX - jack.w / 2,
    y: -jack.gapU - jack.h,
    w: jack.w,
    h: jack.h,
  };
}

function splitSixtyPercentCore(startY = 0): LayoutKeyDef[] {
  const core = sixtyPercentCore(startY);
  const keysByRow = new Map<number, LayoutKeyDef[]>();
  for (const key of core) {
    const rowKeys = keysByRow.get(key.y) ?? [];
    rowKeys.push(key);
    keysByRow.set(key.y, rowKeys);
  }

  const out: LayoutKeyDef[] = [];
  for (const [y, keys] of [...keysByRow.entries()].sort(([a], [b]) => a - b)) {
    const rowIndex = y - startY;
    const splitX = SPLIT_SIXTY_SPLIT_X_BY_ROW[rowIndex];
    if (splitX === undefined) {
      const rowKeys = rowIndex === 4 ? processSplitSixtyRow5(keys) : keys;
      out.push(...rowKeys);
      continue;
    }
    out.push(...applySplitCenterGap(keys, splitX, SPLIT_SIXTY_CENTER_GAP_U));
  }
  return out;
}

function splitSixtyJackMarkers(): LayoutJackDef[] {
  const row1Keys = splitSixtyPercentCore(0).filter((key) => key.y === 0);
  const jackSize = { w: 0.5, h: 0.25, gapU: 0.1 };
  return [jackAboveRowKey(row1Keys, 6, jackSize), jackAboveRowKey(row1Keys, 9, jackSize)];
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

/** Alice — 65% 기반, x=15 우측열 제거 + 1~4행(y=0~3) 좌측 매크로 1u. */
function applyAliceKeyRoles(keys: LayoutKeyDef[], startY = 0): LayoutKeyDef[] {
  const result = keys.map((key) => ({
    ...key,
    role: "default" as LayoutKeyRole,
  }));

  const keysInRow = (rowY: number) =>
    result.filter((key) => key.y === rowY).sort((a, b) => a.x - b.x);

  const row1First = keysInRow(startY)[0];
  if (row1First) {
    row1First.role = "accent";
  }

  const row3 = keysInRow(startY + 2);
  const row3Last = row3[row3.length - 1];
  if (row3Last) {
    row3Last.role = "enter";
  }

  const row4 = keysInRow(startY + 3);
  if (row4[13]) {
    row4[13]!.role = "enter";
  }

  const row5 = keysInRow(startY + 4);
  for (const index of [3, 4]) {
    if (row5[index]) {
      row5[index]!.role = "space";
    }
  }
  for (const index of [6, 7, 8]) {
    if (row5[index]) {
      row5[index]!.role = "arrow";
    }
  }

  return result;
}

function aliceLayoutFromSixtyFive(startY = 0): LayoutKeyDef[] {
  const rightColX = SIXTY_FIVE_RIGHT_COL_X;
  const trimmed: LayoutKeyDef[] = [];

  for (const key of sixtyFiveCore(startY)) {
    if (key.x >= rightColX - 0.001) {
      continue;
    }
    const end = key.x + key.w;
    if (end > rightColX) {
      trimmed.push({ ...key, w: rightColX - key.x });
    } else {
      trimmed.push(key);
    }
  }

  const shifted = trimmed.map((key) => {
    if (key.y >= startY && key.y <= startY + 3) {
      return { ...key, x: key.x + 1 };
    }
    return key;
  });

  const macroCol = Array.from({ length: 4 }, (_, index) => ({
    x: 0,
    y: startY + index,
    w: 1,
  }));

  const lastRowY = startY + 4;
  const upperRight = Math.max(
    0,
    ...shifted.filter((key) => key.y >= startY && key.y <= startY + 3).map((key) => key.x + key.w),
  );
  const lastRowKeys = shifted.filter((key) => key.y === lastRowY);
  let aligned = shifted;
  if (lastRowKeys.length > 0 && upperRight > 0) {
    const lastRowRight = Math.max(...lastRowKeys.map((key) => key.x + key.w));
    const delta = upperRight - lastRowRight;
    if (delta > 0.001) {
      aligned = shifted.map((key) =>
        key.y === lastRowY ? { ...key, x: key.x + delta } : key,
      );
    }
  }

  const firstRowY = startY;
  const firstRowGapAfterX = 8;
  let firstRowGapped = aligned.map((key) => {
    if (key.y === firstRowY && key.x >= 1) {
      return { ...key, x: key.x + MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  firstRowGapped = firstRowGapped.map((key) => {
    if (key.y === firstRowY && key.x > firstRowGapAfterX) {
      return { ...key, x: key.x + 1 };
    }
    return key;
  });

  const secondRowY = startY + 1;
  const secondRowGapped = firstRowGapped.map((key) => {
    if (key.y === secondRowY && key.x >= 1) {
      return { ...key, x: key.x + MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const secondRowKeys17MaxX = 6.5 + MAIN_BLOCK_RIGHT_COL_GAP;
  const secondRowNudged = secondRowGapped.map((key) => {
    if (key.y === secondRowY && key.x <= secondRowKeys17MaxX + 0.001) {
      return { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const macroColNudged = macroCol.map((key) =>
    key.y === secondRowY ? { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP } : key,
  );
  const secondRowTailMinX = secondRowKeys17MaxX + 0.001;
  const referenceRight = Math.max(
    0,
    ...firstRowGapped
      .filter((key) => key.y >= startY && key.y <= startY + 3 && key.y !== secondRowY)
      .map((key) => key.x + key.w),
  );
  const secondRowTailKeys = secondRowNudged.filter(
    (key) => key.y === secondRowY && key.x > secondRowTailMinX - 0.001,
  );
  let secondRowAligned = secondRowNudged;
  if (secondRowTailKeys.length > 0 && referenceRight > 0) {
    const tailRight = Math.max(...secondRowTailKeys.map((key) => key.x + key.w));
    const tailDelta = referenceRight - tailRight;
    if (Math.abs(tailDelta) > 0.001) {
      secondRowAligned = secondRowNudged.map((key) =>
        key.y === secondRowY && key.x > secondRowTailMinX - 0.001
          ? { ...key, x: key.x + tailDelta }
          : key,
      );
    }
  }
  const secondRowTailNudged = secondRowAligned.map((key) =>
    key.y === secondRowY && key.x > secondRowTailMinX - 0.001
      ? { ...key, x: key.x + MAIN_BLOCK_RIGHT_COL_GAP }
      : key,
  );

  const thirdRowY = startY + 2;
  const thirdRowKey7BaseX = 1 + SIXTY_STANDARD_CAPS_W + 4;
  const thirdRowKeys17MaxX = thirdRowKey7BaseX + MAIN_BLOCK_RIGHT_COL_GAP;
  const thirdRowGapped = secondRowTailNudged.map((key) => {
    if (key.y === thirdRowY && key.x >= 1) {
      return { ...key, x: key.x + MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const thirdRowNudged = thirdRowGapped.map((key) => {
    if (key.y === thirdRowY && key.x <= thirdRowKeys17MaxX + 0.001) {
      return { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const thirdRow27Nudged = thirdRowNudged.map((key) => {
    if (key.y === thirdRowY && key.x >= 1 && key.x <= thirdRowKey7BaseX + 0.001) {
      return { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const macroColFinal = macroColNudged.map((key) =>
    key.y === thirdRowY
      ? { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP * 2 }
      : key,
  );
  const thirdRowTailMinX = thirdRowKeys17MaxX + 0.001;
  const thirdReferenceRight = Math.max(
    0,
    ...secondRowTailNudged
      .filter((key) => key.y >= startY && key.y <= startY + 3 && key.y !== thirdRowY)
      .map((key) => key.x + key.w),
  );
  const thirdRowTailKeys = thirdRow27Nudged.filter(
    (key) => key.y === thirdRowY && key.x > thirdRowTailMinX - 0.001,
  );
  let thirdRowAligned = thirdRow27Nudged;
  if (thirdRowTailKeys.length > 0 && thirdReferenceRight > 0) {
    const tailRight = Math.max(...thirdRowTailKeys.map((key) => key.x + key.w));
    const tailDelta = thirdReferenceRight - tailRight;
    if (Math.abs(tailDelta) > 0.001) {
      thirdRowAligned = thirdRow27Nudged.map((key) =>
        key.y === thirdRowY && key.x > thirdRowTailMinX - 0.001
          ? { ...key, x: key.x + tailDelta }
          : key,
      );
    }
  }
  const thirdRowTailNudged = thirdRowAligned.map((key) =>
    key.y === thirdRowY && key.x > thirdRowTailMinX - 0.001
      ? { ...key, x: key.x + MAIN_BLOCK_RIGHT_COL_GAP }
      : key,
  );

  const fourthRowY = startY + 3;
  const fourthRowKey7BaseX = 1 + 2 + 4;
  const fourthRowNudged = thirdRowTailNudged.map((key) => {
    if (key.y === fourthRowY && key.x <= fourthRowKey7BaseX + 0.001) {
      return { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const fourthRow27Nudged = fourthRowNudged.map((key) => {
    if (key.y !== fourthRowY) {
      return key;
    }
    const shiftBaseX = key.x + MAIN_BLOCK_RIGHT_COL_GAP;
    if (shiftBaseX >= 1 && shiftBaseX <= fourthRowKey7BaseX + 0.001) {
      return { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP };
    }
    return key;
  });
  const fourthRowLeftShift = fourthRow27Nudged
    .filter((key) => key.y === fourthRowY && key.w >= 2 - 0.001)
    .sort((a, b) => a.x - b.x)[0];
  const fourthRowCell2W = 2.25;
  let fourthRowCell2Sized = fourthRow27Nudged;
  if (fourthRowLeftShift) {
    const cell2WidthDelta = fourthRowCell2W - fourthRowLeftShift.w;
    if (Math.abs(cell2WidthDelta) > 0.001) {
      const cell2X = fourthRowLeftShift.x;
      const cell2W = fourthRowLeftShift.w;
      fourthRowCell2Sized = fourthRow27Nudged.map((key) => {
        if (key.y !== fourthRowY) {
          return key;
        }
        if (Math.abs(key.x - cell2X) < 0.001 && Math.abs(key.w - cell2W) < 0.001) {
          return { ...key, w: fourthRowCell2W };
        }
        if (key.x > cell2X + 0.001) {
          return { ...key, x: key.x + cell2WidthDelta };
        }
        return key;
      });
    }
  }
  const fourthRowSplit = fourthRowCell2Sized.flatMap((key) => {
    if (
      key.y === fourthRowY &&
      key.w >= 2 - 0.001 &&
      key.x > fourthRowKey7BaseX + 0.001
    ) {
      return [
        { ...key, w: 1 },
        { ...key, x: key.x + 1, w: 1 },
      ];
    }
    return [key];
  });
  const macroColWithFourth = macroColFinal.map((key) =>
    key.y === fourthRowY
      ? { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP * 3 }
      : key,
  );
  const fourthRowKeys = fourthRowSplit.filter((key) => key.y === fourthRowY);
  const fourthRowRightmostX =
    fourthRowKeys.length > 0 ? Math.max(...fourthRowKeys.map((key) => key.x)) : 0;
  const withFourthRowMerged = fourthRowSplit.map((key) => {
    if (
      key.y === fourthRowY &&
      fourthRowRightmostX > 0 &&
      Math.abs(key.x - fourthRowRightmostX) < 0.001 &&
      key.w <= 1.001
    ) {
      return { ...key, w: 2 };
    }
    return key;
  });
  const fourthRowTailMinX = fourthRowKey7BaseX - MAIN_BLOCK_RIGHT_COL_GAP * 2 + 0.001;
  const fourthReferenceRight = Math.max(
    0,
    ...thirdRowTailNudged
      .filter((key) => key.y >= startY && key.y <= startY + 3 && key.y !== fourthRowY)
      .map((key) => key.x + key.w),
  );
  const fourthRowTailKeys = withFourthRowMerged.filter(
    (key) => key.y === fourthRowY && key.x > fourthRowTailMinX - 0.001,
  );
  let fourthRowAligned = withFourthRowMerged;
  if (fourthRowTailKeys.length > 0 && fourthReferenceRight > 0) {
    const tailRight = Math.max(...fourthRowTailKeys.map((key) => key.x + key.w));
    const tailDelta = fourthReferenceRight - tailRight;
    if (Math.abs(tailDelta) > 0.001) {
      fourthRowAligned = withFourthRowMerged.map((key) =>
        key.y === fourthRowY && key.x > fourthRowTailMinX - 0.001
          ? { ...key, x: key.x + tailDelta }
          : key,
      );
    }
  }
  const fourthRowKeys17 = fourthRowAligned.filter(
    (key) => key.y === fourthRowY && key.x <= fourthRowTailMinX + 0.001,
  );
  const fourthRowTailStart = fourthRowAligned
    .filter((key) => key.y === fourthRowY && key.x > fourthRowTailMinX - 0.001)
    .sort((a, b) => a.x - b.x)[0];
  let fourthRowClosed = fourthRowAligned;
  if (fourthRowKeys17.length > 0 && fourthRowTailStart) {
    const keys17End = Math.max(...fourthRowKeys17.map((key) => key.x + key.w));
    const tailGap = fourthRowTailStart.x - keys17End;
    if (tailGap > 0.001) {
      fourthRowClosed = fourthRowAligned.map((key) =>
        key.y === fourthRowY && key.x >= fourthRowTailStart.x - 0.001
          ? { ...key, x: key.x - tailGap }
          : key,
      );
    }
  }
  const fourthRowKeys17Closed = fourthRowClosed.filter(
    (key) => key.y === fourthRowY && key.x <= fourthRowTailMinX + 0.001,
  );
  const fourthRowCell7End =
    fourthRowKeys17Closed.length > 0
      ? Math.max(...fourthRowKeys17Closed.map((key) => key.x + key.w))
      : fourthRowTailMinX;
  const fourthRowPushMinX = fourthRowCell7End + 0.001;
  const fourthRowTailPushed = fourthRowClosed.map((key) =>
    key.y === fourthRowY && key.x >= fourthRowPushMinX
      ? { ...key, x: key.x + 1 }
      : key,
  );
  const fourthRowTailNudged = fourthRowTailPushed.map((key) =>
    key.y === fourthRowY && key.x >= fourthRowPushMinX
      ? { ...key, x: key.x - MAIN_BLOCK_RIGHT_COL_GAP }
      : key,
  );

  const fifthRowY = lastRowY;
  const fourthRowCell2 = fourthRowTailNudged
    .filter((key) => key.y === fourthRowY && key.w >= 2 - 0.001)
    .sort((a, b) => a.x - b.x)[0];
  const fifthRowSorted = fourthRowTailNudged
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell1 = fifthRowSorted[0];
  const fifthRowCell2 = fifthRowSorted[1];
  let fifthRowAligned = fourthRowTailNudged;
  if (fourthRowCell2 && fifthRowCell1 && fifthRowCell2) {
    const fifthRowAlignDelta = fourthRowCell2.x - fifthRowCell1.x;
    if (Math.abs(fifthRowAlignDelta) > 0.001) {
      const fifthRowLeftXs = new Set([fifthRowCell1.x, fifthRowCell2.x]);
      fifthRowAligned = fourthRowTailNudged.map((key) =>
        key.y === fifthRowY && fifthRowLeftXs.has(key.x)
          ? { ...key, x: key.x + fifthRowAlignDelta }
          : key,
      );
    }
  }

  const fifthRowAfterAlign = fifthRowAligned
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell3 = fifthRowAfterAlign[2];
  let fifthRowFinal = fifthRowAligned;
  if (fifthRowCell3) {
    fifthRowFinal = fifthRowAligned
      .filter(
        (key) =>
          !(
            key.y === fifthRowY &&
            Math.abs(key.x - fifthRowCell3.x) < 0.001 &&
            Math.abs(key.w - fifthRowCell3.w) < 0.001
          ),
      )
      .map((key) =>
        key.y === fifthRowY && key.x > fifthRowCell3.x + 0.001
          ? { ...key, x: key.x - fifthRowCell3.w }
          : key,
      );
  }

  const fifthRowKeysSorted = fifthRowFinal
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell2Final = fifthRowKeysSorted[1];
  if (fifthRowCell2Final) {
    const cell2End = fifthRowCell2Final.x + fifthRowCell2Final.w;
    const firstAfterCell2 = fifthRowKeysSorted.find(
      (key) => key.x >= cell2End - 0.001 && key.x > fifthRowCell2Final.x + 0.001,
    );
    if (firstAfterCell2) {
      const cell2Gap = fifthRowCell2Final.w;
      const gapDelta = cell2End + cell2Gap - firstAfterCell2.x;
      if (Math.abs(gapDelta) > 0.001) {
        fifthRowFinal = fifthRowFinal.map((key) =>
          key.y === fifthRowY && key.x >= firstAfterCell2.x - 0.001
            ? { ...key, x: key.x + gapDelta }
            : key,
        );
      }
    }
  }

  const fifthRowWithSplitSpace = fifthRowFinal.flatMap((key) => {
    if (key.y === fifthRowY && key.role === "space") {
      const unitCount = Math.floor(key.w + 0.001);
      return Array.from({ length: unitCount }, (_, index) => ({
        ...key,
        x: key.x + index,
        w: 1,
        role: "space" as const,
      }));
    }
    return [key];
  });
  const fifthRowSortedFinal = fifthRowWithSplitSpace
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell2Match = fifthRowSortedFinal[1];
  const fifthRowCell3Match = fifthRowSortedFinal[2];
  let fifthRowMatched = fifthRowWithSplitSpace;
  if (fifthRowCell2Match && fifthRowCell3Match) {
    const targetCell3X =
      fifthRowCell2Match.x + fifthRowCell2Match.w + SIXTY_STANDARD_BOTTOM_KEY_W;
    const targetCell3W = fifthRowCell2Match.w;
    const oldCell3End = fifthRowCell3Match.x + fifthRowCell3Match.w;
    const newCell3End = targetCell3X + targetCell3W;
    const shiftAfterCell3 = newCell3End - oldCell3End;
    const cell3X = fifthRowCell3Match.x;
    const cell3W = fifthRowCell3Match.w;
    fifthRowMatched = fifthRowWithSplitSpace.map((key) => {
      if (key.y !== fifthRowY) {
        return key;
      }
      if (Math.abs(key.x - cell3X) < 0.001 && Math.abs(key.w - cell3W) < 0.001) {
        return { ...key, x: targetCell3X, w: targetCell3W };
      }
      if (key.x > cell3X + 0.001) {
        return { ...key, x: key.x + shiftAfterCell3 };
      }
      return key;
    });
  }

  const fifthRowCell45W = 2.25;
  const fifthRowForMerge = fifthRowMatched
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell4 = fifthRowForMerge[3];
  const fifthRowCell5 = fifthRowForMerge[4];
  let fifthRowFinal45 = fifthRowMatched;
  if (fifthRowCell4 && fifthRowCell5) {
    const oldCell5End = fifthRowCell5.x + fifthRowCell5.w;
    const newMergedEnd = fifthRowCell4.x + fifthRowCell45W;
    const shiftAfterCell5 = newMergedEnd - oldCell5End;
    const cell4X = fifthRowCell4.x;
    const cell4W = fifthRowCell4.w;
    const cell5X = fifthRowCell5.x;
    const cell5W = fifthRowCell5.w;
    fifthRowFinal45 = fifthRowMatched
      .filter(
        (key) =>
          !(
            key.y === fifthRowY &&
            Math.abs(key.x - cell5X) < 0.001 &&
            Math.abs(key.w - cell5W) < 0.001
          ),
      )
      .map((key) => {
        if (key.y !== fifthRowY) {
          return key;
        }
        if (Math.abs(key.x - cell4X) < 0.001 && Math.abs(key.w - cell4W) < 0.001) {
          return { ...key, w: fifthRowCell45W };
        }
        if (key.x > cell5X - 0.001) {
          return { ...key, x: key.x + shiftAfterCell5 };
        }
        return key;
      });
  }

  const fourthRowMacro = macroColWithFourth.find((key) => key.y === fourthRowY);
  const fourthRowSorted = [
    ...(fourthRowMacro ? [fourthRowMacro] : []),
    ...fourthRowTailNudged.filter((key) => key.y === fourthRowY),
  ].sort((a, b) => a.x - b.x);
  const fourthRowCell8 = fourthRowSorted[7];
  const fifthRowSortedAfterMerge = fifthRowFinal45
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell5Target = fifthRowSortedAfterMerge[4];
  let fifthRowCell8Aligned = fifthRowFinal45;
  if (fourthRowCell8 && fifthRowCell5Target) {
    const cell8AlignDelta = fourthRowCell8.x - fifthRowCell5Target.x;
    if (Math.abs(cell8AlignDelta) > 0.001) {
      const cell5StartX = fifthRowCell5Target.x;
      fifthRowCell8Aligned = fifthRowFinal45.map((key) =>
        key.y === fifthRowY && key.x >= cell5StartX - 0.001
          ? { ...key, x: key.x + cell8AlignDelta }
          : key,
      );
    }
  }

  const fifthRowCell567W = 2.5;
  const fifthRowFor567 = fifthRowCell8Aligned
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell5Merge = fifthRowFor567[4];
  const fifthRowCell6Merge = fifthRowFor567[5];
  const fifthRowCell7Merge = fifthRowFor567[6];
  let fifthRowFinal567 = fifthRowCell8Aligned;
  if (fifthRowCell5Merge && fifthRowCell6Merge && fifthRowCell7Merge) {
    const oldCell7End = fifthRowCell7Merge.x + fifthRowCell7Merge.w;
    const newMergedEnd = fifthRowCell5Merge.x + fifthRowCell567W;
    const shiftAfterCell7 = newMergedEnd - oldCell7End;
    const cell5X = fifthRowCell5Merge.x;
    const cell5W = fifthRowCell5Merge.w;
    const cell6X = fifthRowCell6Merge.x;
    const cell6W = fifthRowCell6Merge.w;
    const cell7X = fifthRowCell7Merge.x;
    const cell7W = fifthRowCell7Merge.w;
    fifthRowFinal567 = fifthRowCell8Aligned
      .filter((key) => {
        if (key.y !== fifthRowY) {
          return true;
        }
        const isCell6 =
          Math.abs(key.x - cell6X) < 0.001 && Math.abs(key.w - cell6W) < 0.001;
        const isCell7 =
          Math.abs(key.x - cell7X) < 0.001 && Math.abs(key.w - cell7W) < 0.001;
        return !isCell6 && !isCell7;
      })
      .map((key) => {
        if (key.y !== fifthRowY) {
          return key;
        }
        if (Math.abs(key.x - cell5X) < 0.001 && Math.abs(key.w - cell5W) < 0.001) {
          return { ...key, w: fifthRowCell567W };
        }
        if (key.x > cell7X - 0.001) {
          return { ...key, x: key.x + shiftAfterCell7 };
        }
        return key;
      });
  }

  const fifthRowSortedForRemove = fifthRowFinal567
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell7Remove = fifthRowSortedForRemove[6];
  let fifthRowWithout7 = fifthRowFinal567;
  if (fifthRowCell7Remove) {
    const removeX = fifthRowCell7Remove.x;
    const removeW = fifthRowCell7Remove.w;
    fifthRowWithout7 = fifthRowFinal567
      .filter(
        (key) =>
          !(
            key.y === fifthRowY &&
            Math.abs(key.x - removeX) < 0.001 &&
            Math.abs(key.w - removeW) < 0.001
          ),
      )
      .map((key) =>
        key.y === fifthRowY && key.x > removeX + 0.001
          ? { ...key, x: key.x - removeW }
          : key,
      );
  }

  const fifthRowSortedForGap = fifthRowWithout7
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowCell6Gap = fifthRowSortedForGap[5];
  const fifthRowCell7Gap = fifthRowSortedForGap[6];
  let fifthRowGapped67 = fifthRowWithout7;
  if (fifthRowCell6Gap && fifthRowCell7Gap) {
    const targetCell7X = fifthRowCell6Gap.x + fifthRowCell6Gap.w + 1.5;
    const gapDelta = targetCell7X - fifthRowCell7Gap.x;
    if (Math.abs(gapDelta) > 0.001) {
      const cell7StartX = fifthRowCell7Gap.x;
      fifthRowGapped67 = fifthRowWithout7.map((key) =>
        key.y === fifthRowY && key.x >= cell7StartX - 0.001
          ? { ...key, x: key.x + gapDelta }
          : key,
      );
    }
  }

  const aliceRightShifted = [...fifthRowGapped67, ...macroColWithFourth].map((key) =>
    key.x >= ALICE_RIGHT_BLOCK_MIN_X - 0.001
      ? { ...key, x: key.x + ALICE_RIGHT_BLOCK_X_SHIFT_U }
      : key,
  );

  return applyAliceKeyRoles(aliceRightShifted, startY);
}

const DIAGRAM_KEY_UNIT = 11;
const DIAGRAM_KEY_GAP = 4;
const DIAGRAM_KEY_HEIGHT = 11;
const DIAGRAM_PITCH = DIAGRAM_KEY_UNIT + DIAGRAM_KEY_GAP;
const ALICE_RIGHT_NON_ROTATED_EXTRA_PX = ALICE_RIGHT_NON_ROTATED_SHIFT_U * DIAGRAM_PITCH;
const ALICE_RIGHT_ROW1_TO3_EXTRA_PX = ALICE_RIGHT_ROW1_TO3_EXTRA_SHIFT_U * DIAGRAM_PITCH;
const ALICE_RIGHT_ROW1_EXTRA_PX = ALICE_RIGHT_ROW1_EXTRA_SHIFT_U * DIAGRAM_PITCH;
const ALICE_RIGHT_ROW2_EXTRA_PX = ALICE_RIGHT_ROW2_EXTRA_SHIFT_U * DIAGRAM_PITCH;
const ALICE_RIGHT_ROW2_ROTATE_ALIGN_PX =
  ALICE_RIGHT_ROW_ALIGN_PX + ALICE_RIGHT_ROW1_TO3_EXTRA_PX + ALICE_RIGHT_ROW2_EXTRA_PX;
const ALICE_RIGHT_ROW2_TO3_ALIGN_PX = ALICE_RIGHT_ROW_ALIGN_PX + ALICE_RIGHT_ROW1_TO3_EXTRA_PX;
const ALICE_RIGHT_ROW3_ALIGN_PX =
  ALICE_RIGHT_ROW2_TO3_ALIGN_PX + ALICE_RIGHT_ROW3_EXTRA_SHIFT_U * DIAGRAM_PITCH;
const ALICE_RIGHT_ROW4_ALIGN_PX =
  ALICE_RIGHT_ROW_ALIGN_PX + ALICE_RIGHT_ROW4_EXTRA_SHIFT_U * DIAGRAM_PITCH;
const ALICE_FIRST_ROW_LEFT_ROTATE_DEG = 10;
const ALICE_SECOND_ROW_LEFT_ROTATE_DEG = 10;
const ALICE_THIRD_ROW_LEFT_ROTATE_DEG = 10;
const ALICE_FOURTH_ROW_LEFT_ROTATE_DEG = 10;
const ALICE_FOURTH_ROW_RIGHT_ROTATE_DEG = -10;
const ALICE_FIFTH_ROW_LEFT_ROTATE_DEG = 10;
const ALICE_FIFTH_ROW_RIGHT_ROTATE_DEG = -10;
const ALICE_RIGHT_ROW_ROTATE_DEG = -10;
const ALICE_RIGHT_ROW_ROTATE_COUNT = 4;
const ALICE_RIGHT_ROW_PIVOT_INDEX = 2;

function diagramKeyBottomLeft(key: LayoutKeyDef): { x: number; y: number } {
  const h = key.h ?? 1;
  return {
    x: key.x * DIAGRAM_PITCH,
    y: key.y * DIAGRAM_PITCH + h * DIAGRAM_KEY_HEIGHT + (h - 1) * DIAGRAM_KEY_GAP,
  };
}

function diagramKeyBottomRight(key: LayoutKeyDef): { x: number; y: number } {
  const h = key.h ?? 1;
  const width = key.w * DIAGRAM_KEY_UNIT + (key.w - 1) * DIAGRAM_KEY_GAP;
  const height = h * DIAGRAM_KEY_HEIGHT + (h - 1) * DIAGRAM_KEY_GAP;
  return {
    x: key.x * DIAGRAM_PITCH + width,
    y: key.y * DIAGRAM_PITCH + height,
  };
}

function keysMatch(a: LayoutKeyDef, b: LayoutKeyDef): boolean {
  return (
    Math.abs(a.x - b.x) < 0.001 &&
    Math.abs(a.y - b.y) < 0.001 &&
    Math.abs(a.w - b.w) < 0.001 &&
    Math.abs((a.h ?? 1) - (b.h ?? 1)) < 0.001
  );
}

function aliceRotateTransform(pivotKey: LayoutKeyDef, degrees: number): string {
  const pivot = diagramKeyBottomLeft(pivotKey);
  return `rotate(${degrees}, ${pivot.x}, ${pivot.y})`;
}

function aliceRotateTransformBottomRight(pivotKey: LayoutKeyDef, degrees: number): string {
  const pivot = diagramKeyBottomRight(pivotKey);
  return `rotate(${degrees}, ${pivot.x}, ${pivot.y})`;
}

function diagramKeyRect(key: LayoutKeyDef): { x: number; y: number; width: number; height: number } {
  const h = key.h ?? 1;
  return {
    x: key.x * DIAGRAM_PITCH,
    y: key.y * DIAGRAM_PITCH,
    width: key.w * DIAGRAM_KEY_UNIT + (key.w - 1) * DIAGRAM_KEY_GAP,
    height: h * DIAGRAM_KEY_HEIGHT + (h - 1) * DIAGRAM_KEY_GAP,
  };
}

function svgRotatePoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + cos * dx + sin * dy,
    y: cy - sin * dx + cos * dy,
  };
}

function rotatedKeyCornerY(
  key: LayoutKeyDef,
  corner: "tl" | "tr",
  pivotX: number,
  pivotY: number,
  angleDeg: number,
): number {
  const rect = diagramKeyRect(key);
  const point =
    corner === "tl"
      ? { x: rect.x, y: rect.y }
      : { x: rect.x + rect.width, y: rect.y };
  return svgRotatePoint(point.x, point.y, pivotX, pivotY, angleDeg).y;
}

/** Left row-1 rotate start (tl) ↔ right row-1 rotate end (tr) — red/yellow marker corners. */
function aliceRightRow1CornerAlignPx(
  leftRotateKeys: LayoutKeyDef[],
  leftPivot: LayoutKeyDef,
  rightRotateKeys: LayoutKeyDef[],
  rightPivot: LayoutKeyDef,
): number {
  const leftPivotPoint = diagramKeyBottomLeft(leftPivot);
  const rightPivotPoint = diagramKeyBottomRight(rightPivot);
  const leftRefY = rotatedKeyCornerY(
    leftRotateKeys[0]!,
    "tl",
    leftPivotPoint.x,
    leftPivotPoint.y,
    ALICE_FIRST_ROW_LEFT_ROTATE_DEG,
  );
  const rightRefY = rotatedKeyCornerY(
    rightRotateKeys[rightRotateKeys.length - 1]!,
    "tr",
    rightPivotPoint.x,
    rightPivotPoint.y,
    ALICE_RIGHT_ROW_ROTATE_DEG,
  );
  return leftRefY - rightRefY;
}

function aliceRightRowRotateGroup(rowSorted: LayoutKeyDef[]): {
  keys: LayoutKeyDef[];
  pivot: LayoutKeyDef | undefined;
} {
  const rightSorted = rowSorted.filter((key) => key.x >= ALICE_RIGHT_BLOCK_MIN_X - 0.001);
  const keys = rightSorted.slice(0, ALICE_RIGHT_ROW_ROTATE_COUNT);
  const pivot = rightSorted[ALICE_RIGHT_ROW_PIVOT_INDEX];
  return { keys, pivot };
}

function aliceLayoutBlocks(startY = 0): LayoutBlockDef[] {
  const keys = aliceLayoutFromSixtyFive(startY);
  const firstRowY = startY;
  const secondRowY = startY + 1;
  const thirdRowY = startY + 2;
  const fourthRowY = startY + 3;
  const fifthRowY = startY + 4;

  const firstRowSorted = keys
    .filter((key) => key.y === firstRowY)
    .sort((a, b) => a.x - b.x);
  const firstRowRotateKeys = firstRowSorted.slice(4, 8);
  const firstRowPivot = firstRowSorted[3];
  const firstRowRightRotate = aliceRightRowRotateGroup(firstRowSorted);

  const secondRowSorted = keys
    .filter((key) => key.y === secondRowY)
    .sort((a, b) => a.x - b.x);
  const secondRowRotateKeys = secondRowSorted.slice(3, 7);
  const secondRowPivot = secondRowSorted[3];
  const secondRowRightRotate = aliceRightRowRotateGroup(secondRowSorted);

  const thirdRowSorted = keys
    .filter((key) => key.y === thirdRowY)
    .sort((a, b) => a.x - b.x);
  const thirdRowRotateKeys = thirdRowSorted.slice(3, 7);
  const thirdRowPivot = thirdRowSorted[3];
  const thirdRowRightRotate = aliceRightRowRotateGroup(thirdRowSorted);

  const fourthRowSorted = keys
    .filter((key) => key.y === fourthRowY)
    .sort((a, b) => a.x - b.x);
  const fourthRowRotateKeys = fourthRowSorted.slice(3, 7);
  const fourthRowPivot = fourthRowSorted[3];
  const fourthRowRightRotate = aliceRightRowRotateGroup(fourthRowSorted);

  const fifthRowSorted = keys
    .filter((key) => key.y === fifthRowY)
    .sort((a, b) => a.x - b.x);
  const fifthRowRotateKeys = fifthRowSorted.slice(2, 4);
  const fifthRowPivot = fifthRowSorted[2];
  const fifthRowRightSorted = fifthRowSorted.filter(
    (key) => key.x >= ALICE_RIGHT_BLOCK_MIN_X - 0.001,
  );
  const fifthRowRightRotateKeys = fifthRowRightSorted.slice(0, 2);
  const fifthRowRightPivot = fifthRowRightSorted[1];

  const isRotatedKey = (key: LayoutKeyDef) =>
    firstRowRotateKeys.some((candidate) => keysMatch(key, candidate)) ||
    firstRowRightRotate.keys.some((candidate) => keysMatch(key, candidate)) ||
    secondRowRotateKeys.some((candidate) => keysMatch(key, candidate)) ||
    secondRowRightRotate.keys.some((candidate) => keysMatch(key, candidate)) ||
    thirdRowRotateKeys.some((candidate) => keysMatch(key, candidate)) ||
    thirdRowRightRotate.keys.some((candidate) => keysMatch(key, candidate)) ||
    fourthRowRotateKeys.some((candidate) => keysMatch(key, candidate)) ||
    fourthRowRightRotate.keys.some((candidate) => keysMatch(key, candidate)) ||
    fifthRowRotateKeys.some((candidate) => keysMatch(key, candidate)) ||
    fifthRowRightRotateKeys.some((candidate) => keysMatch(key, candidate));

  const blocks: LayoutBlockDef[] = [
    { keys: keys.filter((key) => !isRotatedKey(key)) },
  ];

  const pushRightRowRotation = (
    rotateKeys: LayoutKeyDef[],
    pivot: LayoutKeyDef | undefined,
    degrees: number,
    alignPx = ALICE_RIGHT_ROW_ALIGN_PX,
  ) => {
    if (rotateKeys.length > 0 && pivot) {
      blocks.push({
        keys: rotateKeys,
        transform: `${aliceRotateTransformBottomRight(pivot, degrees)} translate(0 ${alignPx})`,
      });
    }
  };

  if (firstRowRotateKeys.length > 0 && firstRowPivot) {
    blocks.push({
      keys: firstRowRotateKeys,
      transform: aliceRotateTransform(firstRowPivot, ALICE_FIRST_ROW_LEFT_ROTATE_DEG),
    });
  }
  const firstRowRightAlignPx =
    firstRowRotateKeys.length > 0 &&
    firstRowPivot &&
    firstRowRightRotate.keys.length > 0 &&
    firstRowRightRotate.pivot
      ? aliceRightRow1CornerAlignPx(
          firstRowRotateKeys,
          firstRowPivot,
          firstRowRightRotate.keys,
          firstRowRightRotate.pivot,
        ) + ALICE_RIGHT_ROW1_EXTRA_PX
      : ALICE_RIGHT_ROW_ALIGN_PX;
  pushRightRowRotation(
    firstRowRightRotate.keys,
    firstRowRightRotate.pivot,
    ALICE_RIGHT_ROW_ROTATE_DEG,
    firstRowRightAlignPx,
  );

  if (secondRowRotateKeys.length > 0 && secondRowPivot) {
    blocks.push({
      keys: secondRowRotateKeys,
      transform: aliceRotateTransform(secondRowPivot, ALICE_SECOND_ROW_LEFT_ROTATE_DEG),
    });
  }
  pushRightRowRotation(
    secondRowRightRotate.keys,
    secondRowRightRotate.pivot,
    ALICE_RIGHT_ROW_ROTATE_DEG,
    ALICE_RIGHT_ROW2_ROTATE_ALIGN_PX,
  );

  if (thirdRowRotateKeys.length > 0 && thirdRowPivot) {
    blocks.push({
      keys: thirdRowRotateKeys,
      transform: aliceRotateTransform(thirdRowPivot, ALICE_THIRD_ROW_LEFT_ROTATE_DEG),
    });
  }
  pushRightRowRotation(
    thirdRowRightRotate.keys,
    thirdRowRightRotate.pivot,
    ALICE_RIGHT_ROW_ROTATE_DEG,
    ALICE_RIGHT_ROW3_ALIGN_PX,
  );

  if (fourthRowRotateKeys.length > 0 && fourthRowPivot) {
    blocks.push({
      keys: fourthRowRotateKeys,
      transform: aliceRotateTransform(fourthRowPivot, ALICE_FOURTH_ROW_LEFT_ROTATE_DEG),
    });
  }
  pushRightRowRotation(
    fourthRowRightRotate.keys,
    fourthRowRightRotate.pivot,
    ALICE_FOURTH_ROW_RIGHT_ROTATE_DEG,
    ALICE_RIGHT_ROW4_ALIGN_PX,
  );

  if (fifthRowRotateKeys.length > 0 && fifthRowPivot) {
    blocks.push({
      keys: fifthRowRotateKeys,
      transform: aliceRotateTransform(fifthRowPivot, ALICE_FIFTH_ROW_LEFT_ROTATE_DEG),
    });
  }

  if (fifthRowRightRotateKeys.length > 0 && fifthRowRightPivot) {
    blocks.push({
      keys: fifthRowRightRotateKeys,
      transform: aliceRotateTransformBottomRight(
        fifthRowRightPivot,
        ALICE_FIFTH_ROW_RIGHT_ROTATE_DEG,
      ),
    });
  }

  const mainRightKeys = blocks[0]!.keys.filter((key) => key.x >= ALICE_RIGHT_BLOCK_MIN_X - 0.001);
  if (mainRightKeys.length > 0) {
    blocks[0] = {
      keys: blocks[0]!.keys.filter((key) => key.x < ALICE_RIGHT_BLOCK_MIN_X - 0.001),
    };
    blocks.push({
      keys: mainRightKeys,
      transform: `translate(0 ${ALICE_RIGHT_ROW_ALIGN_PX + ALICE_RIGHT_NON_ROTATED_EXTRA_PX})`,
    });
  }

  if (blocks.length === 1) {
    return [{ keys }];
  }

  return blocks;
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
    viewBox: "0 0 220 92",
    blocks: aliceLayoutBlocks(0),
    callouts: [
      "양손을 가운데로 모으는 인체공학 배열입니다.",
      "정방향 65% Compact 키 배치를 참조 다이어그램으로 사용합니다.",
      "실제 Alice 키 배치는 제품·PCB마다 다를 수 있습니다.",
    ],
  },
  "split-60": {
    id: "split-60",
    viewBox: "0 0 260 92",
    blocks: [{ keys: splitSixtyPercentCore(0) }],
    jacks: splitSixtyJackMarkers(),
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
