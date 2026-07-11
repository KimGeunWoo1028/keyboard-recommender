import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";
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
    <PageShell className="max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">keyboard-terminology 데모</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          커뮤니티 용어가 내부 trait 축으로 어떻게 옮겨지는지 확인하는 페이지입니다. 주소창에{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/terminology-demo</code> 로 들어옵니다.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1) 기본 리졸버 (`defaultDictionaryResolver`)</h2>
        <p className="text-sm text-muted-foreground">
          각 문장은 토큰으로 쪼개진 뒤 사전에 있는 단어만 합쳐집니다. sense는 기본적으로 confidence가 높은 쪽을 고릅니다.
        </p>
        <ul className="space-4">
          {SAMPLES.map((phrase) => {
            const r = defaultDictionaryResolver.resolve(phrase);
            return (
              <li key={phrase} className="rounded-lg border border-border/80 bg-muted/20 p-4">
                <p className="mb-2 font-label text-sm font-medium text-foreground">&quot;{phrase}&quot;</p>
                <pre className="max-h-80 overflow-auto rounded-md bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                  {JSON.stringify(r, null, 2)}
                </pre>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2) 여러 의미 블렌드 (`sensePick: blend`)</h2>
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1 text-xs">marbly</code>처럼 sense가 여러 개일 때, 블렌드하면 축별 평균으로 합칩니다.
        </p>
        {(["highestConfidence", "blend"] as const).map((strategy) => {
          const r = communityTextToTraits("marbly", { sensePick: strategy });
          return (
            <div key={strategy} className="rounded-lg border border-border/80 bg-muted/20 p-4">
              <p className="mb-2 font-label text-sm">marbly — sensePick: {strategy}</p>
              <pre className="max-h-64 overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                {JSON.stringify({ traitDelta: r.traitDelta, senseIds: r.senseIds, beginnerNotes: r.beginnerNotes }, null, 2)}
              </pre>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3) 단일 용어 (`termToTraitDelta`)</h2>
        <p className="text-sm text-muted-foreground">드롭다운·태그 한 개만 넣을 때 쓰는 API입니다.</p>
        <pre className="rounded-lg border border-border/80 bg-background p-4 text-xs text-muted-foreground">
          {JSON.stringify(termToTraitDelta("poppy", "highestConfidence"), null, 2)}
        </pre>
      </section>
    </PageShell>
  );
}
