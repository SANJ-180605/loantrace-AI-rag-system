import React, { useState } from 'react';
import { 
  FileText, Upload, Cpu, Database, ShieldCheck, HelpCircle, 
  AlertTriangle, CheckCircle, Search, Layers, RefreshCw, Eye, ArrowRight,
  Filter, CheckSquare, Zap, FileSpreadsheet, Lock
} from 'lucide-react';

export default function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState("Confirm the one loan amount that should be identical across URLA 1003, Form 1008, Closing Disclosure, and Loan Estimate.");
  const [asking, setAsking] = useState(false);
  const [answerData, setAnswerData] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageText, setPageText] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "layer1", "layer2", "layer3", "layer4", "layer5", "layer6"

  const sampleQuestions = [
    "Confirm the one loan amount that should be identical across URLA 1003, Form 1008, Closing Disclosure, and Loan Estimate.",
    "Do the W-2 box 1 wages reconcile with the wages on the Form 1040?",
    "What is the borrower's stated monthly income?",
    "What is the property address?",
    "How many paystubs are included in this file?",
    "What is the down payment, that is, purchase price minus loan amount?"
  ];

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    await processPdf(uploadedFile);
  };

  const processPdf = async (fileToUpload) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const data = await res.json();
      setFile(fileToUpload);
      setSession(data);
    } catch (err) {
      alert(`Error processing PDF: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (qText) => {
    const targetQ = qText || question;
    if (!session) {
      alert("Please upload a mortgage PDF first.");
      return;
    }

    setAsking(true);
    try {
      const res = await fetch("http://localhost:8000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          question: targetQ,
          top_k: 5
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Query failed");
      }

      const data = await res.json();
      setAnswerData(data);
    } catch (err) {
      alert(`Query failed: ${err.message}`);
    } finally {
      setAsking(false);
    }
  };

  const fetchPageText = async (pageNum) => {
    if (!session) return;
    try {
      const res = await fetch(`http://localhost:8000/api/session/${session.session_id}/page/${pageNum}`);
      const data = await res.json();
      setSelectedPage(pageNum);
      setPageText(data.text);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <div className="text-xl font-extrabold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              LoanTrace AI
            </div>
            <div className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
              6-Layer Audit Pipeline • Underwriting Intelligence
            </div>
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <FileText size={14} /> {session.filename} ({session.total_pages} pages)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Session: {session.session_id.slice(0, 8)}...
            </span>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Layers size={15} /> Dynamic Full Pipeline Dashboard
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {[
          { id: "layer1", label: "Layer 1: PDF Ingestion", icon: Upload },
          { id: "layer2", label: "Layer 2: DSL Classifier", icon: Layers },
          { id: "layer3", label: "Layer 3: Vector Chunker", icon: Database },
          { id: "layer4", label: "Layer 4: Reasoning Router", icon: Cpu },
          { id: "layer5", label: "Layer 5: Trust Matrix (MCM)", icon: ShieldCheck },
          { id: "layer6", label: "Layer 6: Underwriter Output", icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-6 flex flex-col gap-6 flex-1">
        {/* Pipeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { step: "Layer 1", title: "PDF Ingestion", status: session ? "Completed" : "Ready" },
            { step: "Layer 2", title: "DSL Classifier", status: session ? `${session.total_pages} Pages` : "Pending" },
            { step: "Layer 3", title: "BGE + FAISS", status: session ? `${session.total_chunks} Chunks` : "Pending" },
            { step: "Layer 4", title: "Reasoning Router", status: answerData ? answerData.route : "Standing by" },
            { step: "Layer 5", title: "Trust Layer", status: answerData ? `${answerData.confidence}% Conf.` : "Pending" },
            { step: "Layer 6", title: "Answer & Citations", status: answerData ? "Verified" : "Pending" },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                session
                  ? "bg-slate-900/80 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                  : "bg-slate-900/40 border-slate-800"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.step}</span>
                <div className="text-xs font-bold text-slate-200">{s.title}</div>
              </div>
              <span className="text-[11px] font-semibold text-cyan-400 mt-2">{s.status}</span>
            </div>
          ))}
        </div>

        {/* Upload Control Banner */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2">
              <Upload size={18} />
              {uploading ? "Processing PDF Pipeline..." : "Upload Loan Package PDF"}
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            </label>
            <span className="text-xs text-slate-400">
              Supports multi-page loan packages (URLA 1003, LE, CD, W-2, 1040, Paystubs)
            </span>
          </div>

          {session && (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              Active Session ID: {session.session_id}
            </div>
          )}
        </div>

        {/* DASHBOARD VIEW (ALL LAYERS COMBINED) */}
        {(activeTab === "dashboard" || activeTab === "layer4" || activeTab === "layer6") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Underwriting Query & Reasoning */}
            <div className="flex flex-col gap-6">
              {/* Layer 4: Reasoning Layer Input */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                    <Cpu size={20} className="text-cyan-400" />
                    Layer 4: Reasoning & Question Router
                  </div>
                  {answerData && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {answerData.route}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask an underwriter question..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <Search size={18} className="absolute left-3 top-3.5 text-slate-500" />
                  </div>

                  <button
                    onClick={() => handleAsk()}
                    disabled={asking || !session}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {asking ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
                    Run Underwriter Query
                  </button>

                  <div className="mt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Sample Underwriting Prompts:</div>
                    <div className="flex flex-col gap-1.5">
                      {sampleQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuestion(q);
                            handleAsk(q);
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition flex items-center gap-2"
                        >
                          <HelpCircle size={14} className="text-indigo-400 flex-shrink-0" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Layer 6: Answer & Evidence Output */}
              {answerData && (
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                      <CheckCircle size={20} className="text-emerald-400" />
                      Layer 6: Underwriter Answer & Evidence
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Confidence: {answerData.confidence}%
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                        Verified Response:
                      </div>
                      <div className="text-sm font-medium text-slate-100 leading-relaxed">
                        {answerData.answer}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-300 mb-2">Source Page Citations:</div>
                      <div className="flex gap-2 flex-wrap">
                        {answerData.source_pages.map((pNum) => (
                          <button
                            key={pNum}
                            onClick={() => fetchPageText(pNum)}
                            className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/20 transition flex items-center gap-1.5"
                          >
                            <Eye size={13} /> Page {pNum}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Trust Layer & Document Lattice */}
            <div className="flex flex-col gap-6">
              {/* Layer 5: Metadata Covariance Matrix */}
              {session && session.covariance_matrix && (
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                      <ShieldCheck size={20} className="text-indigo-400" />
                      Layer 5: Trust Layer & Metadata Matrix (MCM)
                    </div>
                    {session.covariance_matrix.is_verified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Verified Consistent
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {session.covariance_matrix.total_conflicts} Conflict(s)
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase">
                          <th className="py-2 px-3">Field</th>
                          {session.covariance_matrix.doc_types.map((dt) => (
                            <th key={dt} className="py-2 px-3">{dt}</th>
                          ))}
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {session.covariance_matrix.matrix.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-semibold text-slate-200">{row.field}</td>
                            {session.covariance_matrix.doc_types.map((dt) => {
                              const cell = row.values[dt];
                              return (
                                <td key={dt} className="py-2.5 px-3 font-mono text-cyan-400">
                                  {cell ? (typeof cell.value === 'number' ? `$${cell.value.toLocaleString()}` : cell.value) : '—'}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-3">
                              {row.has_conflict ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">Conflict</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Match</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Layer 2: Document Structure Lattice */}
              {session && session.lattice && (
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                      <Layers size={20} className="text-purple-400" />
                      Layer 2: Document Structure Lattice (DSL)
                    </div>
                    <span className="text-xs font-semibold text-cyan-400">
                      {session.lattice.total_documents} Documents Detected
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {session.lattice.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200">{doc.name}</div>
                          <div className="text-[11px] text-slate-400">Pages {doc.start_page} - {doc.end_page} ({doc.page_count} page(s))</div>
                        </div>
                        <button
                          onClick={() => fetchPageText(doc.start_page)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                        >
                          View Page {doc.start_page}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LAYER 1 BREAKDOWN VIEW */}
        {activeTab === "layer1" && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Upload size={24} className="text-cyan-400" />
              <div>
                <h2 className="text-lg font-bold text-slate-100">Layer 1: PDF Document Ingestion & Extraction</h2>
                <p className="text-xs text-slate-400">Extracts multi-page loan packages with native text parser & OCR fallback.</p>
              </div>
            </div>

            {session ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">File Name</div>
                  <div className="text-sm font-bold text-slate-100">{session.filename}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Total Pages Parsed</div>
                  <div className="text-sm font-bold text-cyan-400">{session.total_pages} Pages</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">OCR Status</div>
                  <div className="text-sm font-bold text-emerald-400">Text Extracted (OCR Standby)</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">No PDF uploaded yet. Upload a loan file above to view Layer 1 parsing metrics.</div>
            )}
          </div>
        )}

        {/* LAYER 3 BREAKDOWN VIEW */}
        {activeTab === "layer3" && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Database size={24} className="text-indigo-400" />
              <div>
                <h2 className="text-lg font-bold text-slate-100">Layer 3: Sliding-Window Vector Chunker & FAISS Index</h2>
                <p className="text-xs text-slate-400">Splits document pages into 500-word sliding windows with page-level audit tracking.</p>
              </div>
            </div>

            {session ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Total Chunks Created</div>
                  <div className="text-sm font-bold text-indigo-400">{session.total_chunks} Chunks</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Embedding Dimensions</div>
                  <div className="text-sm font-bold text-cyan-400">384-dim (all-MiniLM-L6-v2)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Vector DB Status</div>
                  <div className="text-sm font-bold text-emerald-400">FAISS Index Active</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">No PDF uploaded yet. Upload a loan file to view vector chunking metrics.</div>
            )}
          </div>
        )}

        {/* LAYER 5 BREAKDOWN VIEW */}
        {activeTab === "layer5" && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <ShieldCheck size={24} className="text-emerald-400" />
              <div>
                <h2 className="text-lg font-bold text-slate-100">Layer 5: Trust Layer & Metadata Covariance Matrix</h2>
                <p className="text-xs text-slate-400">Cross-checks extracted financial fields across all loan forms to identify inconsistencies.</p>
              </div>
            </div>

            {session && session.covariance_matrix ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Tracked Loan Field</th>
                      {session.covariance_matrix.doc_types.map((dt) => (
                        <th key={dt} className="py-2.5 px-3">{dt}</th>
                      ))}
                      <th className="py-2.5 px-3">Reconciliation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {session.covariance_matrix.matrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-200">{row.field}</td>
                        {session.covariance_matrix.doc_types.map((dt) => {
                          const cell = row.values[dt];
                          return (
                            <td key={dt} className="py-3 px-3 font-mono text-cyan-400">
                              {cell ? (typeof cell.value === 'number' ? `$${cell.value.toLocaleString()}` : cell.value) : '—'}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3">
                          {row.has_conflict ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">Conflict Detected</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Verified Match</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">No active session available. Upload a loan file to view the Trust Layer matrix.</div>
            )}
          </div>
        )}
      </main>

      {/* Page Text Viewer Drawer Modal */}
      {selectedPage !== null && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="max-w-3xl w-full max-h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <FileText size={18} className="text-cyan-400" />
                Page {selectedPage} Extracted Text Viewer
              </div>
              <button
                onClick={() => setSelectedPage(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-950/50">
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {pageText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
