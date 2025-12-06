import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function AdminLegacyPage() {
  const session = await getAuthSession();
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) {
    redirect("/auth/signin");
  }

  redirect("/admin");
}
