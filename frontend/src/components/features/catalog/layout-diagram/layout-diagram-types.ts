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

export type LayoutBlueprint = {
  id: LayoutDiagramId;
  viewBox: string;
  blocks: LayoutBlockDef[];
  callouts: string[];
};
