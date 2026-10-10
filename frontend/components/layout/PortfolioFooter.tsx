import Link from "next/link";
import { SocialLinks } from "@/components/home/SocialLinks";
import { Footer } from "@/components/layout/Footer";
import type { SocialLinkItem } from "@/types/social-link-view";

const DEFAULT_ADMIN_LOGIN_URL = "https://osamah-professional-portfolio-mjul.vercel.app/admin/login";

type PortfolioFooterProps = {
  name: string | null;
  socialLinks: readonly SocialLinkItem[];
};

export function PortfolioFooter({ name, socialLinks }: PortfolioFooterProps) {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim() || DEFAULT_ADMIN_LOGIN_URL;

  return (
    <Footer>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[0.68rem] tracking-[0.06em]">
          © {new Date().getFullYear()}{name ? ` ${name}` : ""}
        </p>
        <SocialLinks links={socialLinks} />
        <Link
          href={adminUrl}
          className="w-fit text-xs text-ink-muted no-underline transition-colors hover:text-ink"
        >
          Admin
        </Link>
      </div>
    </Footer>
  );
}
