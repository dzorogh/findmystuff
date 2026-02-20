import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/users/server";
import { getServerTenantCount } from "@/lib/tenants/server-queries";
import TenantOnboarding from "@/components/tenant-onboarding/tenant-onboarding";

export default async function OnboardingPage() {
  const user = await getServerUser();
  if (!user) redirect("/auth/login");

  const tenantCount = await getServerTenantCount(user.id);
  if (tenantCount > 0) redirect("/");

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Создайте склад</h1>
          <p className="mt-2 text-muted-foreground">
            Создайте тенант для хранения вещей
          </p>
        </div>
        <TenantOnboarding />
      </div>
    </div>
  );
}
