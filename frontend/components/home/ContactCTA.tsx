import { ArrowRight, Mail } from "lucide-react";
import type { SocialLink } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SocialLinks } from "@/components/home/SocialLinks";

type ContactCTAProps = {
  email: string | null;
  socialLinks: readonly SocialLink[];
};

export function ContactCTA({ email, socialLinks }: ContactCTAProps) {
  return (
    <Section id="contact" aria-labelledby="contact-title" className="border-t border-border">
      <Container>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)] lg:items-end lg:gap-12">
            <div>
              <SectionHeading
                id="contact-title"
                as="h2"
                eyebrow="06 / CONTACT"
                title="Have a problem worth solving?"
                description="Share a little about the challenge, the team, or the system you are building."
              />
              {email ? (
                <div className="mt-7">
                  <Button href={`mailto:${email}`}>
                    <Mail size={16} aria-hidden="true" />
                    Start a conversation
                    <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </div>

            {socialLinks.length > 0 || email ? (
              <div className="border-t border-border pt-5 lg:justify-self-end lg:border-t-0 lg:pt-0">
                {socialLinks.length > 0 ? (
                  <>
                    <p className="font-mono text-[0.68rem] tracking-[0.08em] text-ink-muted">
                      ELSEWHERE
                    </p>
                    <SocialLinks links={socialLinks} className="mt-2" />
                  </>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="mt-3 inline-flex min-h-11 items-center text-sm text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {email}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Contact details are not available right now.</p>
            )}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
