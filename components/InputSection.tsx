import React, { useRef, useState } from 'react';
import { Search, Clipboard, Loader2, FileText, User, UploadCloud, X } from 'lucide-react';
import { UserProfile } from '../types';

interface InputSectionProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  jobDescription: string;
  setJobDescription: (s: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  userProfile,
  setUserProfile,
  jobDescription,
  setJobDescription,
  onAnalyze,
  isAnalyzing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      alert("Only PDF and Text files are currently supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // split metadata "data:application/pdf;base64," from data
      const base64Data = result.split(',')[1];
      
      handleProfileChange('resumeFile', {
        data: base64Data,
        mimeType: file.type,
        name: file.name
      });
      // Clear legacy text if file is uploaded
      handleProfileChange('resumeText', '');
    };
    reader.readAsDataURL(file);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    handleProfileChange('resumeFile', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-500" />
          Application Details
        </h2>
      </div>
      
      <div className="p-6 space-y-6 flex-1 flex flex-col overflow-y-auto">
        
        {/* Target Role */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            Target Role Title
          </label>
          <input
            type="text"
            value={userProfile.targetRole}
            onChange={(e) => handleProfileChange('targetRole', e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 text-sm"
          />
        </div>

        {/* Resume Input (File Upload) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Resume (PDF)
            </span>
          </label>

          {!userProfile.resumeFile ? (
            <div 
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
              `}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,.txt" 
                className="hidden" 
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className="bg-slate-100 p-3 rounded-full">
                  <UploadCloud className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-400">PDF or Text files supported</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-indigo-900 truncate max-w-[180px]">
                    {userProfile.resumeFile.name}
                  </p>
                  <p className="text-xs text-indigo-500">Ready for analysis</p>
                </div>
              </div>
              <button 
                onClick={removeFile}
                className="p-1 hover:bg-white rounded-full transition-colors text-indigo-400 hover:text-indigo-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Fallback for text paste if needed - simplified */}
          {!userProfile.resumeFile && (
             <div className="mt-2 text-right">
                <button 
                  onClick={() => {
                     // Toggle logic if we wanted to support text paste explicitly, 
                     // but for now, we rely on upload as primary.
                  }}
                  className="text-xs text-slate-400 underline hover:text-indigo-600"
                >
                  
                </button>
             </div>
          )}
        </div>

        {/* JD Input */}
        <div className="flex-1 flex flex-col min-h-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between items-center">
            <span className="flex items-center gap-2">
               <Clipboard className="w-4 h-4 text-slate-400" />
               Job Description
            </span>
            <span className="text-xs text-slate-400 font-normal">Paste text</span>
          </label>
          <div className="relative flex-1">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-full min-h-[150px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y transition-all text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 bg-slate-50 hover:bg-white focus:bg-white font-mono"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onAnalyze}
          disabled={!jobDescription.trim() || (!userProfile.resumeFile && !userProfile.resumeText.trim()) || isAnalyzing}
          className={`
            w-full py-3.5 px-4 rounded-lg font-medium shadow-md transition-all
            flex items-center justify-center gap-2 mt-auto
            ${!jobDescription.trim() || (!userProfile.resumeFile && !userProfile.resumeText.trim()) || isAnalyzing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]'
            }
          `}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Fit...
            </>
          ) : (
            <>
              Analyze & Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;