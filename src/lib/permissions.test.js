import { describe, expect, it } from 'vitest'
import {
  ASSIGNABLE_ROLES,
  PERMISSIONS,
  ROLE_RANK,
  assignableRolesFor,
  canAssignRole,
  canManageMember,
  hasPermission,
  roleRank,
} from '@/lib/permissions'

describe('permissions matrix', () => {
  it('gives Owner every permission, including deletion', () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(hasPermission('Owner', permission)).toBe(true)
    }
  })

  it('lets Admin do everything except delete the organization', () => {
    expect(hasPermission('Admin', PERMISSIONS.ORGANIZATION_UPDATE)).toBe(true)
    expect(hasPermission('Admin', PERMISSIONS.MEMBER_MANAGE_ROLES)).toBe(true)
    expect(hasPermission('Admin', PERMISSIONS.ORGANIZATION_DELETE)).toBe(false)
  })

  it('does not let Manager manage roles', () => {
    expect(hasPermission('Manager', PERMISSIONS.MEMBER_INVITE)).toBe(true)
    expect(hasPermission('Manager', PERMISSIONS.MEMBER_MANAGE_ROLES)).toBe(false)
  })

  it('keeps Member read-only on projects but able to work on tasks', () => {
    expect(hasPermission('Member', PERMISSIONS.PROJECT_READ)).toBe(true)
    expect(hasPermission('Member', PERMISSIONS.PROJECT_CREATE)).toBe(false)
    expect(hasPermission('Member', PERMISSIONS.TASK_CREATE)).toBe(true)
  })

  it('restricts Viewer to reads', () => {
    expect(hasPermission('Viewer', PERMISSIONS.TASK_READ)).toBe(true)
    expect(hasPermission('Viewer', PERMISSIONS.TASK_CREATE)).toBe(false)
    expect(hasPermission('Viewer', PERMISSIONS.COMMENT_CREATE)).toBe(false)
  })

  it('grants nothing to an unknown or missing role', () => {
    expect(hasPermission('Owner', 'totally:unknown')).toBe(false)
    expect(hasPermission(null, PERMISSIONS.TASK_READ)).toBe(false)
    expect(hasPermission('Superuser', PERMISSIONS.TASK_READ)).toBe(false)
  })
})

describe('role assignment', () => {
  it('orders roles the way the backend does', () => {
    expect(ROLE_RANK).toEqual({ Viewer: 0, Member: 1, Manager: 2, Admin: 3, Owner: 4 })
    expect(roleRank('Owner')).toBeGreaterThan(roleRank('Admin'))
    expect(roleRank('nope')).toBe(-1)
  })

  it('never allows assigning Owner', () => {
    expect(canAssignRole('Owner', 'Owner')).toBe(false)
  })

  it('requires strictly higher seniority to assign a role', () => {
    expect(canAssignRole('Owner', 'Admin')).toBe(true)
    expect(canAssignRole('Admin', 'Admin')).toBe(false)
    expect(canAssignRole('Manager', 'Admin')).toBe(false)
    expect(canAssignRole('Member', 'Viewer')).toBe(true)
    expect(canAssignRole('Viewer', 'Viewer')).toBe(false)
  })

  it('mirrors assignment rules for managing members', () => {
    expect(canManageMember('Admin', 'Member')).toBe(true)
    expect(canManageMember('Member', 'Member')).toBe(false)
  })

  it('lists assignable roles in descending seniority', () => {
    expect(assignableRolesFor('Owner')).toEqual(ASSIGNABLE_ROLES)
    expect(assignableRolesFor('Admin')).toEqual(['Manager', 'Member', 'Viewer'])
    expect(assignableRolesFor('Member')).toEqual(['Viewer'])
    expect(assignableRolesFor('Viewer')).toEqual([])
    expect(assignableRolesFor(null)).toEqual([])
  })
})
