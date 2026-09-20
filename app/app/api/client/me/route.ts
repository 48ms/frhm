import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { denyUnauthorized } from '@/lib/auth/guard'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GDPR export endpoint: GET /api/client/me
 * Returns all personal data associated with the authenticated client user.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return denyUnauthorized({ reason: 'no_session' })

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, client_id, created_at, last_login, telegram_chat_id, telegram_notifications_enabled')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('GDPR export: failed to fetch profile', { userId: user.id, error: profileError })
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  // Fetch associated client (if any)
  let client = null
  if (profile?.client_id) {
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name, contact_email, contact_phone, brand_profile, created_at, updated_at')
      .eq('id', profile.client_id)
      .single()

    if (!clientError && clientData) {
      client = clientData
    }
  }

  // Fetch deliverables summary (not full content to avoid heavy queries)
  const { data: deliverables, error: delError } = await supabase
    .from('deliverables')
    .select('id, title, type, status, created_at, updated_at')
    .eq('client_id', client?.id ?? '')
    .limit(100)

  if (delError) {
    logger.error('GDPR export: failed to fetch deliverables', { userId: user.id, error: delError })
  }

  // Fetch skills summary
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('id, name, description, stage, created_at')
    .limit(100)

  if (skillsError) {
    logger.error('GDPR export: failed to fetch skills', { userId: user.id, error: skillsError })
  }

  const exportData = {
    export_date: new Date().toISOString(),
    user: profile,
    client,
    deliverables: deliverables ?? [],
    skills: skills ?? [],
    note: 'This export contains personal data under GDPR. Retain securely and delete if no longer needed.',
  }

  logger.info('gdpr.export.success', { userId: user.id })
  return NextResponse.json(exportData)
}

/**
 * GDPR deletion endpoint: DELETE /api/client/me
 * Soft-deletes the authenticated client user by marking account as deleted.
 * Keeps audit trail in audit_log.
 */
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return denyUnauthorized({ reason: 'no_session' })

  // Check if user is a client (not admin)
  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    return NextResponse.json({ error: 'Admin cannot use GDPR deletion. Contact support.' }, { status: 403 })
  }

  if (!profile?.client_id) {
    return NextResponse.json({ error: 'No client account found' }, { status: 404 })
  }

  // Soft-delete: mark user as deleted and nullify client association
  const { error: updateError } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      client_id: null,
    })
    .eq('id', user.id)

  if (updateError) {
    logger.error('gdpr.delete.failed', { userId: user.id, error: updateError })
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  // Log the deletion for audit trail
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    actor_role: profile.role ?? 'client',
    action: 'gdpr.account_deleted',
    entity_type: 'user',
    entity_id: user.id,
    summary: 'Account deleted via GDPR right-to-erasure request',
  })

  // Sign out user
  await supabase.auth.signOut()

  logger.info('gdpr.delete.success', { userId: user.id })
  return NextResponse.json({ success: true, message: 'Account deleted successfully' })
}
