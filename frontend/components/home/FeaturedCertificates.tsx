import { ArrowRight, ArrowUpRight, FileText } from "lucide-react";
import type { Certificate } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

type FeaturedCertificatesProps = {
  certificates: readonly Certificate[];
};

function formatIssueDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function FeaturedCertificates({ certificates }: FeaturedCertificatesProps) {
  return (
    <Section id="certificates" aria-labelledby="certificates-title" className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading
            id="certificates-title"
            eyebrow="04 / CREDENTIAL ARCHIVE"
            title="Selected certificates."
            description="A compact index of professional learning and verified credentials."
          />

          {certificates.length > 0 ? (
            <ol className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate, index) => {
                const issueDate = formatIssueDate(certificate.issue_date);

                return (
                  <li key={certificate.id}>
                    <article className="h-full border-t border-border pt-3">
                      <figure className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-border bg-surface">
                        {certificate.certificate_image ? (
                          <ImageWithFallback
                            src={certificate.certificate_image}
                            alt={`Certificate preview: ${certificate.title}`}
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                            className="object-contain p-3"
                            fallback={<span className="font-mono text-[0.65rem] tracking-[0.08em] text-ink-muted">PREVIEW UNAVAILABLE</span>}
                          />
                        ) : <FileText size={24} strokeWidth={1.25} className="text-ink-muted" aria-hidden="true" />}
                      </figure>
                      <div className="min-w-0 pt-4">
                        <p className="font-mono text-[0.65rem] tracking-[0.07em] text-ink-muted">{String(index + 1).padStart(2, "0")}</p>
                        <h3 className="mt-2 break-words text-base font-medium leading-snug sm:text-lg">
                          {certificate.title}
                        </h3>
                        {certificate.issuer ? (
                          <p className="mt-1 text-sm text-ink-muted">{certificate.issuer}</p>
                        ) : null}
                        {certificate.description ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">
                            {certificate.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 font-mono text-[0.68rem] tracking-[0.05em] text-ink-muted">
                        {issueDate ? <span>{issueDate}</span> : null}
                        {certificate.credential_url ? (
                          <a
                            href={certificate.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-1 text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                          >
                            Credential <ArrowUpRight size={13} aria-hidden="true" />
                          </a>
                        ) : null}
                        {certificate.certificate_file ? (
                          <a
                            href={certificate.certificate_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-1 text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                          >
                            <FileText size={13} aria-hidden="true" />
                            PDF
                          </a>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-8 border-t border-border pt-5 text-sm text-ink-muted">
              No featured certificates are available yet.
            </p>
          )}

          <div className="mt-7 flex justify-end">
            <Button href="/certificates" variant="text">
              View all certificates <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
