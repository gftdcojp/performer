import { describe, it, expect } from 'vitest'
import { createActions, ZodValidator } from './index'
import { z } from 'zod'

describe('ZodValidator', () => {
  it('should validate successfully', async () => {
    const schema = z.object({ name: z.string() })
    const result = await ZodValidator.validate(schema, { name: 'test' })
    expect(result).toEqual({ name: 'test' })
  })

  it('should fail validation', async () => {
    const schema = z.object({ name: z.string() })
    const result = ZodValidator.safeValidate(schema, { name: 123 })
    expect(result.success).toBe(false)
  })
})

describe('ActionBuilder', () => {
  it('should create action builder', () => {
    const actions = createActions({
      domain: 'test.auth0.com',
      clientID: 'test-client-id',
      audience: 'test-audience'
    })
    expect(actions).toBeDefined()
  })
})
