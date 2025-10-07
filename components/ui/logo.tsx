"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function Logo({
  className = "",
  expanded = false,
}: {
  className?: string;
  expanded?: boolean;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use a consistent image during SSR to prevent hydration mismatch
  const logoSrc = isClient ? (expanded ? "/images/logo.png" : "/images/logo-small.png") : "/images/logo.png";

  return (
    <Link className={cn("block", className)} href="/">
      <Image
        src={logoSrc}
        className="w-full"
        alt="Logo"
        width={1000}
        height={222}
      />
    </Link>
  );
}
