import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, numeric, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  headline: text('headline'),
  yearsExperience: integer('years_experience').default(0),
  skills: text('skills').array(),
  preferredLocations: text('preferred_locations').array(),
  preferredSalary: integer('preferred_salary'),
  noticePeriod: text('notice_period'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  contentType: text('content_type').notNull(),
  parsedContent: jsonb('parsed_content'),
  isMain: boolean('is_main').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').unique(),
  source: text('source'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  companyName: text('company_name').notNull(),
  companyWebsite: text('company_website'),
  companyLogoUrl: text('company_logo_url'),
  location: text('location'),
  countryCode: varchar('country_code', { length: 10 }),
  workplaceType: text('workplace_type'), // 'ON_SITE', 'HYBRID', 'REMOTE'
  employmentType: text('employment_type'), // 'FULL_TIME', 'PART_TIME', etc.
  experienceLevel: text('experience_level'), // 'ENTRY_LEVEL', 'MID_LEVEL', etc.
  salaryCurrency: varchar('salary_currency', { length: 5 }),
  salaryMin: numeric('salary_min', { precision: 12, scale: 2 }),
  salaryMax: numeric('salary_max', { precision: 12, scale: 2 }),
  salaryPeriod: text('salary_period'), // 'HOURLY', 'MONTHLY', 'YEARLY'
  applyUrl: text('apply_url'),
  contactEmail: text('contact_email'),
  isActive: boolean('is_active').default(true),
  postedAt: timestamp('posted_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  status: text('status').notNull().default('applied'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id),
  aiCoverLetter: text('ai_cover_letter'),
  aiAnswers: jsonb('ai_answers'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
