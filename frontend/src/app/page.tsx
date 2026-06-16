"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Backend Engineer");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let fileToUpload = file;
    if (!fileToUpload) {
      const blob = new Blob(["%PDF-1.5\n%\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 72 712 Td (Mock Resume text content) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000015 00000 n\n0000000074 00000 n\n0000000127 00000 n\n0000000223 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF"], { type: "application/pdf" });
      fileToUpload = new File([blob], "mock_resume.pdf", { type: "application/pdf" });
    }

    const formData = new FormData();
    formData.append("name", name || "Anonymous");
    formData.append("role", role);
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("http://localhost:8000/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload resume.");
      const candidateData = await res.json();

      const startRes = await fetch("http://localhost:8000/api/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateData.id }),
      });

      if (!startRes.ok) throw new Error("Failed to start session.");
      const sessionData = await startRes.json();
      router.push(`/interview/${sessionData.id}`);

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Bar */}
      <div className="bg-secondary text-white py-2 px-8 flex justify-between items-center text-sm hidden md:flex">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 12 Queen Park, LA, USA</span>
          <span className="flex items-center gap-2"><svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> help@screenr.com</span>
        </div>
        <div className="flex gap-4 items-center">
          <span>Mon - Sat: 9.00 to 18.00</span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-heading font-extrabold text-2xl text-secondary tracking-tight">ScreenR.</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-primary font-semibold border-b-2 border-primary py-7">Home</a>
              <a href="#" className="text-gray-600 hover:text-primary font-semibold py-7 transition-colors">About</a>
              <a href="#" className="text-gray-600 hover:text-primary font-semibold py-7 transition-colors">Services</a>
              <a href="#" className="text-gray-600 hover:text-primary font-semibold py-7 transition-colors">Contact</a>
            </nav>
            <div className="hidden md:flex">
              <button className="bg-secondary hover:bg-blue-900 text-white px-6 py-2.5 rounded font-semibold transition-colors">
                Get Started <span className="ml-2 text-primary">→</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-red-50 text-primary font-semibold rounded-full text-sm border border-red-100 uppercase tracking-wide">
              Trusted Corporate Screening
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-secondary leading-tight">
              Secure Your Future <br/>
              With <span className="text-primary">AI Validation.</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
              We provide industry-leading, role-based technical assessments powered by advanced AI and domain-specific knowledge bases to ensure you hire the top 1%.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="font-semibold text-secondary">Expert<br/>Verification</div>
              </div>
              <div className="flex items-center gap-3 ml-6">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div className="font-semibold text-secondary">Fast<br/>Processing</div>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8 border-t-4 border-primary relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <svg className="w-24 h-24 text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
            </div>
            
            <h3 className="text-2xl font-heading font-bold text-secondary mb-2">Begin Assessment</h3>
            <p className="text-gray-500 mb-8 text-sm">Please provide your details and resume to initiate the technical screening session.</p>
            
            {error && (
              <div className="mb-6 p-4 rounded bg-red-50 border-l-4 border-primary text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-bold text-secondary mb-2 uppercase tracking-wide">Candidate Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-secondary mb-2 uppercase tracking-wide">Target Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
                >
                  <option>Backend Engineer</option>
                  <option>AI/ML Engineer</option>
                  <option>Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-secondary mb-2 uppercase tracking-wide">Resume (PDF)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded px-4 py-6 text-center transition-all group-hover:border-primary">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="text-sm text-gray-500 font-medium">
                      {file ? <span className="text-secondary">{file.name}</span> : "Click to select or drag file here"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-red-700 text-white font-bold py-4 px-4 rounded transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-4 shadow-lg shadow-red-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Start Interview <span className="font-normal">→</span></>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
