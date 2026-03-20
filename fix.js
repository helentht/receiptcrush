const fs = require('fs');
const file = 'src/components/ReceiptUploader.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const handleFileChange = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?if \(onUploadSuccess\) onUploadSuccess\(\);\n    \} catch \(error\) \{/,
  `const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = \`\${sessionId}/\${Date.now()}_\${Math.random().toString(36).substring(7)}.\${fileExt}\`;
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
          throw new Error(
            result.details || result.error || "Failed while parsing receipt",
          );
        }

        console.log("Success for file", file.name, "Server answered:", result);
      });

      await Promise.all(uploadPromises);

      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {`
);

content = content.replace(
  '<input\n        type="file"\n        accept="image/*"\n        className="hidden"\n        ref={fileInputRef}\n        onChange={handleFileChange}\n      />',
  '<input\n        type="file"\n        accept="image/*"\n        multiple\n        className="hidden"\n        ref={fileInputRef}\n        onChange={handleFileChange}\n      />'
);

fs.writeFileSync(file, content);
console.log("Rewrite complete!");
