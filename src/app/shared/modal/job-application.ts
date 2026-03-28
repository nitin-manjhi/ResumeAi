export enum ApplicationStatus {
    INITIALIZED = 'INITIALIZED',
    APPLIED = 'APPLIED',
    PROCESSING = 'PROCESSING',
    REJECTED = 'REJECTED',
    SELECTED = 'SELECTED'
}

export interface JobApplication {
    id?: number;
    companyName: string;
    jobDescription: string;
    status: ApplicationStatus;
    appliedDate: string;
    hrName?: string;
    hrEmail?: string;
    phone?: string;
    resumePath?: string;
    closingDate?: string;
    createdAt?: string;
    updatedAt?: string;
    analysisId?: string;
    jobTitle?: string;
    location?: string;
    salary?: string;
    skills?: string;
    applyLink?: string;
    jobPortal?: string;
    originalPostedDate?: string;
}
export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
}
