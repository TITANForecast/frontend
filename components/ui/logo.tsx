import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Logo({
  className = "",
  expanded = false,
}: {
  className?: string;
  expanded?: boolean;
}) {
  return (
    <Link className={cn("block", className)} href="/">
      {expanded ? (
        <Image
          src="/images/logo.png"
          className="w-full"
          alt="Logo"
          width={1000}
          height={222}
        />
      ) : (
        <Image
          src="/images/logo-small.png"
          className="w-full"
          alt="Logo"
          width={1000}
          height={222}
        />
      )}
    </Link>
  );
}
