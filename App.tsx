import React, { useState, useEffect } from 'react';
import ProfileEditor from './components/ProfileEditor';
import AnalysisView from './components/AnalysisView';
import HistoryView from './components/HistoryView';
import AnalysisResult from './components/AnalysisResult'; // Reused for History detail view
import { ApplicationAnalysis, UserProfile } from './types';
import { Briefcase, User, FileText, History, ArrowLeft } from 'lucide-react';

type ViewState = 'profile' | 'analysis' | 'history' | 'history-detail';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('profile');
  
  // Persistent State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    resumeText: "",
    resumeFile: null,
    targetRole: ""
  });
  
  const [history, setHistory] = useState<ApplicationAnalysis[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ApplicationAnalysis | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('jobFit_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    }

    const savedHistory = localStorage.getItem('jobFit_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('jobFit_profile', JSON.stringify(userProfile));
    } catch (e) {
      // If QuotaExceeded (file too big), try saving without the binary file data, just text
      console.warn("Storage quota exceeded, saving text only.");
      const textOnlyProfile = {
        ...userProfile,
        resumeFile: userProfile.resumeFile ? { ...userProfile.resumeFile, data: '' } : null
      };
      localStorage.setItem('jobFit_profile', JSON.stringify(textOnlyProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('jobFit_history', JSON.stringify(history));
    } catch (e) {
      console.warn("History storage quota exceeded");
    }
  }, [history]);

  const handleAnalysisComplete = (result: ApplicationAnalysis) => {
    setHistory(prev => [result, ...prev]);
  };

  const handleHistorySelect = (item: ApplicationAnalysis) => {
    setSelectedHistoryItem(item);
    setView('history-detail');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      
      {/* Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm shadow-indigo-200">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              JobFit <span className="text-indigo-600">Kit</span>
            </h1>
          </div>

          <nav className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl">
             <button 
               onClick={() => setView('profile')}
               className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${view === 'profile' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <User className="w-4 h-4" />
               Profile
             </button>
             <button 
               onClick={() => setView('analysis')}
               className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${(view === 'analysis' || view === 'history-detail') ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <FileText className="w-4 h-4" />
               Analysis
             </button>
             <button 
               onClick={() => setView('history')}
               className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${view === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <History className="w-4 h-4" />
               History
             </button>
          </nav>

          <div className="flex items-center gap-2">
             <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full hidden sm:block">
               Gemini 3.0 Flash
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        
        {view === 'profile' && (
          <ProfileEditor 
            userProfile={userProfile} 
            setUserProfile={setUserProfile} 
          />
        )}

        {view === 'analysis' && (
          <AnalysisView 
            userProfile={userProfile}
            onAnalysisComplete={handleAnalysisComplete}
            goToProfile={() => setView('profile')}
          />
        )}

        {view === 'history' && (
          <HistoryView 
             history={history}
             onSelect={handleHistorySelect}
             onClear={() => setHistory([])}
          />
        )}

        {view === 'history-detail' && selectedHistoryItem && (
           <div className="h-full flex flex-col animate-fade-in-right">
              <button 
                onClick={() => setView('history')}
                className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Back to History
              </button>
              <div className="flex-1 overflow-hidden">
                 <AnalysisResult analysis={selectedHistoryItem} />
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;