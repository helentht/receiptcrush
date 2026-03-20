const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.replace(/"/g, '').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function test() {
  const { data, error } = await supabase.from('participants').select('*, sessions(*)').limit(2);
  console.log(JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
test();
