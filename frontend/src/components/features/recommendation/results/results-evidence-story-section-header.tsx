export function ResultsEvidenceStorySectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-1">
      <h2 className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">{title}</h2>
      <p className="text-sm text-ca-on-surface-variant">{description}</p>
    </div>
  );
}
