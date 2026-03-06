export interface AtsAnalysisResult {
    uuid: string;
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    improvementSuggestions: string[];
    coverLetter: string;
    email: {
        subject: string;
        body: string;
    };
}
