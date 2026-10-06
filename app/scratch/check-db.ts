import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('client_channels').select('avatar_url').limit(1)
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  console.log('Success! avatar_url column exists. Data:', data)
}

check()
