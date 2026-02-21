"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenant } from "@/contexts/tenant-context";
import { toast } from "sonner";
import TenantOnboarding from "./tenant-onboarding";

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTenantDialog({ open, onOpenChange }: CreateTenantDialogProps) {
  const router = useRouter();
  const { refreshTenants, setActiveTenant } = useTenant();

  function handleSuccess(tenant: { id: number }) {
    refreshTenants().then(() => {
      setActiveTenant(tenant.id);
      toast.success("Склад создан");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новый склад</DialogTitle>
          <DialogDescription>
            Введите название нового склада. После создания вы переключитесь на него.
          </DialogDescription>
        </DialogHeader>
        <TenantOnboarding onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
