import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  yearsExperience: z.number().int().min(0).nullable().default(0),
  skills: z.array(z.string()).optional().nullable(),
  preferredLocations: z.array(z.string()).optional().nullable(),
  preferredSalary: z.number().int().optional().nullable(),
  address: z.string().optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  noticePeriod: z.string().optional().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
