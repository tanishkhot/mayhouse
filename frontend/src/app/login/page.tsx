"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthAPI, setAccessToken } from "@/lib/api";
import { useState, useEffect, Suspense } from "react";

const LoginPageContent = () => {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If redirected back from OAuth with token (future), handle here.
  useEffect(() => {
    const oauthError = sp.get("error");
    if (oauthError) setError(oauthError);
  }, [sp]);

  const { mutate: login, isPending } = useMutation({
    mutationFn: () => AuthAPI.login({ email, password }),
    onSuccess: (data) => {
      console.log('Login successful, storing token:', data.access_token);
      console.log('User role:', data.user.role);
      setAccessToken(data.access_token);
      
      // Role-based routing
      if (data.user.role === 'admin') {
        console.log('Admin login - redirecting to /admin');
        router.replace("/admin");
      } else {
        console.log('User/Host login - redirecting to /explore');
        router.replace("/"); // This is the explore page
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      setError("Invalid credentials. Please try again.");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Log in</h1>

        {error && (
          <div className="rounded-md bg-red-100 text-red-800 px-3 py-2 text-sm">{error}</div>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            login();
          }}
        >
          <div className="space-y-1">
            <label className="block text-sm">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
          >
            {isPending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">or</div>

        <a
          href={AuthAPI.googleOAuthLoginUrl()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border py-2"
        >
          Continue with Google
        </a>

        <p className="text-sm text-center">
          Don&apos;t have an account? <a className="underline" href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
    </div>}>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;