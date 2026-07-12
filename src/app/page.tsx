import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { HomeHero } from "@/components/home/HomeHero";

export default async function HomePage() {
  const { isAuthenticated } = getKindeServerSession();
  const authed = await isAuthenticated();
  return <HomeHero authed={!!authed} />;
}
