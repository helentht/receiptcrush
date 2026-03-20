"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export function AuthMenu({ userEmail }: { userEmail: string | undefined }) {
  const router = useRouter();
  const supabase = createClient();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refresh to update server-side components (like Header)
    router.push("/"); // Return to home safely
  };
  
  if (!userEmail) {
    return (
      <Link 
        href="/login" 
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
        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-all border border-transparent hover:border-red-100"
        title="Sign Out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}