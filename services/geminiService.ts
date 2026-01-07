import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ApplicationAnalysis, UserProfile, ResumeAnalysis, ResumeOptimization } from "../types";

const RESUME_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Full Name" },
        email: { type: Type.STRING, description: "Email Address" },
        phone: { type: Type.STRING, description: "Phone Number" },
        location: { type: Type.STRING, description: "City, State, or Address" },
        links: { type: Type.ARRAY, items: { type: Type.STRING }, description: "LinkedIn URL, Portfolio URL, etc." }
      },
      required: ["name", "email"]
    },
    professionalSummary: { type: Type.STRING, description: "A concise professional summary of the candidate." },
    skills: {
      type: Type.OBJECT,
      properties: {
        technical: { type: Type.ARRAY, items: { type: Type.STRING } },
        soft: { type: Type.ARRAY, items: { type: Type.STRING } },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["technical", "soft", "tools"]
    },
    workExperience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          duration: { type: Type.STRING },
          keyAchievements: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["role", "company", "duration", "keyAchievements"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          duration: { type: Type.STRING, description: "The full duration of study, e.g., '2018 - 2022' or 'Aug 2019 - Present'. Capture the specific months if available." }
        },
        required: ["degree", "institution", "duration"]
      }
    },
    volunteerExperience: {
      type: Type.ARRAY,
      description: "Any volunteer work or community service listed.",
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          organization: { type: Type.STRING },
          duration: { type: Type.STRING },
          description: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["role", "organization", "duration", "description"]
      }
    },
    references: {
      type: Type.ARRAY,
      description: "Professional references if listed.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          title: { type: Type.STRING, description: "Job title and/or company of the reference" },
          contact: { type: Type.STRING, description: "Email or phone number" }
        },
        required: ["name"]
      }
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3-5 key strengths or selling points." }
  },
  required: ["personalInfo", "professionalSummary", "skills", "workExperience", "education", "strengths"]
};

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    applicant: {
      type: Type.OBJECT,
      properties: {
        extractedName: { type: Type.STRING, nullable: true },
        extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        yearsOfExperience: { type: Type.NUMBER },
        experienceSummary: { type: Type.STRING, description: "One sentence summary of candidate's background." },
      },
      required: ["extractedSkills", "yearsOfExperience", "experienceSummary"]
    },
    job: {
      type: Type.OBJECT,
      properties: {
        roleTitle: { type: Type.STRING },
        companyName: { type: Type.STRING, nullable: true },
      },
      required: ["roleTitle"]
    },
    matchAnalysis: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "0-100 match percentage. Be critical. 100% is rare." },
        verdict: { type: Type.STRING, enum: ['Perfect Match', 'Good Match', 'Potential Stretch', 'Underqualified', 'Overqualified'] },
        interviewProbability: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        reasoning: { type: Type.STRING, description: "Objective, recruiter-style justification of the score." },
        comparisonTable: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              requirement: { type: Type.STRING, description: "Specific requirement extracted from JD." },
              applicantQualification: { type: Type.STRING, description: "Evidence from resume. State 'None' if missing." },
              status: { type: Type.STRING, enum: ['Match', 'Partial', 'Missing'] },
              comments: { type: Type.STRING, description: "Critical assessment of the gap." }
            },
            required: ["requirement", "applicantQualification", "status", "comments"]
          }
        }
      },
      required: ["score", "verdict", "interviewProbability", "comparisonTable", "reasoning"]
    },
    coverLetter: {
      type: Type.STRING,
      description: "A tailored cover letter. Follows user instructions if provided."
    }
  },
  required: ["applicant", "job", "matchAnalysis", "coverLetter"]
};

const OPTIMIZATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    newScore: { type: Type.NUMBER, description: "Estimated ATS match score (0-100) after optimization." },
    // Reuse the RESUME_SCHEMA structure for the optimized content
    structuredResume: RESUME_SCHEMA,
    changes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['Keyword', 'Phrasing', 'Formatting'] },
          originalTerm: { type: Type.STRING, description: "The word or phrase from the original resume." },
          newTerm: { type: Type.STRING, description: "The replacement word or phrase used." },
          reason: { type: Type.STRING, description: "Why this change improves ATS visibility (e.g., 'Matches JD terminology')." }
        },
        required: ["type", "originalTerm", "newTerm", "reason"]
      }
    }
  },
  required: ["newScore", "structuredResume", "changes"]
};

const getResumePart = (userProfile: UserProfile) => {
  if (userProfile.resumeText && userProfile.resumeText.trim().length > 0) {
     return {
      text: `RESUME TEXT CONTENT:\n"""\n${userProfile.resumeText}\n"""`
    };
  } else if (userProfile.resumeFile && userProfile.resumeFile.data) {
    return [
      {
        inlineData: {
          data: userProfile.resumeFile.data,
          mimeType: userProfile.resumeFile.mimeType,
        }
      },
      { text: "\n(The above is the Candidate's Resume File)" }
    ];
  } else {
    // Fallback if data was cleared to save space but analysis exists
    throw new Error("Resume content missing. Please re-upload resume.");
  }
};

export const analyzeResume = async (userProfile: UserProfile): Promise<ResumeAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  parts.push({ text: "You are a professional Resume Analyst. Extract the following structured data from the resume provided. Be precise with Personal Info (Phone, Email, LinkedIn). Also extract Volunteer Experience and References if available. For Education, capture the full duration (start and end year/month)." });
  
  const resumeContent = getResumePart(userProfile);
  if (Array.isArray(resumeContent)) {
    parts.push(...resumeContent);
  } else {
    parts.push(resumeContent);
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: RESUME_SCHEMA,
    },
  });

  return JSON.parse(response.text || "{}") as ResumeAnalysis;
};

export const analyzeApplication = async (
  jobDescription: string,
  userProfile: UserProfile,
  customInstructions?: string
): Promise<ApplicationAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please configure your environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct parts based on inputs
  const parts = [];

  // 1. Prompt Instructions
  const promptText = `
    You are a **Senior Technical Recruiter** and **Hiring Manager** with 15+ years of experience.
    
    **YOUR GOAL:** 
    Objectively and critically evaluate if the candidate is a true fit for this specific job description. 
    Do not be overly optimistic. Identify real gaps. If the candidate is missing a core requirement, the score should reflect that.

    **Task 1: The Analysis (Objective & Logical)**
    - Compare the Resume against the JD line-by-line.
    - **Match Score:** Be strict. 
      - < 50%: Missing core skills/experience.
      - 50-70%: Has potential but significant gaps (e.g., years of experience, specific tech stack).
      - 70-85%: Good match, minor gaps.
      - > 85%: Perfect match (Rare).
    - **Gap Analysis Table:** List 5-8 most critical requirements from the JD. For each, verify if the resume provides *evidence*. If the resume lists a skill but shows no experience using it, mark it as 'Partial'.

    **Task 2: The Cover Letter (Tailored)**
    - Write a cover letter that addresses the hiring manager directly.
    - **USER INSTRUCTIONS:** "${customInstructions || "Professional, confident, but not arrogant. Focus on value proposition."}"
    - If no specific instructions, default to:
       1. Hook: Mention the specific role and company (if extracted).
       2. Bridge: Connect the candidate's *proven* experience to the JD's biggest pain points.
       3. Closing: Call to action.
    - Do NOT invent experiences.
    
    Candidate Target Role: ${userProfile.targetRole || "Not specified"}

    JOB DESCRIPTION:
    """
    ${jobDescription}
    """
  `;
  parts.push({ text: promptText });

  // 2. Resume Content
  const resumeContent = getResumePart(userProfile);
  if (Array.isArray(resumeContent)) {
    parts.push(...resumeContent);
  } else {
    parts.push(resumeContent);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        systemInstruction: "You are a critical, objective recruiter. You value evidence over keywords.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text);
    // Add client-side ID and timestamp
    return {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    } as ApplicationAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const optimizeResume = async (
  jobDescription: string,
  userProfile: UserProfile,
  currentScore: number
): Promise<ResumeOptimization> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = [];

  const promptText = `
    You are an **ATS Optimization Expert**. Your task is to rewrite the candidate's resume to better match the Job Description (JD) keywords and phrasing, aiming to improve the ATS match score.
    
    **CRITICAL RULES (DO NOT VIOLATE):**
    1. **NO HALLUCINATIONS:** Do NOT invent skills, jobs, degrees, or personal details the candidate does not have.
    2. **HONEST REPHRASING:** Only rephrase existing experience using the JD's terminology.
    3. **PRESERVE DETAILS:** Keep the candidate's Personal Info (Name, Email, etc.) exactly as is. Do not optimize contact info.
    4. **OUTPUT FORMAT:** Return the FULL resume data structured exactly like the input schema.
    5. **TRACK CHANGES:** List exactly what words/phrases you changed and why.

    Current estimated match score: ${currentScore}/100.
    Target score: Increase by 15-20% if possible without lying.

    JOB DESCRIPTION:
    """
    ${jobDescription}
    """
  `;
  parts.push({ text: promptText });

  const resumeContent = getResumePart(userProfile);
  if (Array.isArray(resumeContent)) {
    parts.push(...resumeContent);
  } else {
    parts.push(resumeContent);
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: OPTIMIZATION_SCHEMA,
    },
  });

  const data = JSON.parse(response.text || "{}");
  return {
    ...data,
    originalScore: currentScore
  } as ResumeOptimization;
};