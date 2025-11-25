// app/update-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user has a valid session (they should after clicking reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage(
        "✅ Password updated successfully! You can now sign in with your new password."
      );
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 mb-4">
            <Lock size={48} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Set New Password
          </h2>
          <p className="text-gray-600">
            Create a new password for your account
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          {message && (
            <div
              className={`p-3 rounded-lg text-center ${
                message.includes("error")
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
