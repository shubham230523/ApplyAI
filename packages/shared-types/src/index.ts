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

export interface CandidateProfile {
  name: string;
  email: string;
  phone?: string;
  headline?: string;
  yearsExperience: number;
  skills: string[];
  companies: string[];
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
  salaryMin?: number;
  workMode?: 'remote' | 'hybrid' | 'onsite';
}

export interface OrchestratorResponse {
  query: string;
  params: JobSearchParams;
  jobs: Job[];
  message: string;
}
