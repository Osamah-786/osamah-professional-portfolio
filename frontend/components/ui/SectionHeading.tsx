import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  as = "h2",
  id,
  className,
}: SectionHeadingProps) {
  const Heading = as;

  return (
    <div className={`max-w-3xl ${className ?? ""}`}>
      <p className="font-mono text-xs font-medium tracking-[0.1em] text-accent">
        {eyebrow}
      </p>
      <Heading id={id} className="mt-4 text-3xl sm:text-4xl lg:text-5xl">
        {title}
      </Heading>
      {description ? (
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary sm:text-lg">
          {description}
        </div>
      ) : null}
    </div>
  );
}
