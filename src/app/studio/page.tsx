import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin"
import NooreWebStudio from "@/components/studio/noore-web-studio"

export const dynamic = "force-dynamic"

export default async function StudioPage() {
  const { session } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!session) redirect("/login?callbackUrl=/studio")
  return <NooreWebStudio />
}
