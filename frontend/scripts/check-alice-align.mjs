import { getLayoutBlueprint } from "../src/components/features/catalog/layout-diagram/layout-diagram-definitions.ts";

const PITCH = 15;
const KU = 11;
const KG = 4;
const KH = 11;
const RIGHT_MIN = 9;

function rect(k) {
  const h = k.h ?? 1;
  return {
    x: k.x * PITCH,
    y: k.y * PITCH,
    w: k.w * KU + (k.w - 1) * KG,
    h: h * KH + (h - 1) * KG,
  };
}

function bounds(k, transform) {
  const r = rect(k);
  if (!transform) {
    return { top: r.y, bot: r.y + r.h };
  }
  let pts = [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x + r.w, r.y + r.h],
    [r.x, r.y + r.h],
  ];
  const rotateMatch = transform.match(/rotate\(([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\)/);
  if (rotateMatch) {
    const deg = Number(rotateMatch[1]);
    const cx = Number(rotateMatch[2]);
    const cy = Number(rotateMatch[3]);
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    pts = pts.map(([x, y]) => [
      cx + cos * (x - cx) + sin * (y - cy),
      cy - sin * (x - cx) + cos * (y - cy),
    ]);
  }
  const translateMatch = transform.match(/translate\(\s*0\s+([-\d.]+)\s*\)/);
  if (translateMatch) {
    const dy = Number(translateMatch[1]);
    pts = pts.map(([x, y]) => [x, y + dy]);
  }
  const ys = pts.map((p) => p[1]);
  return { top: Math.min(...ys), bot: Math.max(...ys) };
}

const bp = getLayoutBlueprint("alice");
for (let rowY = 0; rowY <= 4; rowY += 1) {
  let leftTop = Infinity;
  let leftBot = -Infinity;
  let rightTop = Infinity;
  let rightBot = -Infinity;
  for (const block of bp.blocks) {
    for (const key of block.keys) {
      if (key.y !== rowY) {
        continue;
      }
      const b = bounds(key, block.transform);
      if (key.x < RIGHT_MIN) {
        leftTop = Math.min(leftTop, b.top);
        leftBot = Math.max(leftBot, b.bot);
      } else {
        rightTop = Math.min(rightTop, b.top);
        rightBot = Math.max(rightBot, b.bot);
      }
    }
  }
  const leftMid = (leftTop + leftBot) / 2;
  const rightMid = (rightTop + rightBot) / 2;
  console.log(
    `row ${rowY + 1}: L mid ${leftMid.toFixed(1)} R mid ${rightMid.toFixed(1)} delta ${(rightMid - leftMid).toFixed(1)}`,
  );
}
