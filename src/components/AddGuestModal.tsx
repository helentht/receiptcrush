"use client";

import { useState } from "react";
import { X, Smile, Cat, Dog, Zap, Star, Heart, Rocket, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  { id: "red", class: "bg-red-500", hover: "hover:bg-red-600" },
  { id: "orange", class: "bg-orange-500", hover: "hover:bg-orange-600" },
  { id: "green", class: "bg-emerald-500", hover: "hover:bg-emerald-600" },
  { id: "blue", class: "bg-blue-500", hover: "hover:bg-blue-600" },
  { id: "indigo", class: "bg-indigo-500", hover: "hover:bg-indigo-600" },
  { id: "purple", class: "bg-purple-500", hover: "hover:bg-purple-600" },
  { id: "pink", class: "bg-pink-500", hover: "hover:bg-pink-600" },
  { id: "gray", class: "bg-gray-800", hover: "hover:bg-gray-900" },
];

export function AddGuestModal({
  sessionId,
  isOpen,
  onClose,
  onGuestAdded,
}: {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>("cat");
  const [selectedColor, setSelectedColor] = useState("orange");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sessionId) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("participants")
      .insert({
        session_id: sessionId,
        display_name: name.trim(),
        avatar_icon: selectedAvatar,
        avatar_color: selectedColor,
        // user_id implicitly null to make it a guest
      });

    setIsSubmitting(false);

    if (error) {
      alert("Failed to add guest.");
      return;
    }

    onGuestAdded();
    onClose();
    setName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center tracking-tight">
          Add a Friend
        </h3>

        <form onSubmit={handleAddGuest} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Display Name</label>
            <input
              type="text"
              required
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sam"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 font-medium transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Choose Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(AVATARS) as [AvatarKey, React.ElementType][]).map(
                ([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAvatar(key)}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                      selectedAvatar === key
                        ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-500 scale-105"
                        : "bg-gray-50 text-gray-400 border-2 border-transparent hover:bg-gray-100 hover:text-gray-600"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Choose Color</label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.id)}
                  className={`h-12 w-full rounded-xl transition-all ${
                    color.class
                  } ${color.hover} ${
                    selectedColor === color.id
                      ? "ring-4 ring-offset-2 ring-indigo-500 scale-105"
                      : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full flex items-center justify-center py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Add Friend"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}