import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type StatePanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function Panel({
  icon,
  title,
  description,
  action,
  className = "",
  role,
}: StatePanelProps & { icon: ReactNode; role?: "status" | "alert" }) {
  return (
    <div
      role={role}
      className={`border border-border bg-surface px-5 py-8 text-center sm:px-8 ${className}`}
    >
      <div className="mx-auto mb-4 flex size-10 items-center justify-center border border-border bg-canvas text-ink-muted">
        {icon}
      </div>
      <h2 className="text-base font-medium text-ink">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function EmptyState(props: StatePanelProps) {
  return <Panel {...props} icon={<Inbox size={18} aria-hidden="true" />} />;
}

export function LoadingState({ title = "Loading", description }: Partial<StatePanelProps>) {
  return (
    <Panel
      title={title}
      description={description ?? "Please wait while this workspace loads."}
      icon={<LoaderCircle size={18} className="animate-spin" aria-hidden="true" />}
      role="status"
    />
  );
}

export function ErrorState(props: StatePanelProps) {
  return <Panel {...props} icon={<AlertCircle size={18} aria-hidden="true" />} role="alert" />;
}

