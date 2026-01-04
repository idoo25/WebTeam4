"use client";

/*
  Lecturer Registration Page
  ===========================
  This page allows creating new lecturer accounts.

  Course alignment:
  - Next.js App Router
  - React Function Component
  - React Hooks (useState)
  - Tailwind CSS (required by course)
  - Fetch API for client-server communication

  Flow:
  UI (form) -> API (/api/lecturer/register) -> response -> success/error
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LecturerRegisterPage() {
    const router = useRouter();

    /*
      State variables (React Hooks):
      - email, password: controlled inputs
      - confirmPassword: password confirmation
      - error: error message from server
      - success: success message
      - loading: indicates request in progress
    */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    /*
      Form submit handler
      -------------------
      Sends POST request to backend registration API
    */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Client-side validation
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/lecturer/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
                setLoading(false);
                return;
            }

            // Successful registration
            setSuccess("Lecturer account created successfully! Redirecting to login...");
            setEmail("");
            setPassword("");
            setConfirmPassword("");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push("/lecturer/login");
            }, 2000);
        } catch {
            setError("Server error");
            setLoading(false);
        }
    }

    /*
      UI rendering using Tailwind CSS
      -------------------------------
      Minimal, clean, and consistent design
      matching the login page style
    */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
            >
                <h1 className="text-2xl font-semibold text-center mb-6">
                    Lecturer Registration
                </h1>

                {/* Email input */}
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
                    placeholder="lecturer@example.com"
                />

                {/* Password input */}
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
                    placeholder="Minimum 6 characters"
                />

                {/* Confirm Password input */}
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
                    placeholder="Re-enter password"
                />

                {/* Error message */}
                {error && (
                    <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded text-center">
                        {error}
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div className="text-green-600 text-sm mb-3 p-2 bg-green-50 rounded text-center">
                        {success}
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                    {loading ? "Creating Account..." : "Create Account"}
                </button>

                {/* Link to login */}
                <div className="text-center mt-4 text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/lecturer/login" className="text-blue-600 hover:underline">
                        Login here
                    </Link>
                </div>
            </form>
        </div>
    );
}
