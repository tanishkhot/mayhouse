"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthAPI, setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthenticatedRoute } from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: AuthAPI.me,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      console.log('Profile fetch failed, redirecting to login');
      // Clear any stale token and redirect to login
      setAccessToken(null);
      router.replace("/login");
    }
  }, [isError, router]);

  const [form, setForm] = useState(() => ({
    full_name: user?.full_name || "",
    username: user?.username || "",
    phone: user?.phone || "",
    bio: (user as { bio?: string })?.bio || "",
    profile_image_url: user?.profile_image_url || "",
  }));

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: () => AuthAPI.updateMe(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const { mutate: logout, isPending: loggingOut } = useMutation({
    mutationFn: AuthAPI.logout,
    onSuccess: () => {
      setAccessToken(null);
      qc.clear();
      router.replace("/login");
    },
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!user) return null;

  return (
    <AuthenticatedRoute>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <button
            onClick={() => logout()}
            disabled={loggingOut}
            className="rounded-md border px-3 py-2 text-sm"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Full name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm">Profile image URL</label>
              <input
                type="url"
                value={form.profile_image_url}
                onChange={(e) => setForm((f) => ({ ...f, profile_image_url: e.target.value }))}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedRoute>
  );
}