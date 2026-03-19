export function PriceDetailModal({
  priceDetailParams,
  setPriceDetailParams,
}: {
  priceDetailParams: {
    item: { item_name: string; price: number };
    receipt: { cc_fee_percentage?: number };
  } | null;
  setPriceDetailParams: (params: null) => void;
}) {
  if (!priceDetailParams) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      onClick={() => setPriceDetailParams(null)}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            Item Breakdown
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPriceDetailParams(null);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate">
            {priceDetailParams.item.item_name}
          </h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-800 font-medium">Base Price</span>
              <span className="font-bold text-gray-700">
                ${priceDetailParams.item.price.toFixed(2)}
              </span>
            </div>

            {priceDetailParams.receipt.cc_fee_percentage ? (
              <div className="flex justify-between items-center text-sm p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <span className="text-rose-600 font-medium">
                  Card Fee ({priceDetailParams.receipt.cc_fee_percentage}%)
                </span>
                <span className="font-bold text-rose-600">
                  + $
                  {(
                    priceDetailParams.item.price *
                    (priceDetailParams.receipt.cc_fee_percentage / 100)
                  ).toFixed(2)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="text-lg font-bold text-gray-900">Total</div>
          <div className="text-lg font-bold text-indigo-600">
            $
            {(
              priceDetailParams.item.price *
              (1 + (priceDetailParams.receipt.cc_fee_percentage || 0) / 100)
            ).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
