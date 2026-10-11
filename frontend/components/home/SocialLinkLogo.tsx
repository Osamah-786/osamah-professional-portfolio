"use client";

import { Github, Globe, Instagram, Linkedin, Link2, Twitter, Youtube } from "lucide-react";
import { useState } from "react";

type SocialLinkLogoProps = {
  platform: string;
  src: string | null;
};

function DefaultPlatformIcon({ platform }: { platform: string }) {
  const normalized = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.includes("github")) return <Github size={18} aria-hidden="true" className="shrink-0" />;
  if (normalized.includes("linkedin")) return <Linkedin size={18} aria-hidden="true" className="shrink-0" />;
  if (normalized.includes("instagram")) return <Instagram size={18} aria-hidden="true" className="shrink-0" />;
  if (normalized.includes("youtube")) return <Youtube size={18} aria-hidden="true" className="shrink-0" />;
  if (normalized.includes("twitter")) return <Twitter size={18} aria-hidden="true" className="shrink-0" />;
  if (normalized.includes("website") || normalized.includes("web")) return <Globe size={18} aria-hidden="true" className="shrink-0" />;
  return <Link2 size={16} aria-hidden="true" className="shrink-0" />;
}

export function SocialLinkLogo({ platform, src }: SocialLinkLogoProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden" aria-hidden="true">
        {/* Social logo URLs can use arbitrary HTTPS hosts; they are rendered directly in the visitor's browser. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="size-full object-contain" />
      </span>
    );
  }

  if (platform.trim().toLowerCase() === "x") {
    return <span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center font-semibold">X</span>;
  }
  if (platform.trim().toLowerCase() === "kaggle") {
    return <span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center font-semibold">K</span>;
  }
  return <span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center"><DefaultPlatformIcon platform={platform} /></span>;
}
