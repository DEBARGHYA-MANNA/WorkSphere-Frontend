import { z } from 'zod'
import { ASSIGNABLE_ROLES, DEFAULT_MEMBER_ROLES } from '@/lib/permissions'

/**
 * Organization validation mirroring
 * `WorkSphere-Backend/src/modules/organizations/organization.validation.js`:
 *   name        2–120 chars, trimmed, required
 *   description ≤ 2000, may be empty
 *   settings.allowMemberInvites   boolean
 *   settings.defaultMemberRole    'Member' | 'Viewer'
 *
 * Slug uniqueness is enforced server-side (409), not here — the client cannot
 * know it, so the form surfaces the conflict instead of guessing.
 */

const nameField = z
  .string({ required_error: 'Organization name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(120, 'Name must be 120 characters or fewer')
  // The backend slugifies the name; a name with no letters or digits cannot
  // produce a usable slug and is rejected with INVALID_ORGANIZATION_NAME.
  .refine((value) => /[a-zA-Z0-9]/.test(value), 'Name must contain letters or numbers')

const descriptionField = z
  .string()
  .trim()
  .max(2000, 'Description must be 2000 characters or fewer')
  .optional()
  .or(z.literal(''))

const settingsSchema = z.object({
  allowMemberInvites: z.boolean(),
  defaultMemberRole: z.enum(DEFAULT_MEMBER_ROLES),
})

export const createOrganizationSchema = z.object({
  name: nameField,
  description: descriptionField,
  settings: settingsSchema.optional(),
})

export const updateOrganizationSchema = z
  .object({
    name: nameField.optional(),
    description: descriptionField,
    settings: settingsSchema.partial().optional(),
  })
  // The backend requires at least one property (`min(1)`).
  .refine((values) => Object.keys(values).some((key) => values[key] !== undefined), {
    message: 'Change at least one field',
  })

/** Values used by the create dialog before the user touches anything. */
export const createOrganizationDefaults = Object.freeze({
  name: '',
  description: '',
  settings: {
    allowMemberInvites: true,
    defaultMemberRole: 'Member',
  },
})

/** Invitation form — email required, role optional (backend falls back to settings). */
export const inviteMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .max(254, 'Email must be 254 characters or fewer')
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Enter a valid email address',
    ),
  role: z.enum([...ASSIGNABLE_ROLES, '']).optional(),
})

export const inviteMemberDefaults = Object.freeze({ email: '', role: 'Member' })
