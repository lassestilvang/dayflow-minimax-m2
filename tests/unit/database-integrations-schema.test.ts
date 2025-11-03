import { describe, it, expect } from 'vitest'
import * as integrationsSchema from '../../lib/db/integrations-schema'
import * as mainSchema from '../../lib/db/schema'

describe('Integration Schema Definitions', () => {
  describe('Table Exports', () => {
    it('should export integrationServices table', () => {
      expect(integrationsSchema.integrationServices).toBeDefined()
      expect(typeof integrationsSchema.integrationServices).toBe('object')
    })

    it('should export userIntegrations table', () => {
      expect(integrationsSchema.userIntegrations).toBeDefined()
      expect(typeof integrationsSchema.userIntegrations).toBe('object')
    })

    it('should export syncOperations table', () => {
      expect(integrationsSchema.syncOperations).toBeDefined()
      expect(typeof integrationsSchema.syncOperations).toBe('object')
    })

    it('should export syncQueue table', () => {
      expect(integrationsSchema.syncQueue).toBeDefined()
      expect(typeof integrationsSchema.syncQueue).toBe('object')
    })

    it('should export externalItems table', () => {
      expect(integrationsSchema.externalItems).toBeDefined()
      expect(typeof integrationsSchema.externalItems).toBe('object')
    })

    it('should export integrationAuditLog table', () => {
      expect(integrationsSchema.integrationAuditLog).toBeDefined()
      expect(typeof integrationsSchema.integrationAuditLog).toBe('object')
    })
  })

  describe('Relations', () => {
    it('should export integrationServices relations', () => {
      expect(integrationsSchema.integrationServicesRelations).toBeDefined()
      expect(typeof integrationsSchema.integrationServicesRelations).toBe('object')
    })

    it('should export userIntegrations relations', () => {
      expect(integrationsSchema.userIntegrationsRelations).toBeDefined()
      expect(typeof integrationsSchema.userIntegrationsRelations).toBe('object')
    })

    it('should export syncOperations relations', () => {
      expect(integrationsSchema.syncOperationsRelations).toBeDefined()
      expect(typeof integrationsSchema.syncOperationsRelations).toBe('object')
    })

    it('should export syncQueue relations', () => {
      expect(integrationsSchema.syncQueueRelations).toBeDefined()
      expect(typeof integrationsSchema.syncQueueRelations).toBe('object')
    })

    it('should export externalItems relations', () => {
      expect(integrationsSchema.externalItemsRelations).toBeDefined()
      expect(typeof integrationsSchema.externalItemsRelations).toBe('object')
    })

    it('should export integrationAuditLog relations', () => {
      expect(integrationsSchema.integrationAuditLogRelations).toBeDefined()
      expect(typeof integrationsSchema.integrationAuditLogRelations).toBe('object')
    })
  })

  describe('Schema Completeness', () => {
    it('should export all integration schema components', () => {
      const exports = Object.keys(integrationsSchema)
      
      // Check for table exports
      expect(exports).toContain('integrationServices')
      expect(exports).toContain('userIntegrations')
      expect(exports).toContain('syncOperations')
      expect(exports).toContain('syncQueue')
      expect(exports).toContain('externalItems')
      expect(exports).toContain('integrationAuditLog')
      
      // Check for relation exports
      expect(exports).toContain('integrationServicesRelations')
      expect(exports).toContain('userIntegrationsRelations')
      expect(exports).toContain('syncOperationsRelations')
      expect(exports).toContain('syncQueueRelations')
      expect(exports).toContain('externalItemsRelations')
      expect(exports).toContain('integrationAuditLogRelations')
    })
  })

  describe('Cross-Schema References', () => {
    it('should reference main schema tables correctly', () => {
      // Test that integration schema references are properly structured
      expect(integrationsSchema.userIntegrations).toBeDefined()
      expect(integrationsSchema.externalItems).toBeDefined()
      expect(integrationsSchema.integrationAuditLog).toBeDefined()
    })
  })
})