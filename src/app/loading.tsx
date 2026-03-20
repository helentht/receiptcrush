import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-gray-500 font-medium mt-4">Loading ReceiptCrush...</p>
    </div>
  );
}
