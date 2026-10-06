import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log("Checking social_clients table...")
  const { data, error } = await supabase.from('social_clients').select('*')
  if (error) {
    console.error("Error fetching clients:", error.message)
    process.exit(1)
  }
  
  console.log(`Success! Found ${data.length} clients in the database.`)
  
  const { data: accounts, error: accError } = await supabase.from('social_accounts').select('*')
  if (accError) {
    console.error("Error fetching accounts:", accError.message)
    process.exit(1)
  }
  
  console.log(`Success! Found ${accounts.length} accounts in the database.`)
}

testConnection()
