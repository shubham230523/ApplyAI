export interface Job {
  id: string;
  externalId?: string;
  source?: string;
  title: string;
  description: string;
  companyName: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  location?: string;
  countryCode?: string;
  workplaceType?: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP' | 'OTHER';
  experienceLevel?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL' | 'DIRECTOR' | 'EXECUTIVE' | 'INTERNSHIP';
  salaryCurrency?: string;
  salaryMin?: number | string;
  salaryMax?: number | string;
  salaryPeriod?: 'HOURLY' | 'MONTHLY' | 'YEARLY';
  applyUrl?: string;
  contactEmail?: string;
  recruiterId?: string;
  isActive?: boolean;
  postedAt: Date | string;
  expiresAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  location?: string;
  description: string;
}

export interface CandidateProfile {
  name: string;
  email: string;
  phone?: string;
  headline?: string;
  yearsExperience: number;
  skills: string[];
  workExperience: WorkExperience[];
  education: string[];
  certifications: string[];
  projects: string[];
  achievements: string[];
  preferredLocations: string[];
  preferredSalary?: number;
  address?: string;
  profileImageUrl?: string;
  noticePeriod?: string;
  hasResume?: boolean;
}

export interface JobSearchParams {
  title?: string;
  location?: string;
  skills?: string[];
  experienceMin?: number;
  experienceLevel?: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL' | 'DIRECTOR' | 'EXECUTIVE' | 'INTERNSHIP';
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP' | 'OTHER';
  workplaceType?: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  salaryMin?: number;
  postedAfter?: string; // ISO Date String
}

export interface JobForm {
  name: string;
  email: string;
  phone: string;
  yearsExperience: number;
  skills: string[];
  education: string[];
  location: string;
  expectedSalary?: number;
}

export interface OrchestratorResponse {
  query: string;
  params: JobSearchParams;
  jobs: Job[];
  message: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string;
  location?: string;
  status: string;
  appliedAt: Date | string;
}

export interface ApplicationDetail extends Application {
  aiCoverLetter?: string;
  aiAnswers?: any;
  resumeId?: string;
  jobDescription?: string;
}
