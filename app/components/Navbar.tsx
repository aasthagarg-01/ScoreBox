"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1C242E] bg-[#0B0F14]/90 backdrop-blur">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#E8EDF2]">
          Score<span className="text-[#00D9A3]">Box</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-[family-name:var(--font-body)]">
          <Link
            href="/"
            className={`transition-colors ${pathname === "/" ? "text-[#00D9A3]" : "text-[#8A97A6] hover:text-[#E8EDF2]"}`}
          >
            Search
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className={`transition-colors ${pathname === "/dashboard" ? "text-[#00D9A3]" : "text-[#8A97A6] hover:text-[#E8EDF2]"}`}
            >
              Dashboard
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-[#8A97A6] hidden sm:inline">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-md border border-[#1C242E] text-[#E8EDF2] hover:border-[#00D9A3] transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-md bg-[#00D9A3] text-[#0B0F14] font-medium hover:bg-[#00c493] transition-colors"
            >
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}