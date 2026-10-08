import { LoadingState } from "@/components/ui/state-panel";

export default function Loading() {
  return <LoadingState title="Loading certificates" description="Fetching records from the portfolio API." />;
}
