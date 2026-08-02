"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const router = useRouter();

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Signup successful! Check your email to confirm.");
  }

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      router.push("/");
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 400 }}>
      <h1>Login / Sign Up</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 8, width: "100%" }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10, padding: 8, width: "100%" }}
      />
      <button onClick={handleLogin} style={{ marginRight: 10, padding: "8px 16px" }}>Log In</button>
      <button onClick={handleSignup} style={{ padding: "8px 16px" }}>Sign Up</button>
      {message && <p style={{ marginTop: 15, color: "crimson" }}>{message}</p>}
    </main>
  );
}