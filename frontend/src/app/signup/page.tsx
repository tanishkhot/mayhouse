"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthAPI, setAccessToken } from "@/lib/api";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: signup, isPending } = useMutation({
    mutationFn: () => AuthAPI.signup({ email, password, full_name: fullName, phone: phone || undefined }),
    onSuccess: (data) => {
      console.log('Signup successful, storing token:', data.access_token);
      setAccessToken(data.access_token);
      // Redirect to explore page (homepage) instead of profile
      router.replace("/");
    },
    onError: (error) => {
      console.error('Signup failed:', error);
      setError("Could not sign up. Please try again.");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>

        {error && (
          <div className="rounded-md bg-red-100 text-red-800 px-3 py-2 text-sm">{error}</div>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            signup();
          }}
        >
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account? <a className="underline text-purple-600 hover:text-purple-800" href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}