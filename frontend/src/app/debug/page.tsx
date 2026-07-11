import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debug home",
};

export default function DebugHomePage() {
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>
        Pick a tool above. All calls go to the gated FastAPI <code className="rounded bg-muted px-1">/api/v1/debug</code>{" "}
        routes — they do not run unless the backend enables them.
      </p>
    </div>
  );
}
