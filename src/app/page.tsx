// src/app/page.tsx
"use client";

import dynamic from "next/dynamic";

const ARScanner = dynamic(() => import("@/components/ARGameWrapper"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="w-full h-screen">
      <ARScanner />

      
    </div>
  );
}
