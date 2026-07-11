import { swagkeyProductLinkLabel } from "@/lib/layout-catalog-links";
import { normalizeSwagkeyProductUrl } from "@/lib/swagkey-source-links";

export function SwagkeyProductLink({
  href,
  className,
  domain,
  itemId,
  label,
}: {
  href?: string;
  className?: string;
  domain?: string;
  itemId?: string;
  label?: string;
}) {
  const url = normalizeSwagkeyProductUrl(href);
  if (!url) return null;
  const text = label ?? swagkeyProductLinkLabel(domain, itemId);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex h-8 items-center rounded-full border border-ca-primary/40 bg-ca-primary/10 px-3 font-label text-ca-label-sm font-medium text-ca-primary underline-offset-4 transition-colors hover:bg-ca-primary/20 hover:underline"
      }
    >
      {text}
    </a>
  );
}
