import Image from "next/image";
import { Github, Linkedin, Link2, Mail, type LucideIcon } from "lucide-react";
import type { PreviewSocialLink, SocialLinkItem } from "@/types/social-link-view";

const previewSocialIcons: Record<PreviewSocialLink["kind"], LucideIcon> = {
  github: Github,
  linkedin: Linkedin,
  email: Mail,
};

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
          const isApiLink = "platform" in link;
          const label = isApiLink ? link.platform : link.label;
          const href = isApiLink ? link.url : link.href;
          const iconUrl = isApiLink ? link.icon : null;
          const Icon = isApiLink ? Link2 : previewSocialIcons[link.kind];
          const isEmail = href.startsWith("mailto:");

          return (
            <li key={isApiLink ? `api-${link.id}` : `preview-${link.kind}`}>
              <a
                href={href}
                target={isEmail ? undefined : "_blank"}
                rel={isEmail ? undefined : "noopener noreferrer"}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {iconUrl ? (
                  <Image src={iconUrl} alt="" width={15} height={15} sizes="15px" />
                ) : (
                  <Icon size={15} aria-hidden="true" />
                )}
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
