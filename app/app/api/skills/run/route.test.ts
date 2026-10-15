import { describe, it, expect } from 'vitest'
import { ExecuteGenericSkillSchema } from '@/features/skills/api/types'

describe('POST /api/skills/run ExecuteGenericSkillSchema validation', () => {
  it('accepts a valid payload with required clientId and skillId', () => {
    const result = ExecuteGenericSkillSchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
      skillId: 'hook-writer',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.prompt).toBe('')
      expect(result.data.autoSave).toBeUndefined()
    }
  })

  it('accepts full payload with prompt, parameters, and autoSave', () => {
    const result = ExecuteGenericSkillSchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
      skillId: 'carousel-writer',
      prompt: 'Buat 5 slide carousel tentang cold brew',
      parameters: { platform: 'instagram', tone: 'friendly' },
      autoSave: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.autoSave).toBe(true)
      expect(result.data.parameters?.platform).toBe('instagram')
    }
  })

  it('rejects payload missing clientId', () => {
    const result = ExecuteGenericSkillSchema.safeParse({
      skillId: 'hook-writer',
    })
    expect(result.success).toBe(false)
  })

  it('rejects payload missing skillId', () => {
    const result = ExecuteGenericSkillSchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty clientId or skillId string', () => {
    const r1 = ExecuteGenericSkillSchema.safeParse({ clientId: '', skillId: 'hook-writer' })
    const r2 = ExecuteGenericSkillSchema.safeParse({ clientId: 'valid-id', skillId: '' })
    expect(r1.success).toBe(false)
    expect(r2.success).toBe(false)
  })
})
