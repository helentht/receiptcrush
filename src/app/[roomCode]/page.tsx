"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Smile,
  Cat,
  Dog,
  Zap,
  Star,
  Heart,
  Rocket,
  User,
  Users,
  Loader2,
} from "lucide-react";
import { ReceiptUploader } from "@/components/ReceiptUploader";
import { ExpenseAssignment } from "@/components/ExpenseAssignment";
import { SettlementSummary } from "@/components/SettlementSummary";

// --- Config Data ---
const AVATARS = {
  smile: Smile,
  cat: Cat,
  dog: Dog,
  zap: Zap,
  star: Star,
  heart: Heart,
  rocket: Rocket,
  user: User,
};
type AvatarKey = keyof typeof AVATARS;

const COLORS = [
  { id: "red", class: "bg-red-500" },
  { id: "orange", class: "bg-orange-500" },
  { id: "green", class: "bg-emerald-500" },
  { id: "blue", class: "bg-blue-500" },
  { id: "indigo", class: "bg-indigo-500" },
  { id: "purple", class: "bg-purple-500" },
  { id: "pink", class: "bg-pink-500" },
  { id: "gray", class: "bg-gray-800" },
];

// --- Types ---
type Participant = {
  id: string;
  session_id: string;
  display_name: string;
  avatar_icon: string;
  avatar_color: string;
};

export default function RoomPage({ params }: { params: { roomCode: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const roomCode = params.roomCode.toUpperCase();

  // App State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  // User State
  const [isJoined, setIsJoined] = useState(false);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>("smile");
  const [selectedColor, setSelectedColor] = useState("indigo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI State
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "settlement">(
    "expenses",
  );

  const fetchParticipants = useCallback(
    async (sid: string) => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", sid)
        .order("joined_at", { ascending: true });

      if (data) setParticipants(data);
    },
    [supabase],
  );

  // Initial Load Pipeline
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    const init = async () => {
      // 1. Validate Session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (sessionError || !sessionData) {
        router.push("/");
        return;
      }

      setSessionId(sessionData.id);

      // 2. Fetch Initial Participants
      await fetchParticipants(sessionData.id);

      // 3. Setup Realtime Subscription
      channel = supabase
        .channel(`room_${sessionData.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "participants",
            filter: `session_id=eq.${sessionData.id}`,
          },
          () => fetchParticipants(sessionData.id),
        )
        .subscribe();

      // 4. Check LocalStorage for persistence
      const savedUserId = localStorage.getItem(`receiptcrush_user_${roomCode}`);
      if (savedUserId) {
        // Find if this user actually exists in the DB still
        const { data: userData } = await supabase
          .from("participants")
          .select("*")
          .eq("id", savedUserId)
          .single();

        if (userData) {
          setMyParticipant(userData);
          setIsJoined(true);
        } else {
          // Clean up dead local storage
          localStorage.removeItem(`receiptcrush_user_${roomCode}`);
        }
      }

      setLoading(false);
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomCode, router, supabase, fetchParticipants]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sessionId) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("participants")
      .insert({
        session_id: sessionId,
        display_name: name.trim(),
        avatar_icon: selectedAvatar,
        avatar_color: selectedColor,
      })
      .select()
      .single();

    if (error || !data) {
      setError("Failed to join room. Try again.");
      setIsSubmitting(false);
      return;
    }

    localStorage.setItem(`receiptcrush_user_${roomCode}`, data.id);
    setMyParticipant(data);
    await fetchParticipants(sessionId); // Ensure immediately fresh list syncing from server
    setIsJoined(true);
    setIsSubmitting(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // --- Rendering ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // View 1: Participant Join Form
  if (!isJoined) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Join Room{" "}
              <span className="text-indigo-600 font-mono tracking-wider">
                {roomCode}
              </span>
            </h1>
            <p className="text-gray-500 mt-1">Pick your gametag and avatar!</p>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center mb-4 bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg font-medium outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">
                Pick an Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(AVATARS) as AvatarKey[]).map((iconKey) => {
                  const IconComponent = AVATARS[iconKey];
                  const isSelected = selectedAvatar === iconKey;
                  const selectedColorClass =
                    COLORS.find((c) => c.id === selectedColor)?.class ||
                    "bg-indigo-500";

                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedAvatar(iconKey)}
                      className={cn(
                        "aspect-square rounded-2xl flex items-center justify-center transition-all border-2",
                        isSelected
                          ? cn(
                              "border-transparent text-white shadow-md",
                              selectedColorClass,
                            )
                          : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600",
                      )}
                    >
                      <IconComponent
                        className={cn("w-7 h-7", isSelected && "scale-110")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">
                Pick a Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all flex items-center justify-center shadow-sm",
                      c.class,
                      selectedColor === c.id
                        ? "ring-4 ring-offset-2 ring-indigo-200 scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105",
                    )}
                  >
                    {selectedColor === c.id && (
                      <Check className="w-5 h-5 text-white stroke-[3px]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Enter Lobby"
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // View 2: The Action Lobby
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col p-4 max-w-md mx-auto relative pt-12 pb-24">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Lobby
        </h1>

        {/* Shareable Pill */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full py-1.5 pl-4 pr-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 mx-auto"
        >
          <span className="font-mono text-xl font-bold tracking-widest text-indigo-700">
            {roomCode}
          </span>
          <div
            className={cn(
              "rounded-full p-2 text-white transition-colors",
              copiedLink ? "bg-green-500" : "bg-indigo-600",
            )}
          >
            {copiedLink ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>

      {/* Participants Grid */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Participants ({participants.length})
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {participants.map((p) => {
            const Icon = AVATARS[p.avatar_icon as AvatarKey] || User;
            const colorClass =
              COLORS.find((c) => c.id === p.avatar_color)?.class ||
              "bg-gray-800";
            const isMe = p.id === myParticipant?.id;

            return (
              <div
                key={p.id}
                className="flex flex-col items-center gap-1.5 relative group"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform",
                    colorClass,
                    isMe && "ring-2 ring-offset-2 ring-indigo-500",
                  )}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-gray-700 truncate w-full text-center">
                  {p.display_name}
                </span>
                {isMe && (
                  <span className="absolute -top-2 -right-1 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                    ME
                  </span>
                )}
              </div>
            );
          })}

          {/* Empty placeholders to suggest more people can join */}
          {participants.length < 8 &&
            Array.from({ length: 8 - participants.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center gap-1.5 opacity-40"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100 border border-gray-200 border-dashed">
                  <User className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200/50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("expenses")}
          className={cn(
            "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
            activeTab === "expenses"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className={cn(
            "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
            activeTab === "settlement"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          Settlement
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "expenses"
        ? sessionId &&
          myParticipant && (
            <ExpenseAssignment
              sessionId={sessionId}
              participants={participants}
              myParticipantId={myParticipant.id}
            />
          )
        : sessionId &&
          myParticipant && (
            <SettlementSummary
              sessionId={sessionId}
              participants={participants}
              myParticipantId={myParticipant.id}
            />
          )}

      {/* Bottom Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          {sessionId && myParticipant && (
            <ReceiptUploader
              sessionId={sessionId}
              participantId={myParticipant.id}
              onUploadSuccess={() => {
                // We'll add feedback or reload navigation later
                console.log("Upload triggered!");
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
