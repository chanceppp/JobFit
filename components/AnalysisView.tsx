import React, { useState, useRef } from 'react';
import { UserProfile, ApplicationAnalysis, AnalysisStatus } from '../types';
import { analyzeApplication } from '../services/geminiService';
import AnalysisResult from './AnalysisResult';
import { Briefcase, AlertCircle, Sparkles, ArrowRight, Loader2, Eraser, PenTool } from 'lucide-react';

interface AnalysisViewProps {
  userProfile: UserProfile;
  onAnalysisComplete: (result: ApplicationAnalysis) => void;
  goToProfile: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ userProfile, onAnalysisComplete, goToProfile }) => {
  const [jobDescription, setJobDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [currentResult, setCurrentResult] = useState<ApplicationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);

  const hasResume = !!userProfile.resumeFile || !!userProfile.resumeText;

  const executeAnalysis = async () => {
    if (!jobDescription.trim()) return;
    setStatus(AnalysisStatus.ANALYZING);
    setError(null);
    try {
      const result = await analyzeApplication(jobDescription, userProfile, instructions);
      setCurrentResult(result);
      onAnalysisComplete(result);
      setStatus(AnalysisStatus.SUCCESS);
      // Scroll to result
      setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e) {
      setError("Failed to generate analysis. Please try again. If your resume is very large, try using the text version.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const clearAnalysis = () => {
      setJobDescription("");
      setInstructions("");
      setCurrentResult(null);
      setStatus(AnalysisStatus.IDLE);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">Job Fit Analysis</h2>
           <p className="text-slate-500 mt-2">Paste a job description and let the AI Recruiter analyze your fit.</p>
        </div>
      </div>

      {/* Input Section (Always visible) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transition-all">
         
         {/* JD Input */}
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 text-lg">Job Description</h3>
            </div>
            {jobDescription && (
                <button 
                    onClick={clearAnalysis}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <Eraser className="w-4 h-4" /> Clear
                </button>
            )}
         </div>

         <div className="relative mb-8">
             <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description text here..."
                disabled={status === AnalysisStatus.ANALYZING}
                className="w-full h-64 p-6 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm leading-relaxed font-mono resize-y shadow-inner transition-all disabled:opacity-70 disabled:bg-slate-100"
             />
         </div>

         {/* Instructions Input */}
         <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-800 text-sm">Cover Letter Preferences (Optional)</h3>
            </div>
            <input 
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g., 'Make it enthusiastic but brief', 'Focus on my leadership experience', 'Use a formal tone'"
                disabled={status === AnalysisStatus.ANALYZING}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900"
            />
         </div>

         {/* Error Message */}
         {status === AnalysisStatus.ERROR && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
         )}

         {/* Actions */}
         <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm">
                {!hasResume ? (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                        <AlertCircle className="w-4 h-4" />
                        <span>Resume missing. </span>
                        <button onClick={goToProfile} className="font-bold underline hover:text-amber-800">Go to Profile</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">Using your saved resume.</span>
                    </div>
                )}
            </div>

            <button 
                onClick={executeAnalysis}
                disabled={!hasResume || !jobDescription.trim() || status === AnalysisStatus.ANALYZING}
                className={`
                    px-8 py-3.5 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
                    ${!hasResume || !jobDescription.trim() || status === AnalysisStatus.ANALYZING 
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                    }
                `}
            >
                {status === AnalysisStatus.ANALYZING ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Fit...
                    </>
                ) : (
                    <>
                        Run Analysis <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
         </div>
      </div>

      {/* Results Section */}
      {currentResult && (
          <div ref={resultRef} className="animate-fade-in-up">
              <AnalysisResult 
                analysis={currentResult} 
                jobDescription={jobDescription} 
                userProfile={userProfile}
              />
          </div>
      )}
    </div>
  );
};

export default AnalysisView;