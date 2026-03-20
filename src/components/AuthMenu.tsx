"use client";

import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function AuthMenu({ userEmail }: { userEmail: string | undefined }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    // Hard refresh to completely clear all states uniformly
    window.location.href = pathname || "/";
  };
  
  if (!userEmail) {
    return (
      <Link 
        href={`/login${pathname && pathname !== "/" ? `?next=${pathname}` : ""}`} 
        className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-full transition-colors active:scale-95 border border-indigo-100 shadow-sm"
      >
        Sign In
      </Link>
    );
  }
  
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Link 
        href="/dashboard" 
        className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1.5 bg-white border border-gray-200 py-2 px-4 rounded-full shadow-sm hover:shadow-md active:scale-95 leading-none"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      <button 
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-all border border-transparent hover:border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Sign Out"
      >
        {isSigningOut ? (
          <Loader2 className="w-4 h-4 animate-spin disabled:text-red-600" />
        ) : (
          <LogOut className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}