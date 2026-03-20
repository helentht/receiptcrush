const fs = require('fs');
const file = 'src/components/ExpenseAssignment.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetItemTitleAndButtonsGroupMaybe = `                    <div>
                      <p className="font-bold text-gray-900 text-sm capitalize leading-tight">
                        {item.item_name}
                      </p>
                    </div>`;

const replacementItemTitleAndButtonsGroupMaybe = `                    <div className="flex flex-col items-start gap-1">
                      <p className="font-bold text-gray-900 text-sm capitalize leading-tight">
                        {item.item_name}
                      </p>
                      <div className="flex gap-2 text-gray-400 mt-1">
                        <button onClick={() => setEditingItem({ item, receipt })} className="p-1.5 hover:text-indigo-600 bg-white rounded flex items-center justify-center transition-colors shadow-sm border border-gray-100" title="Edit Item"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicateItem(item, receipt.id)} className="p-1.5 hover:text-green-600 bg-white rounded flex items-center justify-center transition-colors shadow-sm border border-gray-100" title="Duplicate Item"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteItem(item.id, receipt.id)} className="p-1.5 hover:text-red-600 bg-white rounded flex items-center justify-center transition-colors shadow-sm border border-gray-100" title="Delete Item"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>`;

if (content.includes(targetItemTitleAndButtonsGroupMaybe)) {
  content = content.replace(targetItemTitleAndButtonsGroupMaybe, replacementItemTitleAndButtonsGroupMaybe);
}

// Ensure EditItemModal is not duplicated.
// The diff showed two <EditItemModal /> instances rendered back to back. Let's fix that too.
const firstEditItemModalStr = `<EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem?.item || null}
        receipt={editingItem?.receipt || null}
        onSave={(name, price) =>
          editingItem &&
          handleSaveItemEdit(
            editingItem.item.id,
            editingItem.receipt.id,
            name,
            price,
          )
        }
      />`;

// Replace double occurrence with single if found. We can just split by it.
let parts = content.split(firstEditItemModalStr);
if (parts.length > 2) {
  content = parts[0] + firstEditItemModalStr + parts.slice(2).join('');
}

fs.writeFileSync(file, content);
console.log("SUCCESS");
