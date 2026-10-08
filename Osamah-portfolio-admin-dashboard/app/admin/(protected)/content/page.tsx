import type { Metadata } from "next";
import { AchievementsManager } from "@/components/admin/content/achievements-manager";
import { MediaManager } from "@/components/admin/content/media-manager";
import { ProfileEditor } from "@/components/admin/content/profile-editor";
import { SkillsManager } from "@/components/admin/content/skills-manager";
import { SocialLinksManager } from "@/components/admin/content/social-links-manager";
import { EmptyState } from "@/components/ui/state-panel";
import { PageHeader } from "@/components/ui/page-header";
import { isProfileResponse, type Profile } from "@/lib/api/profile";
import { isSkillCategoryResponse, isSkillResponse, type Skill, type SkillCategory } from "@/lib/api/skills";
import { isAchievementResponse, type Achievement } from "@/lib/api/achievements";
import { isSocialLinkResponse, type SocialLink } from "@/lib/api/social-links";
import { isMediaResponse, type Media } from "@/lib/api/media";
import { callProjectsBackend } from "@/lib/api/projects-server";

export const metadata: Metadata = { title: "Content" };

const contentSections = [
  { id: "profile", label: "Profile" },
  { id: "skills", label: "Skills" },
  { id: "achievements", label: "Achievements" },
  { id: "social-links", label: "Social links" },
  { id: "media", label: "Media" },
] as const;

export default async function ContentAdminPage() {
  const [profileResult, categoryResult, skillResult, achievementResult, socialLinkResult, mediaResult] = await Promise.all([
    callProjectsBackend("/api/profile", "GET"),
    callProjectsBackend("/api/skill-categories", "GET"),
    callProjectsBackend("/api/skills", "GET"),
    callProjectsBackend("/api/achievements", "GET"),
    callProjectsBackend("/api/social-links", "GET"),
    callProjectsBackend("/api/admin/media", "GET"),
  ]);

  const initialProfile: Profile | null = profileResult.status >= 200 && profileResult.status < 300 && isProfileResponse(profileResult.body)
    ? profileResult.body : null;
  const initialProfileError: "not_found" | "unavailable" | null = initialProfile ? null : profileResult.status === 404 ? "not_found" : "unavailable";
  const initialCategories: SkillCategory[] | null = categoryResult.status >= 200 && categoryResult.status < 300 && Array.isArray(categoryResult.body) && categoryResult.body.every(isSkillCategoryResponse)
    ? categoryResult.body : null;
  const initialSkills: Skill[] | null = skillResult.status >= 200 && skillResult.status < 300 && Array.isArray(skillResult.body) && skillResult.body.every(isSkillResponse)
    ? skillResult.body : null;
  const initialAchievements: Achievement[] | null = achievementResult.status >= 200 && achievementResult.status < 300 && Array.isArray(achievementResult.body) && achievementResult.body.every(isAchievementResponse)
    ? achievementResult.body : null;
  const initialSocialLinks: SocialLink[] | null = socialLinkResult.status >= 200 && socialLinkResult.status < 300 && Array.isArray(socialLinkResult.body) && socialLinkResult.body.every(isSocialLinkResponse)
    ? socialLinkResult.body : null;
  const initialMedia: Media[] | null = mediaResult.status >= 200 && mediaResult.status < 300 && Array.isArray(mediaResult.body) && mediaResult.body.every(isMediaResponse)
    ? mediaResult.body : null;

  return (
    <>
      <PageHeader
        eyebrow="CONTENT / PORTFOLIO"
        title="Content"
        description="Profile and supporting content sections for the public portfolio."
      />

      <nav aria-label="Content sections" className="mb-7 flex gap-1 overflow-x-auto border-b border-border">
        {contentSections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-sm text-ink-muted transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-offset-[-2px]"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="space-y-5">
        {contentSections.map(({ id, label }) => (
          <section key={id} id={id} className="scroll-mt-24 border border-border bg-surface p-4 sm:p-5">
            <h2 className="mb-4 font-serif text-xl font-normal text-ink">{label}</h2>
            {id === "profile" ? <ProfileEditor initialProfile={initialProfile} initialError={initialProfileError} /> :
              id === "skills" ? <SkillsManager initialCategories={initialCategories} initialSkills={initialSkills} /> :
                id === "achievements" ? <AchievementsManager initialAchievements={initialAchievements} /> :
                    id === "social-links" ? <SocialLinksManager initialSocialLinks={initialSocialLinks} /> :
                      id === "media" ? <MediaManager initialMedia={initialMedia} /> :
                <EmptyState
                  title={`${label} editor will be added later`}
                  description="This section will be added in a later phase."
                  className="bg-canvas"
                />}
          </section>
        ))}
      </div>
    </>
  );
}
