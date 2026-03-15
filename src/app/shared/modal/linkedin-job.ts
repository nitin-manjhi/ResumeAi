export interface LinkedInJobSearchRequest {
  keyword: string;
  location: string;
  experienceLevel?: string;
  jobType?: string;
  datePosted?: string;
  remote?: boolean;
  limit?: number;
}

export interface LinkedInJobDTO {
  title: string;
  company: string;
  location: string;
  postedDate: string;
  postedDateSortValue?: number;
  salary: string;
  skills: string[];
  description: string;
  applyLink: string;
}

export interface LinkedInJobResponse {
  total: number;
  jobs: LinkedInJobDTO[];
}

export interface LinkedInJobStatusResponse {
  jobId?: string;
  status?: string;
  progress?: number;
  errorMessage?: string;
  total?: number;
  jobs?: LinkedInJobDTO[];
}
