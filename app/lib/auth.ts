import { createClient } from '@/lib/supabase/server'

export async function getUserRole(): Promise<'admin' | 'client' | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return data?.role ?? null
}

export async function getClientId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single()
  
  return data?.client_id ?? null
}

export async function requireAdmin() {
  const role = await getUserRole()
  if (role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
}

export async function requireClient() {
  const role = await getUserRole()
  if (role !== 'client') {
    throw new Error('Unauthorized: Client access required')
  }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return { user, profile }
}