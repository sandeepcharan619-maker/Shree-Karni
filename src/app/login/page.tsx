"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function LoginForm() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, [status, session]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "CredentialsSignin") {
        setError("Invalid username/Member ID or password.");
      } else if (errorParam === "Configuration") {
        setError("Configuration error: Please verify your login credentials.");
      } else {
        setError(errorParam);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.ok) {
        // Direct land on /dashboard for associates (and /admin for admin)
        let redirectTarget = "/dashboard";
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (sessionData?.user?.role === "ADMIN") {
            redirectTarget = "/admin";
          } else {
            redirectTarget = "/dashboard";
          }
        } catch {
          if (
            username.trim().toLowerCase() === "admin" ||
            username.trim().toUpperCase() === "SKRADMIN"
          ) {
            redirectTarget = "/admin";
          }
        }

        const customCallback = searchParams.get("callbackUrl");
        if (
          customCallback &&
          customCallback.startsWith("/") &&
          customCallback !== "/" &&
          customCallback !== "/login"
        ) {
          redirectTarget = customCallback;
        }

        // Hard navigate so session cookies are 100% refreshed and user lands immediately on dashboard
        window.location.href = redirectTarget;
      } else {
        setError("Login failed. Please check your credentials.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Shree Karni Real Estate"
              width={280}
              height={60}
              className="mx-auto h-16 w-auto brightness-200 contrast-200"
              priority
            />
          </Link>
          <p className="text-gray-400 mt-3 text-sm">Associate & Property Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-500 text-center mb-6">
            Sign in to access your Associate Dashboard
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username or Member ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all text-gray-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {loading ? "Signing in to Dashboard..." : "Sign In to Dashboard"}
            </button>
          </form>

          {/* Quick links */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link href="/" className="text-gray-500 hover:text-gray-800 transition">
              ← Back to Homepage
            </Link>
            <Link href="/register" className="text-blue-600 hover:underline font-semibold">
              New Associate? Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white">
          Loading login portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
