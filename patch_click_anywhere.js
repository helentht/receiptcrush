const fs = require('fs');
const file = 'src/components/ExpenseAssignment.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetAnchor = `  const supabase = createClient();`;

const newCode = `  const supabase = createClient();

  useEffect(() => {
    if (!openMenuId) return;
    const clickHandler = () => setOpenMenuId(null);
    const timeout = setTimeout(() => {
      document.addEventListener("click", clickHandler);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", clickHandler);
    };
  }, [openMenuId]);`;

if (content.includes(targetAnchor)) {
  content = content.replace(targetAnchor, newCode);
  fs.writeFileSync(file, content);
  console.log("SUCCESS");
} else {
  console.log("Target not found!");
}
