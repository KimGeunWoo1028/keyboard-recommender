import { getLayoutBlueprint } from "../src/components/features/catalog/layout-diagram/layout-diagram-definitions.ts";

const keys = getLayoutBlueprint("alice").blocks[0].keys;
const macro = keys.find((k) => k.y === 3 && k.x < 0);
const r4 = keys.filter((k) => k.y === 3).sort((a, b) => a.x - b.x);
const row = macro ? [macro, ...r4] : r4;
row.forEach((k, i) => {
  const prev = row[i - 1];
  const gap = prev ? k.x - (prev.x + prev.w) : 0;
  console.log(`${i + 1}: x=${k.x} w=${k.w} end=${k.x + k.w} gap=${gap}`);
});
