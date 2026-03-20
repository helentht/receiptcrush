const fs = require('fs');
const file = 'src/components/ExpenseAssignment.tsx';
let content = fs.readFileSync(file, 'utf8');

// The block to replace:
const targetRegex = /<div className="flex items-center justify-between gap-4">([\s\S]*?)<div className="flex items-center gap-1 relative">([\s\S]*?)<button\s*onClick=\{\(\) => setOpenMenuId\(openMenuId === item\.id \? null : item\.id\)\}\s*className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 transition-colors"\s*title="More options"\s*>\s*<MoreVertical className="w-3\.5 h-3\.5" \/>\s*<\/button>([\s\S]*?)<\/div>\s*<\/div>\s*<div className="bg-white rounded-xl p-3 border border-gray-100 shadow-inner">/g;

// Instead of pure regex, let's construct the exact replacement string based on what we know is there.
// Look at the current file state.
