/* eslint-disable @next/next/no-img-element */
export function FullscreenImageModal({
  selectedImage,
  setSelectedImage,
}: {
  selectedImage: string | null;
  setSelectedImage: (url: string | null) => void;
}) {
  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 duration-200 animate-in fade-in"
      onClick={() => setSelectedImage(null)}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
        {/* Close instruction */}
        <span className="absolute -top-8 text-white/90 text-sm font-medium drop-shadow-md">
          Tap anywhere to close
        </span>
        <img
          src={selectedImage}
          alt="Full Receipt"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
