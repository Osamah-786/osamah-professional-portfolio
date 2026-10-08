import Image from "next/image";
import { ArrowRight, ArrowUpRight, FileText } from "lucide-react";
import type { Certificate } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
            <ol className="mt-9">
              {certificates.map((certificate, index) => {
                const issueDate = formatIssueDate(certificate.issue_date);

                return (
                  <li key={certificate.id}>
                    <article className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 py-5 sm:grid-cols-[2.5rem_5rem_minmax(0,1fr)_auto] sm:gap-x-6">
                      <span className="row-span-2 self-start pt-1 font-mono text-xs text-ink-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {certificate.certificate_image ? (
                        <div className="relative row-span-2 hidden aspect-[4/5] w-16 overflow-hidden border border-border bg-surface sm:block sm:w-20">
                          <Image
                            src={certificate.certificate_image}
                            alt={`Certificate preview: ${certificate.title}`}
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-medium leading-snug sm:text-lg">
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
                      <div className="col-start-2 mt-2 flex flex-wrap items-center justify-between gap-3 font-mono text-[0.68rem] tracking-[0.05em] text-ink-muted sm:col-start-4 sm:row-start-1 sm:mt-0 sm:justify-end">
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
                    {index < certificates.length - 1 ? <Divider /> : null}
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
