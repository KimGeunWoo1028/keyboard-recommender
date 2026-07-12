export type LayoutDiagramId =
  | "60-standard"
  | "65-compact"
  | "tkl"
  | "full-size"
  | "75-exploded"
  | "alice"
  | "split-60";

export type LayoutKeyRole = "default" | "accent" | "modifier" | "space" | "enter" | "arrow" | "ghost";

export type LayoutKeyDef = {
  x: number;
  y: number;
  w: number;
  h?: number;
  role?: LayoutKeyRole;
};

export type LayoutGhostRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

export type LayoutBlockDef = {
  keys: LayoutKeyDef[];
  ghostRegions?: LayoutGhostRegion[];
  transform?: string;
};

export type LayoutJackDef = {
  /** u 그리드 좌상단 */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayoutConnectorDef = {
  /** 좌측 잭 앵커 (u 그리드, 키 배열과 동일 좌표계) */
  left: { x: number; y: number };
  /** 우측 잭 앵커 */
  right: { x: number; y: number };
  /** 잭에서 위로 뻗는 직선 구간 (u) */
  stubU?: number;
  /** 아치 최고점이 stub 꼭대기보다 더 올라가는 높이 (u) */
  archRiseU?: number;
};

export type LayoutBlueprint = {
  id: LayoutDiagramId;
  viewBox: string;
  blocks: LayoutBlockDef[];
  /** 블록 사이 연결선 (예: split TRRS 케이블) */
  connectors?: LayoutConnectorDef[];
  /** 잭 표시용 작은 사각형 (split 등) */
  jacks?: LayoutJackDef[];
  callouts: string[];
};
