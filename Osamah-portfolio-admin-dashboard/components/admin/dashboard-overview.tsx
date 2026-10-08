import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  FileImage,
  FolderKanban,
  Link2,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/state-panel";
import type { DashboardRecord, Skill, SkillCategory } from "@/lib/api/dashboard";

type Resource<T> = { data: T[] | null; error: boolean };

export type DashboardOverviewData = {
  projects: Resource<DashboardRecord>;
  experience: Resource<DashboardRecord>;
  certificates: Resource<DashboardRecord>;
  skillCategories: Resource<SkillCategory>;
  skills: Resource<Skill>;
  achievements: Resource<DashboardRecord>;
  socialLinks: Resource<DashboardRecord>;
  media: Resource<DashboardRecord>;
};

type Metric = {
  label: string;
  resource: Resource<DashboardRecord> | Resource<Skill> | Resource<SkillCategory>;
  icon: LucideIcon;
  href: string;
  featuredCount?: number;
};

function ResourceMetric({ label, resource, icon: Icon, href, featuredCount: featuredCountValue }: Metric) {
  const count = resource.data?.length ?? 0;
  const featuredCount = featuredCountValue ?? null;

  return (
    <Link
      href={href}
      className="group border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-raised focus-visible:outline-offset-4 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[0.67rem] uppercase tracking-[0.08em] text-ink-muted">{label}</span>
        <Icon size={17} strokeWidth={1.7} className="text-accent" aria-hidden="true" />
      </div>
      <div className="mt-6 flex items-end justify-between gap-2">
        <span className="font-serif text-4xl leading-none text-ink">
          {resource.error ? "—" : count}
        </span>
        {featuredCount !== null && !resource.error ? (
          <span className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-muted">
            {featuredCount} featured
          </span>
        ) : null}
        {resource.error ? <Badge tone="error">Unavailable</Badge> : null}
      </div>
    </Link>
  );
}

function RecentItems({ data }: { data: DashboardOverviewData }) {
  const available: Array<{ label: string; href: string; item: DashboardRecord }> = [];
  const sources: Array<{ label: string; href: string; resource: Resource<DashboardRecord> }> = [
    { label: "Project", href: "/admin/projects", resource: data.projects },
    { label: "Experience", href: "/admin/experience", resource: data.experience },
    { label: "Certificate", href: "/admin/certificates", resource: data.certificates },
    { label: "Achievement", href: "/admin/content", resource: data.achievements },
  ];

  for (const source of sources) {
    for (const item of source.resource.data ?? []) {
      if (item.created_at && Number.isFinite(Date.parse(item.created_at))) {
        available.push({ label: source.label, href: source.href, item });
      }
    }
  }

  const recent = available
    .sort((left, right) => Date.parse(right.item.created_at ?? "") - Date.parse(left.item.created_at ?? ""))
    .slice(0, 5);

  if (!recent.length) {
    return (
      <EmptyState
        title="No recent items"
        description="Recently added records will appear here when the API provides their creation dates."
      />
    );
  }

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead className="bg-surface">
          <tr className="border-b border-border font-mono text-[0.63rem] uppercase tracking-[0.08em] text-ink-muted">
            <th scope="col" className="px-4 py-3 font-medium">Item</th>
            <th scope="col" className="px-4 py-3 font-medium">Section</th>
            <th scope="col" className="px-4 py-3 font-medium">Added</th>
          </tr>
        </thead>
        <tbody>
          {recent.map(({ label, href, item }) => (
            <tr key={`${label}-${item.id}`} className="border-b border-border last:border-0">
              <td className="max-w-[20rem] px-4 py-3 text-sm text-ink">
                <Link href={href} className="block truncate hover:text-accent focus-visible:outline-offset-2">
                  {item.title ?? item.company ?? item.name ?? `${label} #${item.id}`}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-ink-muted">{label}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                <time dateTime={item.created_at}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.created_at ?? ""))}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardOverview({ data }: { data: DashboardOverviewData }) {
  const metrics: Metric[] = [
    { label: "Projects", resource: data.projects, icon: FolderKanban, href: "/admin/projects", featuredCount: data.projects.data?.filter((item) => item.featured === true).length },
    { label: "Experience", resource: data.experience, icon: BriefcaseBusiness, href: "/admin/experience", featuredCount: data.experience.data?.filter((item) => item.featured === true).length },
    { label: "Certificates", resource: data.certificates, icon: Award, href: "/admin/certificates", featuredCount: data.certificates.data?.filter((item) => item.featured === true).length },
    { label: "Skill categories", resource: data.skillCategories, icon: Sparkles, href: "/admin/content" },
    { label: "Skills", resource: data.skills, icon: Wrench, href: "/admin/content" },
    { label: "Achievements", resource: data.achievements, icon: BadgeCheck, href: "/admin/content", featuredCount: data.achievements.data?.filter((item) => item.featured === true).length },
    { label: "Social links", resource: data.socialLinks, icon: Link2, href: "/admin/content" },
    { label: "Media", resource: data.media, icon: FileImage, href: "/admin/content" },
  ];
  const allFailed = metrics.every((metric) => metric.resource.error);

  return (
    <div className="space-y-10">
      {allFailed ? (
        <ErrorState title="Dashboard data is unavailable" description="The portfolio API could not provide overview data. Check the connection and reload this page." action={<Link className="border border-border px-4 py-2 text-sm text-ink hover:bg-surface-raised" href="/admin">Reload overview</Link>} />
      ) : (
        <>
          <section aria-labelledby="overview-counts-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">CMS CONTENT</p>
                <h2 id="overview-counts-heading" className="mt-2 font-serif text-2xl text-ink">Content at a glance</h2>
              </div>
              <p className="hidden text-xs text-ink-muted sm:block">Counts reflect records returned by the portfolio API.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => <ResourceMetric key={metric.label} {...metric} />)}
            </div>
          </section>

          <section aria-labelledby="quick-actions-heading">
            <div className="mb-4">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">WORKSPACE</p>
              <h2 id="quick-actions-heading" className="mt-2 font-serif text-2xl text-ink">Quick actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Manage projects", href: "/admin/projects" },
                { label: "Update experience", href: "/admin/experience" },
                { label: "Manage certificates", href: "/admin/certificates" },
                { label: "Edit portfolio content", href: "/admin/content" },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="flex min-h-14 items-center justify-between border border-border bg-surface px-4 text-sm text-ink transition-colors hover:border-accent/50 hover:bg-surface-raised focus-visible:outline-offset-4">
                  {action.label}<span aria-hidden="true" className="text-accent">↗</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="recent-items-heading">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-accent">ACTIVITY</p>
                <h2 id="recent-items-heading" className="mt-2 font-serif text-2xl text-ink">Recently added</h2>
              </div>
              <span className="text-xs text-ink-muted">From available creation timestamps</span>
            </div>
            <RecentItems data={data} />
          </section>
        </>
      )}
    </div>
  );
}
