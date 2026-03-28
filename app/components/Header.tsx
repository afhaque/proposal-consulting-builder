"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-zinc-900 px-6 py-3">
      <h1 className="text-lg font-bold text-white tracking-tight">ProposalCraft</h1>
      <div className="flex items-center gap-3">
        {user.image && (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={28}
            height={28}
            className="rounded-full"
          />
        )}
        <span className="text-sm text-zinc-300">{user.name}</span>
        <button
          onClick={() => signOut()}
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
