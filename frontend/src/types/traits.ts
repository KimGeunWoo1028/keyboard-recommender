/**
 * Internal recommendation traits — numeric scores accumulated from survey answers.
 * Higher = stronger signal for that trait. Mock recommendation reads these keys.
 */

export interface TraitAccumulator {
  /** Sound: muted / dampened character */
  soundMuted: number;
  /** Sound: bright / crisp / ping-forward */
  soundBright: number;
  /** Sound: deep / thock-forward */
  soundThocky: number;
  /** Sound: sharp / clacky */
  soundClacky: number;

  /** Overall loudness preference */
  volumeQuiet: number;
  volumeLoud: number;

  /** Switch style */
  linearLean: number;
  tactileLean: number;

  /** Bottom-out feel */
  softBottom: number;
  firmBottom: number;

  /** How hard the user tends to type */
  lightPress: number;
  heavyPress: number;
}

export function emptyTraits(): TraitAccumulator {
  return {
    soundMuted: 0,
    soundBright: 0,
    soundThocky: 0,
    soundClacky: 0,
    volumeQuiet: 0,
    volumeLoud: 0,
    linearLean: 0,
    tactileLean: 0,
    softBottom: 0,
    firmBottom: 0,
    lightPress: 0,
    heavyPress: 0,
  };
}

export function addTraitDeltas(base: TraitAccumulator, delta: Partial<TraitAccumulator>): TraitAccumulator {
  const out = { ...base };
  (Object.keys(delta) as (keyof TraitAccumulator)[]).forEach((key) => {
    const v = delta[key];
    if (typeof v === "number") {
      out[key] += v;
    }
  });
  return out;
}

/** Fold all chosen answers into one trait vector (mock “engine” input). */
export function mergeTraitDeltas(deltas: Partial<TraitAccumulator>[]): TraitAccumulator {
  return deltas.reduce<TraitAccumulator>((acc, d) => addTraitDeltas(acc, d), emptyTraits());
}
