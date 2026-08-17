import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  contentType: text('content_type').notNull(),
  parsedContent: jsonb('parsed_content'),
  isMain: boolean('is_main').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  sourceJobId: text('source_job_id').notNull(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  companyLogo: text('company_logo'),
  description: text('description').notNull(),
  location: text('location').notNull(),
  workMode: text('work_mode').notNull(), // remote, hybrid, onsite
  employmentType: text('employment_type').notNull(),
  experienceMin: integer('experience_min'),
  experienceMax: integer('experience_max'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: text('salary_currency').default('INR'),
  skills: text('skills').array(),
  postedAt: timestamp('posted_at').notNull(),
  applicationUrl: text('application_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobs.id).notNull(),
  status: text('status').notNull().default('applied'), // prepared, applied, interview, rejected, offer
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id),
  aiCoverLetter: text('ai_cover_letter'),
  aiAnswers: jsonb('ai_answers'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
