import re

# Read the file
with open('src/components/ExpenseAssignment.tsx', 'r') as f:
    code = f.read()

# Replace the closing tags and add the buttons for each item
old_str = """                      </div>
                    </div>
                    <div className="text-right">
                      <p"""

new_str = """                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-12">
                      <button onClick={() => setEditingItem({item, receipt})} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Item"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDuplicateItem(item, receipt.id)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Duplicate Item"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteItem(item.id, receipt.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Item"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p"""

# Also fix the opening div to be column-based so they stack
old_div = """                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">"""

new_div = """                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-3">"""

code = code.replace(old_str, new_str)
code = code.replace(old_div, new_div)

# Append EditItemModal safely at the very end of the main space-y-6 container
old_end = """      <FeeModal
        feeModalParams={feeModalParams}
        setFeeModalParams={setFeeModalParams}
        handleChangeFee={handleChangeFee}
      />"""

new_end = """      <FeeModal
        feeModalParams={feeModalParams}
        setFeeModalParams={setFeeModalParams}
        handleChangeFee={handleChangeFee}
      />
      
      <EditItemModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        item={editingItem?.item || null} 
        receipt={editingItem?.receipt || null} 
        onSave={(name, price) => editingItem && handleSaveItemEdit(editingItem.item.id, editingItem.receipt.id, name, price)} 
      />"""

code = code.replace(old_end, new_end)

with open('src/components/ExpenseAssignment.tsx', 'w') as f:
    f.write(code)

print("Patched Python style")
