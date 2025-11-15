"use client";

import { useQuery } from "@tanstack/react-query";
import { AuthAPI, setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthenticatedRoute } from '@/components/ProtectedRoute';
import { ProfilePageSkeleton } from '@/components/skeletons';

export default function ProfilePage() {
  const router = useRouter();

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
    } else if (user?.id) {
      // Redirect to new profile page
      router.replace(`/users/${user.id}`);
    }
  }, [isError, user, router]);

  if (isLoading) {
    return (
      <AuthenticatedRoute skeleton={<ProfilePageSkeleton />}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </AuthenticatedRoute>
    );
  }

  return null; // Will redirect
}