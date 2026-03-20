const fs = require('fs');
const file = 'src/components/ExpenseAssignment.tsx';
let content = fs.readFileSync(file, 'utf8');

// Using standard index of to avoid ugly regex
const targetOriginal = `<div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.item_image_url ? (
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(item.item_image_url)}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm capitalize leading-tight">
                        {item.item_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 relative">
                    <div className="text-right">
                      <p
                        className="font-black text-indigo-700 text-lg cursor-pointer hover:text-indigo-900 transition-colors"
                        onClick={() => setPriceDetailParams({ item, receipt })}
                      >
                        $
                        {(
                          item.price *
                          (1 + (receipt.cc_fee_percentage || 0) / 100)
                        ).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === item.id ? null : item.id)
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-full mt-1 z-10 flex flex-col gap-1 text-gray-400 bg-white p-1 rounded-md shadow-lg border border-gray-100">
                        <button
                          onClick={() => {
                            setEditingItem({ item, receipt });
                            setOpenMenuId(null);
                          }}
                          className="p-1.5 px-3 hover:text-indigo-600 hover:bg-gray-50 rounded flex items-center gap-2 transition-colors text-xs font-medium w-full text-left"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDuplicateItem(item, receipt.id);
                            setOpenMenuId(null);
                          }}
                          className="p-1.5 px-3 hover:text-green-600 hover:bg-gray-50 rounded flex items-center gap-2 transition-colors text-xs font-medium w-full text-left"
                          title="Duplicate Item"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteItem(item.id, receipt.id);
                            setOpenMenuId(null);
                          }}
                          className="p-1.5 px-3 hover:text-red-600 hover:bg-gray-50 rounded flex items-center gap-2 transition-colors text-xs font-medium w-full text-left"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>`;

const newHTML = `<div className="flex items-center justify-between gap-4 relative">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer group"
                    onClick={(e) => {
                      // Prevent menu toggle if clicking image directly
                      if ((e.target as HTMLElement).tagName.toLowerCase() !== 'img') {
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }
                    }}
                    title="Tap to manage item"
                  >
                    {item.item_image_url ? (
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(item.item_image_url);
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm capitalize leading-tight group-hover:text-indigo-600 transition-colors">
                        {item.item_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="text-right">
                      <p
                        className="font-black text-indigo-700 text-lg cursor-pointer hover:text-indigo-900 transition-colors"
                        onClick={() => setPriceDetailParams({ item, receipt })}
                      >
                        $
                        {(
                          item.price *
                          (1 + (receipt.cc_fee_percentage || 0) / 100)
                        ).toFixed(2)}
                      </p>
                    </div>

                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-full mt-2 z-10 flex flex-col gap-1 text-gray-400 bg-white p-1.5 rounded-xl shadow-xl border border-gray-100 min-w-32">
                        <button
                          onClick={() => {
                            setEditingItem({ item, receipt });
                            setOpenMenuId(null);
                          }}
                          className="p-2 px-3 hover:text-indigo-600 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition-colors text-xs font-semibold w-full text-left"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDuplicateItem(item, receipt.id);
                            setOpenMenuId(null);
                          }}
                          className="p-2 px-3 hover:text-green-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2.5 transition-colors text-xs font-semibold w-full text-left"
                        >
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <div className="h-px w-full bg-gray-100 my-0.5"></div>
                        <button
                          onClick={() => {
                            handleDeleteItem(item.id, receipt.id);
                            setOpenMenuId(null);
                          }}
                          className="p-2 px-3 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors text-xs font-semibold w-full text-left"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>`;

const targetRegexStr = targetOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
const targetRegex = new RegExp(targetRegexStr);

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newHTML);
  fs.writeFileSync(file, content);
  console.log("SUCCESS");
} else {
  console.log("Target not found!");
}
