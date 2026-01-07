import React, { useState, useEffect } from 'react';
import { ApplicationAnalysis, UserProfile, ResumeOptimization, ResumeAnalysis } from '../types';
import { optimizeResume } from '../services/geminiService';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Briefcase, 
  BarChart, 
  FileText,
  Copy,
  Check,
  Search,
  Wand2,
  ArrowRight,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Download
} from 'lucide-react';

interface AnalysisResultProps {
  analysis: ApplicationAnalysis;
  jobDescription?: string;
  userProfile?: UserProfile; 
}

// Shared Resume Render Logic (Simplified version of ProfileEditor for preview)
const OptimizedResumePreview: React.FC<{ data: ResumeAnalysis; order?: string[] }> = ({ data, order }) => {
    // Determine render order, default to standard if not provided
    const sections = order || ['summary', 'skills', 'experience', 'education', 'volunteer', 'strengths', 'references'];
    const SECTION_LABELS: Record<string, string> = {
        summary: "Professional Summary",
        experience: "Work Experience",
        education: "Education",
        skills: "Skills",
        strengths: "Key Strengths",
        volunteer: "Volunteer Experience",
        references: "References"
    };

    // Helper to check if a section should be rendered
    const shouldRender = (key: string) => {
        if (key === 'summary' && data.professionalSummary) return true;
        if (key === 'experience' && data.workExperience?.length > 0) return true;
        if (key === 'education' && data.education?.length > 0) return true;
        if (key === 'skills' && (data.skills?.technical?.length > 0 || data.skills?.soft?.length > 0)) return true;
        if (key === 'strengths' && data.strengths?.length > 0) return true;
        if (key === 'volunteer' && data.volunteerExperience && data.volunteerExperience.length > 0) return true;
        if (key === 'references' && data.references && data.references.length > 0) return true;
        return false;
    };

    return (
        <div className="bg-white p-[40px] shadow-lg border border-slate-200" style={{ fontFamily: 'Arial, sans-serif' }}>
             {/* Header */}
             <div className="border-b-2 border-slate-800 pb-6 mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">
                    {data.personalInfo?.name || "Candidate Name"}
                </h1>
                <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-700 mt-2 font-medium">
                    {data.personalInfo?.location && <span>{data.personalInfo.location}</span>}
                    {data.personalInfo?.email && <span>| {data.personalInfo.email}</span>}
                    {data.personalInfo?.phone && <span>| {data.personalInfo.phone}</span>}
                    {data.personalInfo?.links?.map((link, i) => (
                        <span key={i}>| {link}</span>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {sections.filter(shouldRender).map(key => (
                    <div key={key}>
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 mb-3 pb-1">
                            {SECTION_LABELS[key]}
                        </h2>
                        
                        {key === 'summary' && (
                            <p className="text-sm text-slate-800 leading-relaxed text-justify">{data.professionalSummary}</p>
                        )}

                        {key === 'experience' && (
                             <div className="space-y-4">
                                {data.workExperience.map((job, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-slate-900 text-sm">{job.role}</h3>
                                            <span className="text-xs font-medium text-slate-800">{job.duration}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-700 italic mb-2">{job.company}</div>
                                        <ul className="list-disc list-outside ml-4 space-y-1">
                                            {job.keyAchievements.map((ach, j) => (
                                                <li key={j} className="text-sm text-slate-800 leading-relaxed pl-1">{ach}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}

                        {key === 'education' && (
                            <div className="space-y-3">
                                {data.education.map((edu, i) => (
                                    <div key={i} className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{edu.institution}</div>
                                            <div className="text-sm text-slate-800">{edu.degree}</div>
                                        </div>
                                        {/* Handle duration or legacy year */}
                                        <span className="text-xs text-slate-700 font-medium">{(edu as any).duration || (edu as any).year}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                         {key === 'skills' && (
                             <div className="text-sm text-slate-800 space-y-2">
                                <div><span className="font-bold">Technical: </span>{data.skills.technical.join(', ')}</div>
                                <div><span className="font-bold">Soft Skills: </span>{data.skills.soft.join(', ')}</div>
                                <div><span className="font-bold">Tools: </span>{data.skills.tools.join(', ')}</div>
                             </div>
                         )}
                         
                         {key === 'strengths' && (
                             <ul className="list-disc list-outside ml-4 space-y-1">
                                {data.strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-slate-800 leading-relaxed pl-1">{s}</li>
                                ))}
                            </ul>
                         )}

                         {key === 'volunteer' && (
                              <div className="space-y-4">
                                {data.volunteerExperience?.map((vol, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-slate-900 text-sm">{vol.role}</h3>
                                            <span className="text-xs font-medium text-slate-800">{vol.duration}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-slate-700 italic mb-2">{vol.organization}</div>
                                        <ul className="list-disc list-outside ml-4 space-y-1">
                                            {vol.description.map((desc, j) => (
                                                <li key={j} className="text-sm text-slate-800 leading-relaxed pl-1">{desc}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                         )}

                         {key === 'references' && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.references?.map((ref, i) => (
                                    <div key={i} className="text-sm text-slate-800">
                                        <div className="font-bold text-slate-900">{ref.name}</div>
                                        {ref.title && <div className="text-xs text-slate-600">{ref.title}</div>}
                                        {ref.contact && <div className="text-xs text-slate-500">{ref.contact}</div>}
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                ))}
            </div>
        </div>
    );
};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, jobDescription, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'letter' | 'optimization' | 'context'>('details');
  const [copied, setCopied] = useState(false);
  const [editableLetter, setEditableLetter] = useState(analysis.coverLetter);
  
  // Optimization State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<ResumeOptimization | undefined>(analysis.optimization);

  useEffect(() => {
    setEditableLetter(analysis.coverLetter);
    setOptimizationResult(analysis.optimization);
  }, [analysis]);

  const handleOptimization = async () => {
    if (!jobDescription || !userProfile) return;
    setIsOptimizing(true);
    try {
        const result = await optimizeResume(jobDescription, userProfile, analysis.matchAnalysis.score);
        setOptimizationResult(result);
    } catch (e) {
        console.error("Optimization failed", e);
        alert("Failed to optimize resume. Please try again.");
    } finally {
        setIsOptimizing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getProbabilityColor = (prob: string) => {
    switch (prob) {
      case 'High': return 'text-emerald-700 bg-emerald-100';
      case 'Medium': return 'text-amber-700 bg-amber-100';
      case 'Low': return 'text-rose-700 bg-rose-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Function to trigger print for the optimized resume specifically
  const printOptimizedResume = () => {
     // We open a new window to print just the clean resume
     const printContent = document.getElementById('optimized-resume-container');
     if (!printContent) return;
     
     const printWindow = window.open('', '', 'width=800,height=900');
     if (!printWindow) return;

     printWindow.document.write(`
        <html>
            <head>
                <title>Optimized Resume</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        @page { margin: 0; size: auto; }
                        body { margin: 0; padding: 15mm; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
        </html>
     `);
     printWindow.document.close();
     printWindow.focus();
     setTimeout(() => {
        printWindow.print();
        printWindow.close();
     }, 250);
  };

  return (
    <div className="space-y-6 animate-fade-in-up flex flex-col w-full">
      {/* Top Summary Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{analysis.job.roleTitle}</h2>
            {analysis.job.companyName && (
              <p className="text-sm text-slate-500 mb-3">{analysis.job.companyName}</p>
            )}
            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-indigo-200 pl-3">
              "{analysis.matchAnalysis.reasoning}"
            </p>
          </div>
          
          <div className="flex items-center gap-4 min-w-[240px]">
            <div className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(analysis.matchAnalysis.score)}`}>
              <span className="text-3xl font-bold">{analysis.matchAnalysis.score}%</span>
              <span className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-80">Match Score</span>
            </div>
            <div className="flex flex-col gap-2">
               <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-center ${getProbabilityColor(analysis.matchAnalysis.interviewProbability)}`}>
                 {analysis.matchAnalysis.interviewProbability} Chance
               </div>
               <div className="text-xs text-slate-400 text-center font-medium">
                 Interview Probability
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button onClick={() => setActiveTab('details')} className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><BarChart className="w-4 h-4" /> Gap Analysis</button>
        <button onClick={() => setActiveTab('letter')} className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'letter' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><FileText className="w-4 h-4" /> Cover Letter</button>
        {userProfile && jobDescription && (
             <button onClick={() => setActiveTab('optimization')} className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'optimization' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Wand2 className="w-4 h-4" /> Resume Optimizer</button>
        )}
        {jobDescription && (
            <button onClick={() => setActiveTab('context')} className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'context' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Search className="w-4 h-4" /> Job Context</button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 p-6 min-h-[400px]">
        
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Table Code (Same as before) */}
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Requirement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Your Profile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[100px]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recruiter's Note</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200 text-sm">
                  {analysis.matchAnalysis.comparisonTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-800 font-medium align-top">{row.requirement}</td>
                      <td className="px-4 py-3 text-slate-600 align-top">{row.applicantQualification}</td>
                      <td className="px-4 py-3 align-top">
                        {row.status === 'Match' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Match</span>}
                        {row.status === 'Partial' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Partial</span>}
                        {row.status === 'Missing' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">Missing</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs italic align-top">{row.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'letter' && (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-slate-900">Tailored Cover Letter</h3>
               <button onClick={() => copyToClipboard(editableLetter)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy Text'}</button>
            </div>
            <textarea value={editableLetter} onChange={(e) => setEditableLetter(e.target.value)} className="flex-1 w-full p-6 bg-slate-50 rounded-lg border border-slate-200 font-serif text-slate-800 leading-relaxed shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[500px]" />
          </div>
        )}

        {activeTab === 'optimization' && (
             <div className="space-y-6">
                {!optimizationResult ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-indigo-100 rounded-xl bg-indigo-50/30">
                        <div className="bg-indigo-100 p-4 rounded-full mb-4">
                            <Wand2 className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Improve ATS Visibility</h3>
                        <p className="text-slate-500 text-center max-w-md mb-6">
                            The AI can rewrite your resume to better match keywords in the Job Description. 
                            It will NOT invent skills, but it will rephrase your existing experience to align with the employer's language.
                        </p>
                        <button onClick={handleOptimization} disabled={isOptimizing} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2">
                            {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                            {isOptimizing ? 'Optimizing...' : 'Generate Optimized Resume'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Comparison & Stats */}
                        <div className="xl:col-span-4 space-y-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-4">Predicted Match Score</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Original</span><span className="font-bold text-slate-700">{optimizationResult.originalScore}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-slate-400 h-2.5 rounded-full" style={{ width: `${optimizationResult.originalScore}%` }}></div></div>
                                    <div className="flex items-center justify-between text-sm mt-2"><span className="text-indigo-600 font-medium">Optimized</span><span className="font-bold text-indigo-600">{optimizationResult.newScore}%</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${optimizationResult.newScore}%` }}></div></div>
                                    <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Potential {optimizationResult.newScore - optimizationResult.originalScore}% increase</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 max-h-[600px] overflow-y-auto">
                                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Wand2 className="w-4 h-4 text-indigo-500" /> Key Improvements</h4>
                                <div className="space-y-4">
                                    {optimizationResult.changes.map((change, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${change.type === 'Keyword' ? 'bg-blue-100 text-blue-700' : change.type === 'Phrasing' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{change.type}</span>
                                            </div>
                                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-2">
                                                <span className="text-red-500 line-through decoration-red-300 decoration-2">{change.originalTerm}</span>
                                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                                <span className="text-emerald-600 font-semibold">{change.newTerm}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 italic">{change.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Visual Preview */}
                        <div className="xl:col-span-8">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-slate-900">Optimized Resume Preview</h3>
                                <button 
                                  onClick={printOptimizedResume} 
                                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download PDF
                                </button>
                             </div>
                             {/* Container for the preview - this inner ID is what gets printed */}
                             <div className="border border-slate-300 shadow-md rounded-lg overflow-hidden bg-slate-500/10 p-4">
                                 <div id="optimized-resume-container" className="mx-auto" style={{ maxWidth: '210mm' }}>
                                     <OptimizedResumePreview 
                                        data={optimizationResult.structuredResume} 
                                        order={userProfile?.sectionOrder}
                                     />
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
             </div>
        )}

        {activeTab === 'context' && jobDescription && (
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-900">Original Job Description</h3>
                </div>
                <div className="flex-1 p-6 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap shadow-inner overflow-y-auto max-h-[600px]">
                    {jobDescription}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;