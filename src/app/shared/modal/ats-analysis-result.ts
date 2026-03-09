export interface AtsAnalysisResult {
    uuid: string;
    score: number;
    scoreExplanation: string | string[];
    matchedSkills: string[];
    missingSkills: string[];
    improvementSuggestions: string[];
    optimizedResume: string;
    coverLetter: string;
    email: {
        subject: string;
        body: string;
    };
    structuredResume?: any;
    skillImportance?: { [key: string]: string };
}
