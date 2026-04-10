const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
}

async function checkSchema() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Accept': 'application/openapi+json'
    }
  });
  const json = await res.json();
  
  if (json.definitions) {
    fs.writeFileSync('schema.json', JSON.stringify(json.definitions.user_profiles || json.definitions, null, 2));
    console.log('Schema saved to schema.json');
  } else {
    console.log('Error payload:', json);
  }
}

checkSchema();
