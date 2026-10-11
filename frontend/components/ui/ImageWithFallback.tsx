"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  sizes: string;
  className: string;
  fallback: ReactNode;
  priority?: boolean;
};

export function ImageWithFallback({
  src,
  alt,
  sizes,
  className,
  fallback,
  priority = false,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="absolute inset-0">{fallback}</div>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
