import Image from "next/image";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Profile, SocialLink } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SocialLinks } from "@/components/home/SocialLinks";

type HeroProps = {
  profile: Profile | null;
  profileUnavailable: boolean;
  socialLinks: readonly SocialLink[];
};

export function Hero({ profile, profileUnavailable, socialLinks }: HeroProps) {
  return (
    <Section id="overview" aria-labelledby="hero-title" className="pt-10 sm:pt-14 lg:pt-20">
      <Container>
        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-16">
            <div className="max-w-2xl">
              <p className="font-mono text-xs font-medium tracking-[0.12em] text-accent sm:text-sm">
                PROFILE / PORTFOLIO
              </p>
              <h1 id="hero-title" className="mt-5 break-words text-5xl font-medium leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {profile?.name ?? "Portfolio"}
              </h1>
              {profile?.headline ? (
                <p className="mt-6 max-w-xl break-words text-3xl font-medium leading-tight tracking-[-0.04em] text-ink-secondary sm:text-4xl">
                  {profile.headline}
                </p>
              ) : null}
              {profile?.short_bio ? (
                <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
                  {profile.short_bio}
                </p>
              ) : profileUnavailable ? (
                <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
                  Profile details are temporarily unavailable. Please try again later.
                </p>
              ) : null}
              {profile?.location ? (
                <p className="mt-5 font-mono text-xs tracking-[0.06em] text-ink-muted">
                  {profile.location}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button href="#selected-work">
                  Selected work <ArrowDownRight size={16} aria-hidden="true" />
                </Button>
                <Button href="#contact" variant="secondary">
                  Contact <ArrowRight size={15} aria-hidden="true" />
                </Button>
                {profile?.resume_url ? (
                  <Button href={profile.resume_url} target="_blank" rel="noopener noreferrer" variant="text">
                    Resume <ArrowUpRight size={14} aria-hidden="true" />
                  </Button>
                ) : null}
                {profile ? (
                  <Button href="/about" variant="text">
                    Read more <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                ) : null}
              </div>

              <SocialLinks links={socialLinks} className="mt-8" />
            </div>

            {profile?.profile_image ? (
              <figure className="mx-auto w-full max-w-[27rem] lg:mx-0 lg:justify-self-end">
                <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface">
                  <Image
                    src={profile.profile_image}
                    alt={`Portrait of ${profile.name}`}
                    fill
                    priority
                    sizes="(max-width: 1023px) 90vw, 38vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] text-ink-muted">
                  PROFILE IMAGE
                </figcaption>
              </figure>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
