import Link from "next/link";
import { SocialLinks } from "@/components/home/SocialLinks";
import { Footer } from "@/components/layout/Footer";
import type { SocialLinkItem } from "@/types/social-link-view";

type PortfolioFooterProps = {
  name: string | null;
  socialLinks: readonly SocialLinkItem[];
};

export function PortfolioFooter({ name, socialLinks }: PortfolioFooterProps) {
  return (
    <Footer>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[0.68rem] tracking-[0.06em]">
          © {new Date().getFullYear()}{name ? ` ${name}` : ""}
        </p>
        <SocialLinks links={socialLinks} />
        <Link
          href="/admin/login"
          className="w-fit text-xs text-ink-muted no-underline transition-colors hover:text-ink"
        >
          Admin
        </Link>
      </div>
    </Footer>
  );
}
