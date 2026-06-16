"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function ResultsDashboard() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/results/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-secondary font-bold text-lg">Compiling Final Evaluation Report...</p>
      </div>
    );
  }

  if (!results) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-bold">Results not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-16">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-heading font-extrabold text-2xl text-secondary tracking-tight">ScreenR.</span>
            </div>
            <div className="flex items-center">
               <button onClick={() => router.push('/')} className="bg-secondary hover:bg-blue-900 text-white px-6 py-2 rounded font-semibold transition-colors">Start New Assessment</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        
        {/* Candidate Info Card */}
        <div className="bg-white border-t-4 border-primary rounded shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-blue-50 text-secondary font-bold rounded-sm text-xs uppercase tracking-wider mb-3">Official Report</div>
            <h1 className="text-3xl font-heading font-extrabold text-secondary mb-2">Candidate Evaluation</h1>
            <p className="text-gray-500">Target Role: <span className="font-bold text-gray-800">{results.role}</span></p>
          </div>
          <div className="mt-6 md:mt-0 text-right">
             <p className="text-xl font-heading font-bold text-secondary">{results.candidate}</p>
             <p className="text-sm text-gray-400">Session ID: {sessionId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Detailed Q&A */}
            <div className="bg-white rounded shadow-sm p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-4">
                <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center border border-gray-200">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                </div>
                <h2 className="text-2xl font-heading font-bold text-secondary">Interview Transcript</h2>
              </div>
              
              <div className="space-y-10">
                {results.qa_pairs.map((qa: any, idx: number) => (
                  <div key={idx} className="relative pl-8 border-l-2 border-gray-200">
                    <div className="absolute w-6 h-6 bg-secondary rounded-full text-white text-xs font-bold flex items-center justify-center -left-[13px] top-0 border-4 border-white">
                      {idx + 1}
                    </div>
                    
                    <div className="mb-4">
                      <p className="font-bold text-secondary mb-1">Question:</p>
                      <p className="text-gray-800 font-medium">{qa.question}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="font-bold text-gray-500 mb-1">Answer:</p>
                      <p className="text-gray-600 whitespace-pre-wrap">{qa.answer || <span className="italic">No answer</span>}</p>
                    </div>

                    {qa.evaluation && (
                      <div className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                        <div className="flex flex-col items-center justify-center bg-white rounded border border-gray-200 h-14 w-14 flex-shrink-0 shadow-sm">
                          <span className={`text-lg font-black ${qa.evaluation.score >= 8 ? 'text-green-600' : qa.evaluation.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {qa.evaluation.score}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">/ 10</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">AI Feedback</p>
                          <p className="text-gray-700 text-sm leading-relaxed">{qa.evaluation.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar (Right 1 col) */}
          <div className="lg:col-span-1 space-y-8">
            {/* AI Final Evaluation */}
            <div className="bg-secondary text-white rounded shadow-lg p-8 sticky top-28 border-b-4 border-primary">
              <div className="flex items-center gap-3 mb-6 border-b border-white/20 pb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-xl font-heading font-bold text-white">Executive Summary</h2>
              </div>
              <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none">
                <ReactMarkdown>{results.final_report}</ReactMarkdown>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
