import { EmptyState } from "@/components/ui/state-panel";
import { PageHeader } from "@/components/ui/page-header";

type WorkspacePageProps = {
  title: string;
  eyebrow: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function WorkspacePage({
  title,
  eyebrow,
  description,
  emptyTitle,
  emptyDescription,
}: WorkspacePageProps) {
  return (
    <>
      <PageHeader title={title} eyebrow={eyebrow} description={description} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </>
  );
}
