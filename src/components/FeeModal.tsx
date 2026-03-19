export function FeeModal({
  feeModalParams,
  setFeeModalParams,
  handleChangeFee,
}: {
  feeModalParams: { receiptId: string; fee: number } | null;
  setFeeModalParams: (
    params: { receiptId: string; fee: number } | null,
  ) => void;
  handleChangeFee: (receiptId: string, feePercentage: number) => Promise<void>;
}) {
  if (!feeModalParams) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      onClick={() => setFeeModalParams(null)}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Credit Card Fee</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFeeModalParams(null);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-6">
            Enter the transaction fee percentage applied to this receipt.
          </p>

          <div className="flex items-center gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <input
              type="number"
              autoFocus
              className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-300 px-2 py-1 focus:outline-none focus:border-indigo-500 text-center"
              step="0.01"
              min="0"
              value={feeModalParams.fee || ""}
              onChange={(e) =>
                setFeeModalParams({
                  ...feeModalParams,
                  fee: parseFloat(e.target.value) || 0,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleChangeFee(feeModalParams.receiptId, feeModalParams.fee);
                  setFeeModalParams(null);
                }
              }}
            />
            <span className="text-2xl font-bold text-gray-400">%</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setFeeModalParams(null)}
              className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleChangeFee(feeModalParams.receiptId, feeModalParams.fee);
                setFeeModalParams(null);
              }}
              className="flex-1 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
