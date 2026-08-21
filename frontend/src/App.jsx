import React, { useState } from 'react';
import { 
  FileText, Upload, Cpu, Database, ShieldCheck, HelpCircle, 
  AlertTriangle, CheckCircle, Search, Layers, RefreshCw, Eye, ArrowRight
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
  const [activeTab, setActiveTab] = useState("dashboard");

  // Quick preset underwriting questions
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
      const res = await fetch("http://localhost:8001/upload", {
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
      const res = await fetch("http://localhost:8001/ask", {
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
      const res = await fetch(`http://localhost:8001/session/${session.session_id}/page/${pageNum}`);
      const data = await res.json();
      setSelectedPage(pageNum);
      setPageText(data.text);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <div className="logo-badge">
          <div className="logo-icon">
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div className="logo-title">LoanTrace AI</div>
            <div className="logo-subtitle">6-Layer Audit Pipeline • Underwriting Intelligence</div>
          </div>
        </div>

        {session && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="badge badge-cyan">
              <FileText size={14} /> {session.filename} ({session.total_pages} pages)
            </span>
            <span className="badge badge-emerald">
              Session: {session.session_id.slice(0, 8)}...
            </span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="main-container">
        {/* Pipeline Stepper */}
        <div className="pipeline-bar">
          <div className={`pipeline-step ${session ? 'completed' : 'active'}`}>
            <span className="step-num">Layer 1</span>
            <span className="step-title">PDF Upload</span>
            <span className="step-badge">{session ? "Completed" : "Ready"}</span>
          </div>
          <div className={`pipeline-step ${session ? 'completed' : ''}`}>
            <span className="step-num">Layer 2</span>
            <span className="step-title">Extraction & OCR</span>
            <span className="step-badge">{session ? `${session.total_pages} Pages` : "Pending"}</span>
          </div>
          <div className={`pipeline-step ${session ? 'completed' : ''}`}>
            <span className="step-num">Layer 3</span>
            <span className="step-title">BGE + FAISS</span>
            <span className="step-badge">{session ? `${session.total_chunks} Chunks` : "Pending"}</span>
          </div>
          <div className={`pipeline-step ${answerData ? 'completed' : ''}`}>
            <span className="step-num">Layer 4</span>
            <span className="step-title">Reasoning Layer</span>
            <span className="step-badge">{answerData ? answerData.route : "Standing by"}</span>
          </div>
          <div className={`pipeline-step ${answerData ? 'completed' : ''}`}>
            <span className="step-num">Layer 5</span>
            <span className="step-title">Trust Layer</span>
            <span className="step-badge">{answerData ? `${answerData.confidence}% Conf.` : "Pending"}</span>
          </div>
          <div className={`pipeline-step ${answerData ? 'completed' : ''}`}>
            <span className="step-num">Layer 6</span>
            <span className="step-title">Answer & Evidence</span>
            <span className="step-badge">{answerData ? "Verified" : "Pending"}</span>
          </div>
        </div>

        {/* Top Control Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="btn-primary" style={{ cursor: 'pointer' }}>
                <Upload size={18} />
                {uploading ? "Processing PDF Pipeline..." : "Upload Loan Package PDF"}
                <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Accepts 100–2,000 page mortgage loan bundles (URLA 1003, LE, CD, W-2, 1040, Paystubs)
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column: Underwriting Query & Reasoning */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Layer 4: Reasoning Layer Input */}
            <div className="glass-panel">
              <div className="card-header">
                <div className="card-title">
                  <Cpu size={20} color="var(--accent-cyan)" />
                  Layer 4: Reasoning & Question Router
                </div>
                {answerData && (
                  <span className="badge badge-cyan">{answerData.route}</span>
                )}
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask an underwriter question (e.g. Confirm loan amount match across documents...)"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 2.5rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                  <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-primary"
                    onClick={() => handleAsk()} 
                    disabled={asking || !session}
                  >
                    {asking ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
                    Run Underwriter Query
                  </button>
                </div>

                {/* Preset sample prompt buttons */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    SAMPLE UNDERWRITING AUDIT QUESTIONS:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {sampleQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        className="btn-secondary"
                        style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                        onClick={() => {
                          setQuestion(q);
                          handleAsk(q);
                        }}
                      >
                        <HelpCircle size={14} color="var(--accent-indigo)" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 6: Answer & Evidence Output */}
            {answerData && (
              <div className="glass-panel" style={{ borderColor: answerData.confidence >= 80 ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)' }}>
                <div className="card-header">
                  <div className="card-title">
                    <CheckCircle size={20} color="var(--accent-emerald)" />
                    Layer 6: Underwriter Answer & Evidence
                  </div>
                  <span className={`badge ${answerData.confidence >= 80 ? 'badge-emerald' : 'badge-amber'}`}>
                    Confidence: {answerData.confidence}%
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Confidence meter */}
                  <div className="confidence-meter">
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Retrieval Confidence</span>
                    <div className="meter-bar">
                      <div className="meter-fill" style={{ width: `${answerData.confidence}%` }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{answerData.confidence}%</span>
                  </div>

                  {/* Generated Answer Text */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Verified Underwriter Response:
                    </div>
                    <div style={{ fontSize: '1rem', lineHeight: '1.6', color: '#ffffff', fontWeight: 500 }}>
                      {answerData.answer}
                    </div>
                  </div>

                  {/* Cited Source Pages */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Traceable Source Citations:
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {answerData.source_pages.map((pNum) => (
                        <button
                          key={pNum}
                          className="btn-secondary"
                          onClick={() => fetchPageText(pNum)}
                          style={{ borderColor: 'var(--accent-cyan)' }}
                        >
                          <Eye size={14} color="var(--accent-cyan)" /> Page {pNum}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Snippets */}
                  {answerData.evidence && answerData.evidence.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Retrieved Vector Evidence:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {answerData.evidence.map((ev, i) => (
                          <div key={i} className="evidence-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
                              <span>Page {ev.page}</span>
                              {ev.distance !== undefined && <span>Dist: {ev.distance.toFixed(4)}</span>}
                            </div>
                            <div>{ev.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Trust Layer & Document Lattice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Layer 5: Trust Layer & Cross-Doc Verification Matrix */}
            {session && session.covariance_matrix && (
              <div className="glass-panel">
                <div className="card-header">
                  <div className="card-title">
                    <ShieldCheck size={20} color="var(--accent-indigo)" />
                    Layer 5: Trust Layer & Cross-Document Matrix (MCM)
                  </div>
                  {session.covariance_matrix.is_verified ? (
                    <span className="badge badge-emerald">Verified Consistent</span>
                  ) : (
                    <span className="badge badge-amber">
                      <AlertTriangle size={12} /> {session.covariance_matrix.total_conflicts} Conflict(s)
                    </span>
                  )}
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Conflict Alert Banner */}
                  {!session.covariance_matrix.is_verified && session.covariance_matrix.conflicts.map((conf, idx) => (
                    <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-amber)', padding: '0.85rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <AlertTriangle size={16} /> ⚠ Cross-Document Conflict Detected: Field '{conf.field}'
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        {conf.values.map((v, i) => (
                          <div key={i}>
                            • Value: <strong>{v.value}</strong> in {v.sources.join(", ")} (Pages {v.pages.join(", ")})
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Metadata Covariance Matrix Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Loan Field</th>
                          {session.covariance_matrix.doc_types.map((dt) => (
                            <th key={dt}>{dt}</th>
                          ))}
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.covariance_matrix.matrix.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.field}</td>
                            {session.covariance_matrix.doc_types.map((dt) => {
                              const cell = row.values[dt];
                              return (
                                <td key={dt}>
                                  {cell ? (
                                    <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                                      {typeof cell.value === 'number' ? `$${cell.value.toLocaleString()}` : cell.value}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td>
                              {row.has_conflict ? (
                                <span className="badge badge-amber">Conflict</span>
                              ) : (
                                <span className="badge badge-emerald">Match</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Layer 2: Document Structure Lattice */}
            {session && session.lattice && (
              <div className="glass-panel">
                <div className="card-header">
                  <div className="card-title">
                    <Layers size={20} color="var(--accent-purple)" />
                    Layer 2: Document Structure Lattice (DSL)
                  </div>
                  <span className="badge badge-cyan">{session.lattice.total_documents} Documents Detected</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {session.lattice.documents.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pages {doc.start_page} - {doc.end_page} ({doc.page_count} page(s))</div>
                        </div>
                        <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => fetchPageText(doc.start_page)}>
                          View Page {doc.start_page}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Page Text Viewer Drawer Modal */}
      {selectedPage !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <div className="card-title">
                <FileText size={20} color="var(--accent-cyan)" />
                Page {selectedPage} Extracted Plain Text
              </div>
              <button className="btn-secondary" onClick={() => setSelectedPage(null)}>Close</button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto', flex: 1 }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {pageText}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
