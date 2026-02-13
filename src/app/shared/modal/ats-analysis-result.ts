export interface AtsAnalysisResult {
    uuid: string;
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    improvements: string[];
    email: {
        subject: string;
        body: string;
    };
}
