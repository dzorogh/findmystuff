"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import AddUserForm from "@/components/forms/add-user-form";
import EditUserForm from "@/components/forms/edit-user-form";
import { apiClient } from "@/lib/api-client";

interface UsersManagerProps {
  isLoading?: boolean;
}

const UsersManager = ({ isLoading: externalLoading }: UsersManagerProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldOpenCreateForm = searchParams.get("create") === "1";

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUsers();
      if (response.error) {
        throw new Error(response.error);
      }
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка загрузки пользователей"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (shouldOpenCreateForm) {
      setAddFormOpen(true);
    }
  }, [shouldOpenCreateForm]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const response = await apiClient.deleteUser(userToDelete.id);

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Пользователь успешно удален");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        error instanceof Error ? error.message : "Ошибка удаления пользователя"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };


  if (isLoading || externalLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Пользователи не найдены</p>
        </div>
      ) : (
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead>Последний вход</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.email || user.phone || "—"}
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(user)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Редактировать пользователя</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(user)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Удалить пользователя</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      <AddUserForm
        open={addFormOpen}
        onOpenChange={(open) => {
          setAddFormOpen(open);
          if (!open && shouldOpenCreateForm) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("create");
            const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
            router.replace(nextUrl, { scroll: false });
          }
        }}
        onSuccess={fetchUsers}
      />

      {userToEdit && (
        <EditUserForm
          user={userToEdit}
          open={editFormOpen}
          onOpenChange={(open) => {
            setEditFormOpen(open);
            if (!open) {
              setUserToEdit(null);
            }
          }}
          onSuccess={fetchUsers}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить пользователя{" "}
              <strong>{userToDelete?.email || userToDelete?.phone || "без email/телефона"}</strong>?
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UsersManager;
