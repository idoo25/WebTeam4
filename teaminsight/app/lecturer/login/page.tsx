"use client";

/*
  Lecturer Login Page
  ==================
  This page allows a lecturer to log into the system.

  Course alignment:
  - Next.js App Router
  - React Function Component
  - React Hooks (useState)
  - Tailwind CSS (required by course)
  - Fetch API for client-server communication

  Flow:
  UI (form) -> API (/api/lecturer/login) -> response -> navigation
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LecturerLoginPage() {
  /*
    Router is used for client-side navigation
    after successful login
  */
  const router = useRouter();

  /*
    State variables (React Hooks):
    - email, password: controlled inputs
    - error: error message from server
    - loading: indicates request in progress
  */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /*
    Form submit handler
    -------------------
    Sends POST request to backend login API
  */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lecturer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Successful login -> navigate to dashboard
      router.push("/lecturer/dashboard");
    } catch {
      setError("Server error");
      setLoading(false);
    }
  }

  /*
    UI rendering using Tailwind CSS
    -------------------------------
    Minimal, clean, and consistent design
    suitable for all lecturer pages
  */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h1 className="text-2xl font-semibold text-center mb-6">
          Lecturer Login
        </h1>

        {/* Email input */}
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
        />

        {/* Password input */}
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
        />

        {/* Error message */}
        {error && (
          <div className="text-red-600 text-sm mb-3 text-center">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Link to registration */}
        <div className="text-center mt-4 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/lecturer/register" className="text-blue-600 hover:underline">
            Create one here
          </Link>
        </div>
      </form>
    </div>
  );
}
