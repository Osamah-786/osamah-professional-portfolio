import type { SocialLink as ApiSocialLink } from "@/types/api";

export type PreviewSocialLink = {
  label: string;
  href: string;
  kind: "github" | "linkedin" | "email";
};

export type SocialLinkItem = ApiSocialLink | PreviewSocialLink;
