const fs = require('fs');
const file = 'src/components/ExpenseAssignment.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<div className="relative flex flex-col items-start">[\s\S]*?<div className="text-right">\s*<p\s*className="font-black text-indigo-700 text-lg cursor-pointer hover:text-indigo-900 transition-colors"\s*onClick=\{\(\) => setPriceDetailParams\(\{ item, receipt \}\)\}\s*>\s*\$\s*\{\(\s*item\.price \*\s*\(1 \+ \(receipt\.cc_fee_percentage \|\| 0\) \/ 100\)\s*\)\.toFixed\(2\)\}\s*<\/p>\s*<\/div>/;

const newHTML = `<div>
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
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    
                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-full mt-1 z-10 flex flex-col gap-1 text-gray-400 bg-white p-1 rounded-md shadow-lg border border-gray-100">
                        <button
                          onClick={() => { setEditingItem({ item, receipt }); setOpenMenuId(null); }}
                          className="p-1.5 px-3 hover:text-indigo-600 hover:bg-gray-50 rounded flex items-center gap-2 transition-colors text-xs font-medium w-full text-left"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => { handleDuplicateItem(item, receipt.id); setOpenMenuId(null); }}
                          className="p-1.5 px-3 hover:text-green-600 hover:bg-gray-50 rounded flex items-center gap-2 transition-colors text-xs font-medium w-full text-left"
                          title="Duplicate Item"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </button>
                        <button
                          onClick={() => { handleDeleteItem(item.id, receipt.id); setOpenMenuId(null); }}
                          className="p-1.5 px-3 hover:text-red-600 hover:bg-gray-50 rounded flex items-center gap-2 transition-colors text-xs font-medium w-full text-left"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newHTML);
  fs.writeFileSync(file, content);
  console.log("SUCCESS");
} else {
  console.log("NOT FOUND");
}
