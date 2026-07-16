"use client";

import { ErrorState } from "@/components/ui/EmptyState";
import { NeoButton } from "@/components/ui/neo";

export default function Error({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-3 py-12">
      <ErrorState
        title="Something went wrong"
        body="Your data is safe. Try loading this page again."
        action={<NeoButton onClick={unstable_retry}>Try again</NeoButton>}
      />
    </div>
  );
}