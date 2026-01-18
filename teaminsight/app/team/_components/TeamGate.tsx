"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      console.log("[TeamGate] Checking auth...");
      try {
        const res = await fetch("/api/team/me", { credentials: "include" });
        const data = await res.json();

        console.log("[TeamGate] Response:", data);

        if (!data?.team) {
          console.log("[TeamGate] No team, redirecting to /team/join");
          router.replace("/team/join");
          return;
        }

        console.log("[TeamGate] Auth OK, showing content");
        setReady(true);
      } catch (err) {
        console.log("[TeamGate] Error:", err);
        router.replace("/team/join");
      }
    }
    check();
  }, [router]);

  if (!ready) {
    console.log("[TeamGate] Not ready, returning null");
    return null;
  }
  return <>{children}</>;
}
