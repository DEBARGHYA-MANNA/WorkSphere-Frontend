/**
 * Client-side mirror of the backend permission matrix.
 *
 * Source of truth: `WorkSphere-Backend/src/constants/permissions.js`.
 *
 * ⚠️  This is **UX only**. It hides or disables controls the user cannot use so
 * they are not misled by an action that would fail. The backend still authorises
 * every request, and the UI must handle `403` gracefully regardless of what this
 * module says.
 */

export const ORGANIZATION_ROLES = Object.freeze(['Owner', 'Admin', 'Manager', 'Member', 'Viewer'])

/** Roles that may be assigned to another member / invitee (Owner never is). */
export const ASSIGNABLE_ROLES = Object.freeze(['Admin', 'Manager', 'Member', 'Viewer'])

/** Roles selectable when creating an invitation. */
export const INVITABLE_ROLES = Object.freeze(['Admin', 'Manager', 'Member', 'Viewer'])

/** `defaultMemberRole` accepts a narrower set on the backend. */
export const DEFAULT_MEMBER_ROLES = Object.freeze(['Member', 'Viewer'])

/** Backend `ROLE_RANK` — higher rank can manage lower ranks. */
export const ROLE_RANK = Object.freeze({ Viewer: 0, Member: 1, Manager: 2, Admin: 3, Owner: 4 })

export const PERMISSIONS = Object.freeze({
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  MEMBER_READ: 'member:read',
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  MEMBER_MANAGE_ROLES: 'member:manage_roles',
  INVITATION_READ: 'invitation:read',
  INVITATION_REVOKE: 'invitation:revoke',
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MANAGE_MEMBERS: 'project:manage_members',
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  COMMENT_CREATE: 'comment:create',
  COMMENT_DELETE: 'comment:delete',
  ANALYTICS_READ: 'analytics:read',
})

const OWNER_PERMISSIONS = Object.values(PERMISSIONS)

const ROLE_PERMISSIONS = Object.freeze({
  Owner: OWNER_PERMISSIONS,
  Admin: OWNER_PERMISSIONS.filter((p) => p !== PERMISSIONS.ORGANIZATION_DELETE),
  Manager: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.INVITATION_READ,
    PERMISSIONS.INVITATION_REVOKE,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_MANAGE_MEMBERS,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_DELETE,
  ],
  Member: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_DELETE,
  ],
  Viewer: [
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.TASK_READ,
  ],
})

/** Does `role` hold `permission`? Unknown roles hold nothing. */
export function hasPermission(role, permission) {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission))
}

/** Can `actorRole` assign `targetRole` to somebody else? Mirrors `canAssignRole`. */
export function canAssignRole(actorRole, targetRole) {
  return (
    targetRole !== 'Owner' &&
    Object.hasOwn(ROLE_RANK, targetRole ?? '') &&
    Object.hasOwn(ROLE_RANK, actorRole ?? '') &&
    ROLE_RANK[actorRole] > ROLE_RANK[targetRole]
  )
}

/** Can `actorRole` manage (change role / remove) a member holding `targetRole`? */
export function canManageMember(actorRole, targetRole) {
  return canAssignRole(actorRole, targetRole)
}

/** Roles the actor may hand out, in descending seniority. */
export function assignableRolesFor(actorRole) {
  return ASSIGNABLE_ROLES.filter((role) => canAssignRole(actorRole, role))
}

/** Human-readable rank, for sorting member lists. */
export function roleRank(role) {
  return ROLE_RANK[role] ?? -1
}
