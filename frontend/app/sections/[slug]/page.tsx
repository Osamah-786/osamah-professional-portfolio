import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { PortfolioFooter } from "@/components/layout/PortfolioFooter";
import { SectionDetail } from "@/components/sections/SectionDetail";
import { getPublicSection } from "@/lib/api/sections";
import { ApiError } from "@/lib/api/client";
import { getProfile } from "@/lib/api/profile";
import type { Profile } from "@/types/api";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
async function load(slug: string) { try { return await getPublicSection(slug); } catch (error) { if (error instanceof ApiError && error.statusCode === 404) notFound(); throw error; } }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const section = await load(slug);
  return { title: section.seo_title ?? section.title, description: section.meta_description ?? section.short_description ?? undefined, alternates: section.canonical_slug ? { canonical: `/sections/${section.canonical_slug}` } : undefined, openGraph: section.social_image ? { images: [section.social_image] } : undefined };
}
export default async function SectionPage({ params }: Props) {
  const { slug } = await params; const section = await load(slug);
  let profile: Profile | null = null;
  if (section.key === "profile") { try { profile = await getProfile(); } catch { profile = null; } }
  return <><Navbar brand="PORTFOLIO" links={[{ href: "/", label: "Home" }, { href: "/projects", label: "Projects" }, { href: "/certificates", label: "Certificates" }]} /><SectionDetail section={section} profile={profile} /><PortfolioFooter name={profile?.name ?? null} socialLinks={[]} /></>;
}
