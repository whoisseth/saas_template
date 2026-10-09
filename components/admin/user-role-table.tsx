"use client";

import { useState } from "react";
import { UserRole } from "@/lib/admin";
import { Search, Shield, Edit3, User as UserIcon, Check, AlertCircle, Loader2 } from "lucide-react";

export interface SerializedUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string | null;
  image: string | null;
}

interface UserRoleTableProps {
  initialUsers: SerializedUser[];
  currentUserId: string;
}

export function UserRoleTable({ initialUsers, currentUserId }: UserRoleTableProps) {
  const [users, setUsers] = useState<SerializedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "success" | "error"; message: string } | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = u.email.toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      setFeedback({ id: userId, type: "success", message: `Role updated to ${newRole}` });
    } catch (err) {
      setFeedback({
        id: userId,
        type: "error",
        message: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const editorCount = users.filter((u) => u.role === "editor").length;
  const standardCount = users.filter((u) => u.role !== "admin" && u.role !== "editor").length;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Administrators</p>
              <p className="text-xl font-bold">{adminCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Editors</p>
              <p className="text-xl font-bold">{editorCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Standard Users</p>
              <p className="text-xl font-bold">{standardCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search team members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Joined</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No users found matching &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUserId;
                  const isUpdating = updatingId === u.id;
                  const itemFeedback = feedback?.id === u.id ? feedback : null;

                  return (
                    <tr key={u.id} className="transition-colors hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                            {u.name ? u.name.slice(0, 2) : u.email.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              {u.name || "Unnamed User"}
                              {isCurrent && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : u.role === "editor"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : u.role === "editor" ? "Editor" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {itemFeedback && (
                            <span
                              className={`flex items-center gap-1 text-xs ${
                                itemFeedback.type === "success" ? "text-emerald-600" : "text-destructive"
                              }`}
                            >
                              {itemFeedback.type === "success" ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {itemFeedback.message}
                            </span>
                          )}

                          {isUpdating ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              Saving...
                            </div>
                          ) : (
                            <select
                              aria-label={`Role for ${u.name || u.email}`}
                              value={u.role || "user"}
                              disabled={isCurrent}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="rounded border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            >
                              <option value="user">User</option>
                              <option value="editor">Editor (Blog Access)</option>
                              <option value="admin">Admin (Full Access)</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
