import * as z from 'zod'

// ─── Task Schemas ────────────────────────────────────────────────────────────

export const taskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['pending', 'in_progress', 'completed'], {
    required_error: 'Please select a status',
  }),
  project_id: z
    .string({ required_error: 'Project is required' })
    .min(1, 'Please select a project'),
  assignee_id: z.string().optional(),
  due_date: z.string().optional().or(z.literal('')),
})

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['pending', 'in_progress', 'completed']),
  assignee_id: z.string().optional(),
  due_date: z.string().optional().or(z.literal('')),
})

// ─── Project Schemas ─────────────────────────────────────────────────────────

export const projectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
})

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username too long'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['admin', 'manager', 'member']).default('member'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─── Multi-Step Profile / Onboarding Schema ───────────────────────────────────

export const profileStep1Schema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name too long'),
  bio: z
    .string()
    .max(300, 'Bio cannot exceed 300 characters')
    .optional()
    .or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional().or(z.literal('')),
})

export const profileStep2Schema = z.object({
  skills: z
    .array(z.string().min(1))
    .min(1, 'Please add at least one skill')
    .max(10, 'Maximum 10 skills allowed'),
  experience: z.enum(['junior', 'mid', 'senior', 'lead'], {
    required_error: 'Please select your experience level',
  }),
  availability: z.enum(['full_time', 'part_time', 'contract', 'unavailable']),
})

export const profileStep3Schema = z.object({
  avatar: z
    .any()
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) return true
      return files[0]?.size <= 5 * 1024 * 1024
    }, 'Image must be less than 5MB')
    .refine((files) => {
      if (!files || files.length === 0) return true
      return ['image/jpeg', 'image/png', 'image/webp'].includes(files[0]?.type)
    }, 'Only JPEG, PNG, and WebP images are allowed'),
  notifications: z.object({
    email: z.boolean().default(true),
    browser: z.boolean().default(false),
    taskUpdates: z.boolean().default(true),
    projectMentions: z.boolean().default(true),
  }),
})

export const fullProfileSchema = profileStep1Schema
  .merge(profileStep2Schema)
  .merge(profileStep3Schema)
