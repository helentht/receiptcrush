"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Receipt, ArrowRight, UserCircle2 } from "lucide-react";

type SessionInfo = {
  id: string;
  room_code: string;
  created_at: string;
  base_currency: string;
};

type JoinedRoom = {
  participantId: string;
  displayName: string;
  avatarIcon: string;
  avatarColor: string;
  joinedAt: string;
  session: SessionInfo;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<JoinedRoom[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Get authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Get guest participant IDs from localStorage
        const localParticipantIds: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("receiptcrush_user_")) {
            const participantId = localStorage.getItem(key);
            if (participantId) {
              localParticipantIds.push(participantId);
            }
          }
        }

        // Fetch participant records from Supabase
        let query = supabase
          .from("participants")
          .select(
            "id, display_name, avatar_icon, avatar_color, joined_at, user_id, sessions (id, room_code, created_at, base_currency)",
          );

        if (user) {
          if (localParticipantIds.length > 0) {
            query = query.or(
              `user_id.eq.${user.id},id.in.(${localParticipantIds.join(",")})`,
            );
          } else {
            query = query.eq("user_id", user.id);
          }
        } else {
          if (localParticipantIds.length > 0) {
            query = query.in("id", localParticipantIds);
          } else {
            // No user and no guest records
            setRooms([]);
            setLoading(false);
            return;
          }
        }

        const { data: participants, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (participants) {
          // Filter out null sessions (in case they were deleted but participant remains)
          const validRooms = participants
            .filter((p) => p.sessions !== null)
            .map((p) => ({
              participantId: p.id,
              displayName: p.display_name,
              avatarIcon: p.avatar_icon,
              avatarColor: p.avatar_color,
              joinedAt: p.joined_at,
              session: (Array.isArray(p.sessions)
                ? p.sessions[0]
                : p.sessions) as SessionInfo, // Next.js supabase type workaround
            }));

          // Sort by joined_at descending
          validRooms.sort(
            (a, b) =>
              new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime(),
          );

          // Deduplicate rooms safely (in case auth user + local storage point to same participant)
          const uniqueRoomsMap = new Map<string, JoinedRoom>();
          for (const room of validRooms) {
            if (!uniqueRoomsMap.has(room.session.room_code)) {
              uniqueRoomsMap.set(room.session.room_code, room);
            }
          }

          setRooms(Array.from(uniqueRoomsMap.values()));
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Rooms</h1>
          <p className="text-muted-foreground">
            Rooms you have previously joined as a guest or logged-in user.
          </p>
        </div>
        <Link href="/">
          <button className="px-4 py-2 border rounded-md hover:bg-neutral-100 transition-colors">
            Create / Join New Room
          </button>
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 text-sm text-red-500 bg-red-50 rounded-lg">
          Error loading dashboard: {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No rooms found</h2>
          <p className="text-muted-foreground mb-6">
            You haven&apos;t joined any active rooms yet on this device.
          </p>
          <Link href="/">
            <button className="px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.session.id}
              href={`/${room.session.room_code}`}
              className="group block p-6 border rounded-xl hover:border-black active:scale-[0.98] transition-all bg-card shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 text-primary uppercase font-mono px-2 py-1 rounded text-sm font-bold tracking-wider">
                  {room.session.room_code}
                </div>
                <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {room.session.base_currency}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCircle2 className="w-4 h-4" />
                  Joined as{" "}
                  <span className="font-semibold text-foreground">
                    {room.displayName}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Joined on {format(new Date(room.joinedAt), "PP")}
                </div>
              </div>

              <div className="mt-6 flex items-center text-sm font-medium text-primary group-hover:underline">
                View Receipt
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
