import { EmptyState } from "@/components/ui/EmptyState";
import { NeoLink } from "@/components/ui/neo";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-3 py-12">
      <EmptyState
        title="Page not found"
        body="This page may have moved or no longer exists."
        action={<NeoLink href="/dashboard">Dashboard</NeoLink>}
      />
    </div>
  );
}