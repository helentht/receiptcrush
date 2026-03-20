const fs = require('fs');
let code = fs.readFileSync('src/components/ExpenseAssignment.tsx', 'utf8');

const anchor = `<p className="font-bold text-gray-900 text-sm capitalize leading-tight">
                          {item.item_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">`;

const replacement = `<p className="font-bold text-gray-900 text-sm capitalize leading-tight">
                          {item.item_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-14">
                        <button onClick={() => setEditingItem({item, receipt})} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Item"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDuplicateItem(item, receipt.id)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Duplicate Item"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteItem(item.id, receipt.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Item"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-right">`;

code = code.replace(anchor, replacement);

const anchor2 = `<div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">`;

const replacement2 = `<div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-3">`;

code = code.replace(anchor2, replacement2);

fs.writeFileSync('src/components/ExpenseAssignment.tsx', code);
