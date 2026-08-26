export interface Job {
  id: string;
  source: string;
  sourceJobId: string;
  title: string;
  company: string;
  companyLogo?: string;
  description: string;
  location: string;
  country: string;
  city: string;
  workMode: 'remote' | 'hybrid' | 'onsite';
  employmentType: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills: string[];
  postedAt: Date;
  applicationUrl: string;
  applicationMethod: string;
  sourceUrl: string;
  createdAt: Date;
  updatedAt: Date;
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
  noticePeriod?: string;
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
  workMode?: 'remote' | 'hybrid' | 'onsite';
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
