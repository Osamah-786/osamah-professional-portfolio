import { apiGet } from "@/lib/api/client";

export type SectionBlock = {
  type: "heading" | "paragraph" | "list" | "image" | "gallery" | "links" | "quote" | "callout";
  title?: string | null; text?: string | null; items?: string[] | null; url?: string | null;
  alt_text?: string | null; images?: { url: string; alt_text: string; caption?: string | null }[] | null;
  links?: { label: string; url: string }[] | null;
};
export type PortfolioSection = {
  id: number; key: string; slug: string; section_type: "built_in" | "custom"; title: string;
  display_order: number; show_on_homepage: boolean; show_on_full_page: boolean;
  short_description: string | null; long_description: string | null; read_more_enabled: boolean;
  layout_variant: "standard" | "cards" | "split" | "editorial" | "full_width";
  cover_image: string | null; cover_image_alt: string | null; seo_title: string | null;
  meta_description: string | null; canonical_slug: string | null; social_image: string | null;
  content_blocks: SectionBlock[]; custom_fields: { name: string; label: string; type: string; required: boolean }[];
  custom_field_values: Record<string, unknown>; created_at: string; updated_at: string;
};
export const getPublicSections = (placement: "home" | "full" = "home") =>
  apiGet<PortfolioSection[]>(`api/sections?placement=${placement}`, "array");
export const getPublicSection = (slug: string) =>
  apiGet<PortfolioSection>(`api/sections/${encodeURIComponent(slug)}`, "object");
