export interface AtsAnalysisResult {
    uuid: string;
    score: number;
    scoreExplanation: string;
    matchedSkills: string[];
    missingSkills: string[];
    improvementSuggestions: string[];
    newResume: string;
    coverLetter: string;
    email: {
        subject: string;
        body: string;
    };
}
