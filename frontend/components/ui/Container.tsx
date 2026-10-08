import type { ComponentPropsWithoutRef } from "react";

type ContainerProps = ComponentPropsWithoutRef<"div">;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[var(--content-width)] px-5 sm:px-8 lg:px-10 ${className ?? ""}`}
      {...props}
    />
  );
}
