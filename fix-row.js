const fs = require('fs');
let code = fs.readFileSync('src/components/ExpenseAssignment.tsx', 'utf8');

const regex = /<div className="flex items-center gap-3">[\s\S]*?<img[\s\S]*?\/>\s*\) : \([\s\S]*?<\/div>\s*\)}\s*<div>\s*<p className="font-bold text-gray-900 text-sm capitalize leading-tight">[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/g;

const newBlock = `<div className="flex flex-col items-start gap-1">
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
                      <div className="flex items-center gap-2 mt-1 ml-1 pl-14">
                        <button onClick={() => setEditingItem({item, receipt})} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Item"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDuplicateItem(item, receipt.id)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Duplicate Item"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteItem(item.id, receipt.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Item"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>`;
                    
code = code.replace(regex, newBlock);

code = code.replace(`{/* Price Detail Modal */}`, `
      <EditItemModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        item={editingItem?.item || null} 
        receipt={editingItem?.receipt || null} 
        onSave={(name, price) => editingItem && handleSaveItemEdit(editingItem.item.id, editingItem.receipt.id, name, price)} 
      />\n\n      {/* Price Detail Modal */}`);

fs.writeFileSync('src/components/ExpenseAssignment.tsx', code);
console.log("Done patching");