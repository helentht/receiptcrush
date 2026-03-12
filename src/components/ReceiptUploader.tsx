"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  sessionId: string;
  participantId: string;
  onUploadSuccess?: () => void;
}

export function ReceiptUploader({
  sessionId,
  participantId,
  onUploadSuccess,
}: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${sessionId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      // 3. Insert Database Record
      const { data: receiptData, error: dbError } = await supabase
        .from("receipts")
        .insert({
          session_id: sessionId,
          uploader_id: participantId,
          image_url: publicUrlData.publicUrl,
          processing_status: "pending",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 4. Trigger Next.js API for processing
      const response = await fetch("/api/process-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: receiptData.id }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        console.error("API Processing Error Details:", result);
        throw new Error(result.details || result.error || "Failed while parsing receipt");
      }

      console.log("Success! Server answered:", result);

      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("Upload failed", error);
      alert(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="w-6 h-6" />
            Upload Receipts
          </>
        )}
      </button>
    </div>
  );
}
