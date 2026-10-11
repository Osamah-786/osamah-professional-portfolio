import { SocialLinkLogo } from "@/components/home/SocialLinkLogo";
import type { SocialLinkItem } from "@/types/social-link-view";

type SocialLinksProps = {
  links: readonly SocialLinkItem[];
  className?: string;
};

export function SocialLinks({ links, className }: SocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <nav aria-label="Social links" className={className}>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {links.map((link) => {
          return (
            <li key={`api-${link.id}`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <SocialLinkLogo key={link.icon ?? "default"} platform={link.platform} src={link.icon} />
                <span>{link.platform}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
