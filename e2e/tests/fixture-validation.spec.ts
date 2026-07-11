import * as fs from "node:fs";
import * as path from "node:path";

import { expect, test } from "@playwright/test";

test("deterministic survey fixture is valid JSON with required keys", () => {
  const p = path.join(__dirname, "..", "fixtures", "deterministic-survey.json");
  const raw = fs.readFileSync(p, "utf8");
  const data = JSON.parse(raw) as Record<string, unknown>;
  for (const k of ["sound_profile", "typing_pressure", "switch_feel", "bottom_out", "volume"]) {
    expect(typeof data[k]).toBe("string");
  }
});
