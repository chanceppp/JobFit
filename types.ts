export interface ResumeAnalysis {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    links: string[]; // LinkedIn, Portfolio, etc.
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  workExperience: {
    role: string;
    company: string;
    duration: string;
    keyAchievements: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    duration: string; // Changed from year to duration to capture full range
  }[];
  volunteerExperience?: {
    role: string;
    organization: string;
    duration: string;
    description: string[];
  }[];
  references?: {
    name: string;
    title: string;
    contact: string;
  }[];
  strengths: string[];
}

export interface UserProfile {
  resumeText: string;
  resumeFile: {
    data: string;
    mimeType: string;
    name: string;
  } | null;
  targetRole: string;
  analysis?: ResumeAnalysis; // This acts as the "Active Resume Data"
  sectionOrder?: string[]; // To track the order of sections (e.g., ['summary', 'experience', 'education'])
}

export interface ComparisonRow {
  requirement: string;
  applicantQualification: string;
  status: 'Match' | 'Partial' | 'Missing';
  comments: string;
}

export interface ResumeOptimization {
  originalScore: number;
  newScore: number;
  // We now expect structured data back to render it in the same format
  structuredResume: ResumeAnalysis; 
  changes: {
    type: 'Keyword' | 'Phrasing' | 'Formatting';
    originalTerm: string;
    newTerm: string;
    reason: string;
  }[];
}

export interface ApplicationAnalysis {
  id: string;
  timestamp: number;
  applicant: {
    extractedName: string | null;
    extractedSkills: string[];
    yearsOfExperience: number;
    experienceSummary: string;
  };
  job: {
    roleTitle: string;
    companyName: string | null;
  };
  matchAnalysis: {
    score: number;
    verdict: 'Perfect Match' | 'Good Match' | 'Potential Stretch' | 'Underqualified' | 'Overqualified';
    interviewProbability: 'High' | 'Medium' | 'Low';
    comparisonTable: ComparisonRow[];
    reasoning: string;
  };
  coverLetter: string;
  optimization?: ResumeOptimization;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}