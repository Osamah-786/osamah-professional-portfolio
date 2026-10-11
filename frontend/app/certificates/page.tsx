import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import type { Metadata } from "next";
import { PortfolioFooter } from "@/components/layout/PortfolioFooter";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { publicNavigationLinks } from "@/components/layout/public-navigation";
import { ApiError } from "@/lib/api/client";
import { getCertificates } from "@/lib/api/certificates";
import type { Certificate } from "@/types/api";

export const metadata: Metadata = {
  title: "Certificates",
  description:
    "Review Osamah’s professional learning credentials and certificates.",
};

function formatIssueDate(date: string | null): string | null {
  if (!date) return null;

  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

async function loadCertificates(): Promise<Certificate[] | null> {
  try {
    return await getCertificates();
  } catch (error) {
    const reason = error instanceof ApiError
      ? `${error.kind}${error.statusCode ? ` ${error.statusCode}` : ""}`
      : "unexpected error";
    console.error(`[certificates] archive request failed (${reason}).`);
    return null;
  }
}

export default async function CertificatesPage() {
  const certificates = await loadCertificates();
  const unavailable = certificates === null;
  const records = certificates ?? [];

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:bg-surface-raised focus:px-4 focus:py-3 focus:text-ink"
      >
        Skip to content
      </a>

      <Navbar brand="PORTFOLIO" links={publicNavigationLinks} />

      <main id="main-content">
        <Section aria-labelledby="certificates-title" className="pb-10 sm:pb-14 lg:pb-16">
          <Container>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted no-underline transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Portfolio
            </Link>
            <Reveal>
              <SectionHeading
                id="certificates-title"
                as="h1"
                eyebrow="CREDENTIAL ARCHIVE"
                title="Certificates"
                description="A record of professional learning credentials and certifications, with issuer and verification details where available."
                className="mt-10 lg:mt-14"
              />
              {!unavailable ? (
                <p className="mt-8 font-mono text-xs tracking-[0.08em] text-ink-muted">
                  {String(records.length).padStart(2, "0")} CREDENTIALS
                </p>
              ) : null}
            </Reveal>
          </Container>
        </Section>

        <Divider />

        <Section aria-label="Certificate archive" className="py-2 sm:py-5">
          <Container>
            {unavailable ? (
              <p role="status" className="py-16 text-center text-sm text-ink-secondary">
                Certificates are currently unavailable.
              </p>
            ) : records.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-secondary">
                No certificates available yet.
              </p>
            ) : (
              <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                {records.map((certificate, index) => {
                  const issueDate = formatIssueDate(certificate.issue_date);
                  const hasActions = certificate.credential_url || certificate.certificate_file;

                  return (
                    <li key={certificate.id} className="min-w-0">
                      <Reveal delay={index * 0.04}>
                        <article className="h-full border-t border-border pt-4">
                          <figure className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border border-border bg-surface">
                            {certificate.certificate_image ? (
                              <ImageWithFallback
                                src={certificate.certificate_image}
                                alt={`Certificate: ${certificate.title}${certificate.issuer ? `, issued by ${certificate.issuer}` : ""}`}
                                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                                className="object-contain p-3 sm:p-5"
                                fallback={<span className="font-mono text-[0.65rem] tracking-[0.08em] text-ink-muted">PREVIEW UNAVAILABLE</span>}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-ink-muted">
                                <FileText size={26} strokeWidth={1.25} aria-hidden="true" />
                                <span className="font-mono text-[0.65rem] tracking-[0.08em]">NO PREVIEW AVAILABLE</span>
                              </div>
                            )}
                          </figure>
                          <div className="min-w-0 pt-5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.68rem] tracking-[0.07em] text-ink-muted">
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              {issueDate ? (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{issueDate}</span>
                                </>
                              ) : null}
                              {certificate.issuer ? (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{certificate.issuer}</span>
                                </>
                              ) : null}
                              {certificate.featured ? <Badge tone="accent">FEATURED</Badge> : null}
                            </div>

                            <h2 className="mt-4 break-words text-xl font-medium tracking-tight sm:text-2xl">
                              {certificate.title}
                            </h2>
                            {certificate.description ? (
                              <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-7 text-ink-secondary sm:text-base">
                                {certificate.description}
                              </p>
                            ) : null}

                            {hasActions ? (
                              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                                {certificate.credential_url ? (
                                  <a
                                    href={certificate.credential_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-secondary underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                                  >
                                    Verify Credential
                                    <ArrowUpRight size={14} aria-hidden="true" />
                                  </a>
                                ) : null}
                                {certificate.certificate_file ? (
                                  <a
                                    href={certificate.certificate_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-secondary underline decoration-border underline-offset-4 transition-colors hover:text-ink hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                                  >
                                    <FileText size={15} aria-hidden="true" />
                                    View Certificate PDF
                                    <ArrowUpRight size={14} aria-hidden="true" />
                                  </a>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            )}
          </Container>
        </Section>
      </main>

      <PortfolioFooter name={null} socialLinks={[]} />
    </>
  );
}
