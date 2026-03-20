import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuthMenu } from "./AuthMenu";

export async function Header() {
  const supabase = createClient();
  // Fetch user session safely
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
            <Receipt className="text-white w-4 h-4" />
          </div>
          <span className="font-extrabold text-gray-900 tracking-tight text-lg">
            ReceiptCrush
          </span>
        </Link>

        {/* Dynamic Auth Menu */}
        <AuthMenu userEmail={user?.email} />
      </div>
    </header>
  );
}