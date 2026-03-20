"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  ArrowRight,
  Sparkles,
  Users,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("HKD");
  const [error, setError] = useState("");

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    // PRD FR-1.2: Room codes 4-6 characters. Let's do 5 characters for an optimal balance.
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateSession = async () => {
    setIsCreating(true);
    setError("");

    let roomCode = generateRoomCode();
    let isCodeUnique = false;
    let attempts = 0;

    // Ensure uniqueness, fallback just in case
    while (!isCodeUnique && attempts < 3) {
      const { error } = await supabase
        .from("sessions")
        .insert([{ room_code: roomCode, base_currency: baseCurrency }])
        .select()
        .single();

      if (!error) {
        isCodeUnique = true;
      } else if (error.code === "23505") {
        // Postgres unique constraint violation code
        roomCode = generateRoomCode();
        attempts++;
      } else {
        console.error(error);
        break; // Other unknown error
      }
    }

    if (!isCodeUnique) {
      setError("Failed to create session. Please try again.");
      setIsCreating(false);
      return;
    }

    // Redirect to the new room
    router.push(`/${roomCode}`);
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setError("");

    const code = joinCode.toUpperCase().trim();

    // Verify room exists
    const { data, error } = await supabase
      .from("sessions")
      .select("id")
      .eq("room_code", code)
      .single();

    if (error || !data) {
      setError("Room not found. Please check the code and try again.");
      setIsJoining(false);
      return;
    }

    router.push(`/${code}`);
  };

  return (
    <main className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Receipt className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            ReceiptCrush
          </h1>
          <p className="text-gray-500 font-medium">
            Split travel expenses with friends in 3 easy steps.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 font-medium tracking-tight animate-fade-in">
            {error}
          </div>
        )}

        <div className="space-y-6 pt-4">
          {/* Create Room */}
          <div className="space-y-3">
            <div className="relative">
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full pl-4 pr-10 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold tracking-wide focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="HKD">🇭🇰 HKD - Hong Kong Dollar</option>
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="SGD">🇸🇬 SGD - Singapore Dollar</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={isCreating || isJoining}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] focus:ring-4 focus:ring-indigo-200 disabled:opacity-70 disabled:active:scale-100"
            >
              {isCreating ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create New Split
                </>
              )}
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">
              or
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Join Room Form */}
          <form onSubmit={handleJoinSession} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Enter Room Code (e.g. AX7B9)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isJoining || isCreating || !joinCode.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 p-4 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
            >
              {isJoining ? (
                <div className="w-5 h-5 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Join Existing Split
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500 space-y-1">
        <p className="font-medium">No account required.</p>
        <p className="text-gray-400">
          Sessions automatically securely delete after 30 days.
        </p>
      </div>
    </main>
  );
}
