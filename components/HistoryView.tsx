import React from 'react';
import { ApplicationAnalysis } from '../types';
import { Clock, ChevronRight, FileText, Trash2 } from 'lucide-react';

interface HistoryViewProps {
  history: ApplicationAnalysis[];
  onSelect: (item: ApplicationAnalysis) => void;
  onClear: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
           <Clock className="w-10 h-10 opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-600">No History Yet</h3>
        <p className="max-w-xs text-center mt-2">Past analyses will appear here automatically after you run them.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">History</h2>
        <button 
          onClick={onClear}
          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" /> Clear All
        </button>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                     item.matchAnalysis.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                     item.matchAnalysis.score >= 60 ? 'bg-amber-100 text-amber-700' :
                     'bg-red-100 text-red-700'
                  }`}>
                     <span className="font-bold text-lg">{item.matchAnalysis.score}%</span>
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">
                        {item.job.roleTitle}
                     </h3>
                     <p className="text-slate-500 text-sm">{item.job.companyName || 'Unknown Company'}</p>
                     <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                     </div>
                  </div>
               </div>
               
               <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryView;