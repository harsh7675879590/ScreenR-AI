"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InterviewChat() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/session/${sessionId}/current-question`)
      .then((res) => res.json())
      .then((data) => {
        if (data.is_finished) {
          router.push(`/results/${sessionId}`);
        } else {
          setQuestion(data.question);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId, router]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setSubmitting(true);
    const currentQ = question;
    const currentA = answer;
    
    setChatHistory([...chatHistory, { q: currentQ, a: currentA }]);
    setQuestion("Analyzing response and preparing the next phase...");
    setAnswer("");

    try {
      const res = await fetch(`http://localhost:8000/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: currentA }),
      });

      const data = await res.json();
      if (data.is_finished) {
        router.push(`/results/${sessionId}`);
      } else {
        setQuestion(data.question);
      }
    } catch (err) {
      console.error(err);
      setQuestion(currentQ); 
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-secondary font-bold text-lg">Initializing Assessment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-heading font-extrabold text-2xl text-secondary tracking-tight">ScreenR.</span>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded">
                 Session ID: {sessionId}
               </span>
               <button onClick={() => router.push('/')} className="text-sm font-bold text-primary hover:text-red-800 transition-colors">Abort</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex-1 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden flex flex-col">
          
          <div className="bg-secondary p-4 text-white flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-green-400"></div>
             <h2 className="font-heading font-bold text-lg">Live Technical Assessment</h2>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 scroll-smooth">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className="space-y-6">
                {/* Question */}
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold mr-4 shadow">AI</div>
                  <div className="bg-white border border-gray-200 text-gray-800 p-5 rounded-lg rounded-tl-none shadow-sm max-w-[85%]">
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{chat.q}</p>
                  </div>
                </div>
                {/* Answer */}
                <div className="flex justify-end">
                  <div className="bg-primary text-white p-5 rounded-lg rounded-tr-none shadow-md max-w-[85%] border border-red-700">
                    <p className="whitespace-pre-wrap leading-relaxed">{chat.a}</p>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 text-secondary flex items-center justify-center font-bold ml-4 shadow">Me</div>
                </div>
              </div>
            ))}

            {/* Current Question */}
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold mr-4 shadow">AI</div>
              <div className={`bg-white border text-gray-800 p-5 rounded-lg rounded-tl-none shadow-sm max-w-[85%] transition-all ${submitting ? 'border-primary border-l-4 opacity-80' : 'border-gray-200'}`}>
                {submitting ? (
                   <div className="flex items-center gap-3 text-primary font-bold">
                     <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                     <span>{question}</span>
                   </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed font-medium">{question}</p>
                )}
              </div>
            </div>
            
            <div ref={endOfMessagesRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitting}
                className="flex-1 bg-gray-50 border border-gray-300 rounded p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none min-h-[60px] max-h-40"
                placeholder="Type your response... (Press Enter to submit)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={submitting || !answer.trim()}
                className="bg-primary text-white px-8 py-4 rounded font-bold hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-primary transition-all flex items-center shadow-lg"
              >
                Submit Response
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
