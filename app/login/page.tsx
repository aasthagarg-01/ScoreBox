"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({ email, password });
    setIsError(!!error);
    setMessage(error ? error.message : "Signup successful! Check your email to confirm.");
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0B0F14] via-[#0F1620] to-[#0B0F14]" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold mb-2">
            Score<span className="text-[#00D9A3]">Box</span>
          </h1>
          <p className="text-[#8A97A6] text-sm">Log in or create an account to save your teams.</p>
        </div>

        <div className="bg-[#151B23] border border-[#1C242E] rounded-xl p-6 font-[family-name:var(--font-body)]">
          <label className="block text-xs text-[#8A97A6] mb-1.5">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0B0F14] border border-[#1C242E] rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-[#00D9A3]"
          />

          <label className="block text-xs text-[#8A97A6] mb-1.5">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0B0F14] border border-[#1C242E] rounded-lg px-3 py-2.5 text-sm mb-5 focus:outline-none focus:border-[#00D9A3]"
          />

          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              className="flex-1 bg-[#00D9A3] text-[#0B0F14] font-medium text-sm rounded-lg py-2.5 hover:bg-[#00c493] transition-colors"
            >
              Log In
            </button>
            <button
              onClick={handleSignup}
              className="flex-1 border border-[#1C242E] text-[#E8EDF2] text-sm rounded-lg py-2.5 hover:border-[#00D9A3] transition-colors"
            >
              Sign Up
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-sm ${isError ? "text-[#FF6B6B]" : "text-[#00D9A3]"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}