import React, { useRef, useState, useEffect } from 'react';
import { UserProfile, ResumeAnalysis } from '../types';
import { FileText, UploadCloud, X, CheckCircle, FileType, LayoutDashboard, Loader2, Sparkles, RefreshCw, GripVertical, Download, Printer, MapPin, Phone, Mail, Link as LinkIcon, Edit3 } from 'lucide-react';
import { extractTextFromDocx, readFileAsBase64 } from '../services/fileService';
import { analyzeResume } from '../services/geminiService';

interface ProfileEditorProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  strengths: "Key Strengths",
  volunteer: "Volunteer Experience",
  references: "References"
};

const ProfileEditor: React.FC<ProfileEditorProps> = ({ userProfile, setUserProfile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    // Initialize default section order if not present
    if (!userProfile.sectionOrder && userProfile.analysis) {
      const order = ['summary', 'skills', 'experience', 'education', 'volunteer', 'strengths', 'references'];
      setUserProfile(prev => ({
        ...prev,
        sectionOrder: order
      }));
    }
  }, [userProfile.analysis, userProfile.sectionOrder, setUserProfile]);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePersonalInfoChange = (field: keyof ResumeAnalysis['personalInfo'], value: any) => {
    if (!userProfile.analysis) return;
    const updatedAnalysis = {
        ...userProfile.analysis,
        personalInfo: {
            ...userProfile.analysis.personalInfo,
            [field]: value
        }
    };
    handleProfileChange('analysis', updatedAnalysis);
  };

  const handleFile = async (file: File) => {
    setProcessing(true);
    try {
      if (file.type === 'application/pdf') {
        const base64Data = await readFileAsBase64(file);
        handleProfileChange('resumeFile', { data: base64Data, mimeType: file.type, name: file.name });
        handleProfileChange('resumeText', '');
        handleProfileChange('analysis', undefined); 
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const extractedText = await extractTextFromDocx(file);
        handleProfileChange('resumeText', extractedText);
        handleProfileChange('resumeFile', { data: '', mimeType: file.type, name: file.name });
        handleProfileChange('analysis', undefined);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        handleProfileChange('resumeText', text);
        handleProfileChange('resumeFile', { data: '', mimeType: file.type, name: file.name });
        handleProfileChange('analysis', undefined);
      } else {
        alert("Unsupported file type. Please use PDF, DOCX, or TXT.");
      }
    } catch (e) {
      console.error(e);
      alert("Error reading file.");
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = () => {
    handleProfileChange('resumeFile', null);
    handleProfileChange('resumeText', '');
    handleProfileChange('analysis', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyzeResume = async () => {
    if (!userProfile.resumeFile && !userProfile.resumeText) return;
    setAnalyzingResume(true);
    try {
        const analysis = await analyzeResume(userProfile);
        handleProfileChange('analysis', analysis);
        // Reset order when new analysis comes in, including potential new sections
        handleProfileChange('sectionOrder', ['summary', 'skills', 'experience', 'education', 'volunteer', 'strengths', 'references']);
    } catch (e) {
        console.error(e);
        alert("Failed to analyze resume. Please try again.");
    } finally {
        setAnalyzingResume(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || !userProfile.sectionOrder) return;
    
    const newOrder = [...userProfile.sectionOrder];
    const itemToMove = newOrder[draggedItem];
    newOrder.splice(draggedItem, 1);
    newOrder.splice(index, 0, itemToMove);
    
    handleProfileChange('sectionOrder', newOrder);
    setDraggedItem(null);
  };

  const printResume = () => {
    window.print();
  };

  // Helper to check if a section should be rendered
  const shouldRenderSection = (key: string, analysis?: ResumeAnalysis) => {
      if (!analysis) return false;
      if (key === 'summary' && analysis.professionalSummary) return true;
      if (key === 'experience' && analysis.workExperience?.length > 0) return true;
      if (key === 'education' && analysis.education?.length > 0) return true;
      if (key === 'skills' && (analysis.skills?.technical?.length > 0 || analysis.skills?.soft?.length > 0)) return true;
      if (key === 'strengths' && analysis.strengths?.length > 0) return true;
      if (key === 'volunteer' && analysis.volunteerExperience && analysis.volunteerExperience.length > 0) return true;
      if (key === 'references' && analysis.references && analysis.references.length > 0) return true;
      return false;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12 print:max-w-none print:p-0">
      
      {/* Header - Hidden in Print */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2 print:hidden">
        <div>
           <h2 className="text-3xl font-bold text-slate-900">Resume Builder</h2>
           <p className="text-slate-500 mt-2">Upload your resume, analyze it, and drag sections to rearrange your layout.</p>
        </div>
        {userProfile.analysis && (
           <button 
             onClick={printResume}
             className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
           >
             <Download className="w-4 h-4" /> Download PDF
           </button>
        )}
      </div>

      {/* Upload Section - Hidden in Print */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print:hidden">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <h3 className="font-semibold text-slate-800 text-lg">Target Role</h3>
               <p className="text-sm text-slate-500">
                  Specify the job title you are aiming for.
               </p>
               <input
                    type="text"
                    value={userProfile.targetRole}
                    onChange={(e) => handleProfileChange('targetRole', e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 shadow-sm"
                  />
            </div>
            <div className="space-y-4">
               <h3 className="font-semibold text-slate-800 text-lg">Source Resume</h3>
               {!userProfile.resumeFile ? (
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                    onClick={() => !processing && fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Click to upload resume</p>
                    {processing && <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mt-2" />}
                  </div>
               ) : (
                  <div className="flex items-center gap-4">
                      <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
                         <span className="text-sm font-medium text-indigo-900 truncate">{userProfile.resumeFile.name}</span>
                         <button onClick={removeFile}><X className="w-4 h-4 text-indigo-400 hover:text-red-500" /></button>
                      </div>
                      {!userProfile.analysis ? (
                          <button onClick={handleAnalyzeResume} disabled={analyzingResume} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md flex items-center gap-2">
                             {analyzingResume ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Extract
                          </button>
                      ) : (
                          <button onClick={handleAnalyzeResume} disabled={analyzingResume} className="px-4 py-3 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl font-medium flex items-center gap-2">
                             <RefreshCw className="w-4 h-4" /> Re-extract
                          </button>
                      )}
                  </div>
               )}
            </div>
         </div>
         
         {/* Personal Info Editor */}
         {userProfile.analysis && (
             <div className="mt-8 border-t border-slate-100 pt-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 text-lg">Personal Information</h3>
                    <button 
                        onClick={() => setEditingInfo(!editingInfo)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                    >
                        <Edit3 className="w-4 h-4" /> {editingInfo ? 'Done Editing' : 'Edit Details'}
                    </button>
                 </div>
                 
                 {editingInfo ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input type="text" placeholder="Full Name" value={userProfile.analysis.personalInfo?.name || ''} onChange={e => handlePersonalInfoChange('name', e.target.value)} className="p-2 border rounded" />
                         <input type="text" placeholder="Email" value={userProfile.analysis.personalInfo?.email || ''} onChange={e => handlePersonalInfoChange('email', e.target.value)} className="p-2 border rounded" />
                         <input type="text" placeholder="Phone" value={userProfile.analysis.personalInfo?.phone || ''} onChange={e => handlePersonalInfoChange('phone', e.target.value)} className="p-2 border rounded" />
                         <input type="text" placeholder="Location" value={userProfile.analysis.personalInfo?.location || ''} onChange={e => handlePersonalInfoChange('location', e.target.value)} className="p-2 border rounded" />
                         <input type="text" placeholder="LinkedIn / Links (comma separated)" value={userProfile.analysis.personalInfo?.links?.join(', ') || ''} onChange={e => handlePersonalInfoChange('links', e.target.value.split(',').map(s => s.trim()))} className="p-2 border rounded md:col-span-2" />
                     </div>
                 ) : (
                     <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                         {userProfile.analysis.personalInfo?.name && <span className="font-bold text-slate-900">{userProfile.analysis.personalInfo.name}</span>}
                         {userProfile.analysis.personalInfo?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {userProfile.analysis.personalInfo.email}</span>}
                         {userProfile.analysis.personalInfo?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {userProfile.analysis.personalInfo.phone}</span>}
                         {userProfile.analysis.personalInfo?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {userProfile.analysis.personalInfo.location}</span>}
                     </div>
                 )}
             </div>
         )}
      </div>

      {/* Resume Builder / Preview Area */}
      {!userProfile.analysis ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 print:hidden">
             <LayoutDashboard className="w-16 h-16 text-slate-300 mb-4" />
             <p className="text-center">Upload and extract your resume to enable the builder.</p>
          </div>
      ) : (
          <div className="bg-white shadow-lg mx-auto print:shadow-none print:w-full print:max-w-none" style={{ maxWidth: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
              {/* Paper Layout */}
              <div className="p-[40px] print:p-0">
                  
                  {/* Header (Dynamic from Personal Info) */}
                  <div className="border-b-2 border-slate-800 pb-6 mb-6 text-center">
                      <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">
                          {userProfile.analysis.personalInfo?.name || "Candidate Name"}
                      </h1>
                      <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-700 mt-2 font-medium">
                          {userProfile.analysis.personalInfo?.location && <span>{userProfile.analysis.personalInfo.location}</span>}
                          {userProfile.analysis.personalInfo?.email && <span>| {userProfile.analysis.personalInfo.email}</span>}
                          {userProfile.analysis.personalInfo?.phone && <span>| {userProfile.analysis.personalInfo.phone}</span>}
                          {userProfile.analysis.personalInfo?.links?.map((link, i) => (
                              <span key={i}>| {link}</span>
                          ))}
                      </div>
                  </div>

                  {/* Draggable Sections */}
                  <div className="space-y-6">
                      {userProfile.sectionOrder
                        ?.filter(sectionKey => shouldRenderSection(sectionKey, userProfile.analysis))
                        .map((sectionKey, index) => (
                          <div 
                            key={sectionKey}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`
                                relative group transition-all rounded-lg
                                ${draggedItem === index ? 'opacity-50' : 'opacity-100'}
                                hover:bg-slate-50 print:hover:bg-white
                                cursor-move print:cursor-auto
                            `}
                          >
                              {/* Drag Handle (Hidden in Print) */}
                              <div className="absolute -left-8 top-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden text-slate-400">
                                  <GripVertical className="w-5 h-5" />
                              </div>

                              {/* Section Content */}
                              <div className="px-2 py-1">
                                  {/* Section Title */}
                                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 mb-3 pb-1">
                                      {SECTION_LABELS[sectionKey]}
                                  </h2>

                                  {/* Render Section Body */}
                                  {sectionKey === 'summary' && (
                                      <p className="text-sm text-slate-800 leading-relaxed text-justify">
                                          {userProfile.analysis?.professionalSummary}
                                      </p>
                                  )}

                                  {sectionKey === 'experience' && (
                                      <div className="space-y-5">
                                          {userProfile.analysis?.workExperience.map((job, i) => (
                                              <div key={i}>
                                                  <div className="flex justify-between items-baseline mb-1">
                                                      <h3 className="font-bold text-slate-900 text-sm">{job.role}</h3>
                                                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{job.duration}</span>
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

                                  {sectionKey === 'education' && (
                                      <div className="space-y-3">
                                          {userProfile.analysis?.education.map((edu, i) => (
                                              <div key={i} className="flex justify-between items-start">
                                                  <div>
                                                      <div className="font-bold text-slate-900 text-sm">{edu.institution}</div>
                                                      <div className="text-sm text-slate-800">{edu.degree}</div>
                                                  </div>
                                                  {/* Handle duration property or legacy year property */}
                                                  <span className="text-xs text-slate-700 font-medium">
                                                    {(edu as any).duration || (edu as any).year}
                                                  </span>
                                              </div>
                                          ))}
                                      </div>
                                  )}

                                  {sectionKey === 'skills' && (
                                      <div className="text-sm text-slate-800 space-y-2">
                                          <div>
                                              <span className="font-bold text-slate-900">Technical: </span>
                                              {userProfile.analysis?.skills.technical.join(', ')}
                                          </div>
                                          <div>
                                              <span className="font-bold text-slate-900">Soft Skills: </span>
                                              {userProfile.analysis?.skills.soft.join(', ')}
                                          </div>
                                          <div>
                                              <span className="font-bold text-slate-900">Tools: </span>
                                              {userProfile.analysis?.skills.tools.join(', ')}
                                          </div>
                                      </div>
                                  )}

                                  {sectionKey === 'strengths' && (
                                      <ul className="list-disc list-outside ml-4 space-y-1">
                                          {userProfile.analysis?.strengths.map((s, i) => (
                                              <li key={i} className="text-sm text-slate-800 leading-relaxed pl-1">{s}</li>
                                          ))}
                                      </ul>
                                  )}

                                  {sectionKey === 'volunteer' && (
                                      <div className="space-y-5">
                                          {userProfile.analysis?.volunteerExperience?.map((vol, i) => (
                                              <div key={i}>
                                                  <div className="flex justify-between items-baseline mb-1">
                                                      <h3 className="font-bold text-slate-900 text-sm">{vol.role}</h3>
                                                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{vol.duration}</span>
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

                                  {sectionKey === 'references' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          {userProfile.analysis?.references?.map((ref, i) => (
                                              <div key={i} className="text-sm text-slate-800">
                                                  <div className="font-bold text-slate-900">{ref.name}</div>
                                                  {ref.title && <div className="text-xs text-slate-600">{ref.title}</div>}
                                                  {ref.contact && <div className="text-xs text-slate-500">{ref.contact}</div>}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
      
      {/* Global Print Styles */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white; -webkit-print-color-adjust: exact; }
          /* Hide app chrome */
          header, nav, footer, .print\\:hidden { display: none !important; }
          /* Ensure layout width */
          .print\\:w-full { width: 100% !important; max-width: none !important; margin: 0 !important; box-shadow: none !important; }
          .print\\:p-0 { padding: 15mm !important; }
        }
      `}</style>
    </div>
  );
};

export default ProfileEditor;