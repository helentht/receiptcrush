const fs = require('fs');
const file = 'src/components/ExpenseAssignment.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add MoreVertical to lucide imports
if (!content.includes('MoreVertical')) {
  // Let's just find Copy, and replace it with Copy, MoreVertical,
  content = content.replace('  Copy,\n} from "lucide-react";', '  Copy,\n  MoreVertical,\n} from "lucide-react";');
}

// 2. Add openMenuId state
if (!content.includes('const [openMenuId')) {
  const targetState = '  const [editingItem, setEditingItem] = useState<{';
  const replacementState = '  const [openMenuId, setOpenMenuId] = useState<string | null>(null);\n  const [editingItem, setEditingItem] = useState<{';
  content = content.replace(targetState, replacementState);
}

// 3. Replace the Item formatting
// The diff shows we previously created:
// <div className="flex flex-col items-start gap-1">
//   <p className="font-bold text-gray-900 text-sm capitalize leading-tight">
//     {item.item_name}
//   </p>
//   <div className="flex gap-2 text-gray-400 mt-1">...</div>
// </div>

const matchRegex = /<div className="flex flex-col items-start gap-1">[\s\S]*?<Trash2 className="w-4 h-4" \/>\s*<\/button>\s*<\/div>\s*<\/div>/;

const newUITree = `<div className="relative flex flex-col items-start">
                      <div className="flex items-center gap-1 -ml-1">
                        <p className="font-bold text-gray-900 text-sm capitalize leading-tight ml-1">
                          {item.item_name}
                        </p>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 transition-colors"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {openMenuId === item.id && (
                        <div className="absolute left-0 top-full mt-1 z-10 flex gap-1 text-gray-400 bg-white p-1 rounded-md shadow-lg border border-gray-100">
                          <button
                            onClick={() => { setEditingItem({ item, receipt }); setOpenMenuId(null); }}
                            className="p-1.5 hover:text-indigo-600 hover:bg-gray-50 rounded flex items-center justify-center transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { handleDuplicateItem(item, receipt.id); setOpenMenuId(null); }}
                            className="p-1.5 hover:text-green-600 hover:bg-gray-50 rounded flex items-center justify-center transition-colors"
                            title="Duplicate Item"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { handleDeleteItem(item.id, receipt.id); setOpenMenuId(null); }}
                            className="p-1.5 hover:text-red-600 hover:bg-gray-50 rounded flex items-center justify-center transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>`;

content = content.replace(matchRegex, newUITree);

fs.writeFileSync(file, content);
console.log("Done menu UI");
