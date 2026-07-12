import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getPlacementStatus, PLACEMENT_PROMPTS } from "@/lib/learning/placement";
import { PlacementWizard } from "@/components/placement/PlacementWizard";

export const dynamic = "force-dynamic";

export default async function PlacementPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/placement");

  const status = await getPlacementStatus(user.id);
  if (status.done) redirect("/dashboard");

  return (
    <PlacementWizard
      english={PLACEMENT_PROMPTS.ENGLISH}
      german={PLACEMENT_PROMPTS.GERMAN}
    />
  );
}
