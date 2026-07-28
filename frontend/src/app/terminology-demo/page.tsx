import type { Metadata } from "next";

import { ManusPageHeader } from "@/components/layout/manus-page-header";
import { ManusSecondaryShell } from "@/components/layout/manus-secondary-shell";
import { ManusSurfaceCard } from "@/components/layout/manus-surface-card";
import { communityTextToTraits, defaultDictionaryResolver, termToTraitDelta } from "@/keyboard-terminology";

export const metadata: Metadata = {
  title: "Terminology demo",
  robots: { index: false, follow: false },
};

const SAMPLES = [
  "thocky",
  "creamy",
  "thocky creamy muted",
  "marbly",
  "poppy clacky",
  "thocc dampened",
];

export default function TerminologyDemoPage() {
  return (
    <ManusSecondaryShell maxWidthClassName="max-w-4xl">
      <ManusPageHeader
        eyebrow="Internal"
        title="keyboard-terminology 데모"
        description={
          <>
            커뮤니티 용어가 내부 trait 축으로 어떻게 옮겨지는지 확인하는 페이지입니다. 주소창에{" "}
            <code className="rounded-md border border-[rgb(220_220_238)] bg-white px-1.5 py-0.5 font-mono text-xs dark:border-border dark:bg-ca-surface-container">
              /terminology-demo
            </code>{" "}
            로 들어옵니다.
          </>
        }
      />

      <ManusSurfaceCard className="space-y-4" padding="lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[rgb(100_100_120)] dark:text-ca-on-surface-variant">
          1) 기본 리졸버 (`defaultDictionaryResolver`)
        </h2>
        <p className="text-sm text-ca-on-surface-variant">
          각 문장은 토큰으로 쪼개진 뒤 사전에 있는 단어만 합쳐집니다. sense는 기본적으로 confidence가 높은 쪽을 고릅니다.
        </p>
        <ul className="space-y-3">
          {SAMPLES.map((phrase) => {
            const r = defaultDictionaryResolver.resolve(phrase);
            return (
              <li
                key={phrase}
                className="rounded-xl border-2 border-[rgb(220_220_238)] bg-[rgb(248_248_252)] p-4 dark:border-border dark:bg-ca-surface-container-low"
              >
                <p className="mb-2 text-sm font-semibold text-ca-on-surface">&quot;{phrase}&quot;</p>
                <pre className="max-h-80 overflow-auto rounded-lg border border-[rgb(220_220_238)] bg-white p-3 font-mono text-xs leading-relaxed text-ca-on-surface-variant dark:border-border dark:bg-ca-surface-container">
                  {JSON.stringify(r, null, 2)}
                </pre>
              </li>
            );
          })}
        </ul>
      </ManusSurfaceCard>

      <ManusSurfaceCard className="space-y-4" padding="lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[rgb(100_100_120)] dark:text-ca-on-surface-variant">
          2) 여러 의미 블렌드 (`sensePick: blend`)
        </h2>
        <p className="text-sm text-ca-on-surface-variant">
          <code className="rounded-md border border-[rgb(220_220_238)] bg-[rgb(248_248_252)] px-1 text-xs dark:border-border dark:bg-ca-surface-container-low">
            marbly
          </code>
          처럼 sense가 여러 개일 때, 블렌드하면 축별 평균으로 합칩니다.
        </p>
        {(["highestConfidence", "blend"] as const).map((strategy) => {
          const r = communityTextToTraits("marbly", { sensePick: strategy });
          return (
            <div
              key={strategy}
              className="rounded-xl border-2 border-[rgb(220_220_238)] bg-[rgb(248_248_252)] p-4 dark:border-border dark:bg-ca-surface-container-low"
            >
              <p className="mb-2 text-sm font-semibold">marbly — sensePick: {strategy}</p>
              <pre className="max-h-64 overflow-auto rounded-lg border border-[rgb(220_220_238)] bg-white p-3 font-mono text-xs text-ca-on-surface-variant dark:border-border dark:bg-ca-surface-container">
                {JSON.stringify({ traitDelta: r.traitDelta, senseIds: r.senseIds, beginnerNotes: r.beginnerNotes }, null, 2)}
              </pre>
            </div>
          );
        })}
      </ManusSurfaceCard>

      <ManusSurfaceCard className="space-y-3" padding="lg">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[rgb(100_100_120)] dark:text-ca-on-surface-variant">
          3) 단일 용어 (`termToTraitDelta`)
        </h2>
        <p className="text-sm text-ca-on-surface-variant">드롭다운·태그 한 개만 넣을 때 쓰는 API입니다.</p>
        <pre className="rounded-xl border-2 border-[rgb(220_220_238)] bg-[rgb(248_248_252)] p-4 font-mono text-xs text-ca-on-surface-variant dark:border-border dark:bg-ca-surface-container-low">
          {JSON.stringify(termToTraitDelta("poppy", "highestConfidence"), null, 2)}
        </pre>
      </ManusSurfaceCard>
    </ManusSecondaryShell>
  );
}
