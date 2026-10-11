"use client";

import { Github, Globe, Instagram, Linkedin, Youtube } from "lucide-react";
import { useState } from "react";

type Props = { platform: string; src: string | null; className?: string };

function DefaultPlatformIcon({ platform }: { platform: string }) {
  const normalized = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.includes("github")) return <Github size={22} aria-hidden="true" />;
  if (normalized.includes("linkedin")) return <Linkedin size={22} aria-hidden="true" />;
  if (normalized.includes("instagram")) return <Instagram size={22} aria-hidden="true" />;
  if (normalized.includes("youtube")) return <Youtube size={22} aria-hidden="true" />;
  if (normalized.includes("website") || normalized.includes("web")) return <Globe size={22} aria-hidden="true" />;
  return <span className="font-medium">{platform.trim().slice(0, 1).toUpperCase() || "•"}</span>;
}

export function SocialPlatformLogo({ platform, src, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const normalized = platform.trim().toLowerCase();

  if (src && !failed) {
    return (
      <span className={`inline-flex size-12 shrink-0 items-center justify-center overflow-hidden border border-border bg-canvas p-2 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={`${platform} logo preview`} referrerPolicy="no-referrer" onError={() => setFailed(true)} className="size-full object-contain" />
      </span>
    );
  }

  return (
    <span className={`inline-flex size-12 shrink-0 items-center justify-center border border-border bg-canvas text-ink-secondary ${className}`} aria-label={`${platform} default logo`}>
      {normalized === "x" || normalized.includes("twitter") ? <span className="font-semibold">X</span> :
        normalized === "kaggle" ? <span className="font-semibold">K</span> :
          <DefaultPlatformIcon platform={platform} />}
    </span>
  );
}
