import { swagkeyProductLinkLabel } from "@/lib/layout-catalog-links";
import { normalizeSwagkeyProductUrl } from "@/lib/swagkey-source-links";
import { cn } from "@/lib/utils";

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
      title="새 탭에서 스웨그키 매장이 열립니다. 돌아와 결과를 저장할 수 있어요."
      className={cn(
        "text-sm font-medium text-ca-on-surface underline-offset-4 transition-colors hover:underline",
        className,
      )}
    >
      {text}
    </a>
  );
}
