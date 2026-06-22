const fs = require('fs');
const path = require('path');

const projectRoot = 'C:/Users/jkphu/Downloads/ai-dev/ootd-ai';
const { createClient } = require(path.join(projectRoot, 'node_modules/@supabase/supabase-js'));

// Parse .env.local manually
const envPath = path.join(projectRoot, '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.trim().startsWith('"') && value.trim().endsWith('"')) {
        value = value.trim().slice(1, -1);
      }
      env[key] = value.trim();
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('clothes')
    .select('category');
  if (error) {
    console.error('Error:', error);
    return;
  }
  const counts = {};
  data.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  console.log('Category counts:', counts);

  // Let's also print 5 items in total to see what their names look like.
  const { data: sample } = await supabase.from('clothes').select('*').limit(5);
  console.log('Sample items:', sample);
}

run();
