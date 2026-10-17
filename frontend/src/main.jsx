import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Check, CheckCircle2, ChevronDown, FileText, HelpCircle, LoaderCircle, Search, ShieldCheck, Upload, X } from 'lucide-react';
import DitherVeil from './components/DitherVeil.jsx';
import ElectricBorder from './components/ElectricBorder.jsx';
import ElectricLogo from './components/ElectricLogo.jsx';
import FuzzyText from './components/FuzzyText.jsx';
import LetterGlitch from './components/LetterGlitch.jsx';
import WordsPreloader from './components/WordsPreloader.jsx';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [report, setReport] = useState(null);
  const [references, setReferences] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showPreloader, setShowPreloader] = useState(true);

  async function upload(file) {
    const body = new FormData(); body.append('file', file);
    const response = await fetch(`${API}/api/upload`, { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `Upload failed (${response.status})`);
    return data;
  }

  async function addReport(file) {
    if (!file) return;
    setError(''); setResults(null);
    try { setReport({ file, uploaded: await upload(file) }); }
    catch (e) { setError(e.message); }
  }

  async function addReferences(files) {
    if (!files.length) return;
    setError(''); setResults(null);
    try {
      const uploaded = await Promise.all(files.map(async file => ({ file, uploaded: await upload(file) })));
      setReferences(current => [...current, ...uploaded]);
    } catch (e) { setError(e.message); }
  }

  async function analyze() {
    if (!report || references.length === 0 || busy) return;
    setBusy(true); setError(''); setResults(null); setProgress(0);
    try {
      const start = await fetch(`${API}/api/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: report.uploaded.id, reference_ids: references.map(r => r.uploaded.id) }),
      });
      const started = await start.json();
      if (!start.ok) throw new Error(started.detail || 'Could not start verification.');
      for (let attempt = 0; attempt < 240; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await fetch(`${API}/api/analysis/${started.analysis_id}`);
        const state = await response.json();
        if (!response.ok) throw new Error(state.detail || 'Could not retrieve analysis.');
        setStatus(state.status); setProgress(state.progress || 0);
        if (state.status === 'completed') { setResults(state.claims); break; }
        if (state.status === 'failed') throw new Error(state.error || 'Analysis failed.');
        if (attempt === 239) throw new Error('Analysis timed out. Try again with shorter documents.');
      }
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const counts = (results || []).reduce((all, claim) => ({ ...all, [claim.verdict]: all[claim.verdict] + 1 }), { SUPPORTED: 0, CONTRADICTED: 0, UNVERIFIABLE: 0 });
  const visible = (results || []).filter(claim => filter === 'ALL' || claim.verdict === filter);

  return <><div className="app-shell">
    <div className="ambient-letter-glitch" aria-hidden="true">
      <LetterGlitch
        baseColor="#9b83df"
        glitchColors={["#7558b8", "#ad6dff", "#e8dcff"]}
        fontSize={14}
        density={0.62}
        baseOpacity={0.28}
        glitchAmount={0.38}
        speed={0.4}
        flow={0.3}
        edgeFade={0.12}
        centerFade={0.18}
        interactive
        clickEffect="none"
        intro={false}
      />
    </div>
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><ShieldCheck size={18}/></span><span>VERITY</span><i>Evidence Intelligence</i></a><div className="top-meta"><span className="live-dot"/> DOCUMENT REVIEW <span className="meta-divider"/> PRIVATE SESSION</div></header>
    <main className="layout">
      <section className="hero-composition" aria-label="VERITY claim verification workspace">
        <div className="visual-logo-card">
          <ElectricLogo
            src="/verity-logo.svg"
            color="#ecc7ff"
            glowColor="#ad6dff"
            scale={0.7}
            intensity={0.9}
            glow={1}
            thickness={1.5}
            strands={4}
            bend={0.6}
            crackle={1.2}
            arcs={0.7}
            flicker={0.4}
            fill={0}
            speed={2}
            interactive
            cursorIntensity={0.75}
            cursorRadius={100}
            theme="dark"
          />
          <span className="visual-wordmark">VERITY</span>
        </div>
        <section className="intro"><div className="eyebrow"><span/> CLAIM VERIFICATION WORKSPACE</div><h1 className="visually-hidden">Every claim has a burden of proof.</h1><div className="hero-tech-heading" aria-hidden="true"><div className="hero-tech-line"><FuzzyText className="hero-fuzzy-text" fontSize="clamp(34px, 3.7vw, 52px)" fontWeight={700} letterSpacing={-2} color="#e9e8ed" baseIntensity={0.035} hoverIntensity={0.62} fuzzRange={18} transitionDuration={10} clickEffect intro={false}>Every claim has</FuzzyText></div><div className="hero-tech-line"><FuzzyText className="hero-fuzzy-text" fontSize="clamp(34px, 3.7vw, 52px)" fontWeight={700} letterSpacing={-2} color="#a890ed" baseIntensity={0.035} hoverIntensity={0.62} fuzzRange={18} transitionDuration={10} clickEffect intro={false}>a burden of proof.</FuzzyText></div></div><p>Compare a report against its source documents. Each finding links back to the evidence that supports it.</p><div className="steps"><span className="step-num">01</span> Upload documents <ArrowRight size={13}/><span className="step-num">02</span> Review evidence</div></section>
        <div className="visual-study-card">
          <div className="visual-study-heading"><span>INTERACTIVE IMAGE STUDY</span><span>MOVE TO REVEAL</span></div>
          <div className="visual-study-image">
            <DitherVeil
              src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
              pattern="floyd"
              pixelSize={2}
              inkColor="#120f17"
              paperColor="#f4f1ea"
              revealRadius={120}
              softness={0.6}
              linger={1}
            />
          </div>
        </div>
      </section>
      <section className="work-grid">
        <ElectricBorder
          color="#8061c7"
          glowColor="#694aa5"
          speed={0.55}
          chaos={0.28}
          spread={0.25}
          thickness={0.9}
          strands={2}
          glow={0.2}
          intensity={0.32}
          arcs={0.1}
          flicker={0.24}
          borderRadius={12}
          offset={0}
          intro={false}
          interactive
          theme="dark"
          className="electric-panel-border"
        >
        <aside className="sidebar">
          <div className="section-heading"><span>DOCUMENTS</span><span className="muted">{references.length + (report ? 1 : 0)} ADDED</span></div>
          <UploadCard label="PRIMARY REPORT" hint="The document containing claims" value={report} onChange={files => addReport(files[0])} />
          <UploadCard label="EVIDENCE SOURCES" hint="Reference documents to check against" multiple value={references} onChange={addReferences} />
          {references.length > 0 && <div className="file-list">{references.map((item, i) => <div className="file-row" key={item.uploaded.id}><FileText size={14}/><span title={item.file.name}>{item.file.name}</span><button aria-label={`Remove ${item.file.name}`} onClick={() => setReferences(list => list.filter((_, index) => index !== i))}><X size={14}/></button></div>)}</div>}
          <button className="run-button" disabled={!report || !references.length || busy} onClick={analyze}>{busy ? <><LoaderCircle className="spin" size={16}/> ANALYZING</> : <>RUN VERIFICATION <ArrowRight size={16}/></>}</button>
          <div className="privacy-note"><ShieldCheck size={14}/><span>Files are kept in memory for this session and cleared when the API restarts.</span></div>
          {error && <div className="error-box" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
        </aside>
        </ElectricBorder>

        <ElectricBorder
          color="#8061c7"
          glowColor="#694aa5"
          speed={0.55}
          chaos={0.28}
          spread={0.25}
          thickness={0.9}
          strands={2}
          glow={0.2}
          intensity={0.32}
          arcs={0.1}
          flicker={0.24}
          borderRadius={12}
          offset={0}
          intro={false}
          interactive
          theme="dark"
          className="electric-panel-border"
        >
        <section className="results-panel">
          {!results && !busy && <div className="empty-state"><div className="empty-icon"><Search size={22}/></div><div className="eyebrow">EVIDENCE FIRST</div><h2>Findings will appear here</h2><p>Add a primary report and at least one evidence source to begin. VERITY separates missing evidence from direct contradiction.</p><div className="empty-chips"><span><CheckCircle2 size={13}/> Supported</span><span><AlertCircle size={13}/> Contradicted</span><span><HelpCircle size={13}/> Unverifiable</span></div></div>}
          {busy && <div className="progress-state"><div className="progress-top"><div><div className="eyebrow">ANALYSIS IN PROGRESS</div><h2>{status || 'Preparing documents'}</h2></div><span>{progress}%</span></div><div className="progress-track"><div style={{ width: `${progress}%` }}/></div><p>Claims are checked against your uploaded sources. Keep this tab open.</p><div className="skeletons"><i/><i/><i/></div></div>}
          {results && <div className="results-content"><div className="results-heading"><div><div className="eyebrow">ANALYSIS COMPLETE</div><h2>Evidence review</h2><p>{results.length} factual claims extracted from {report.file.name}</p></div><span className="source-count"><FileText size={14}/>{references.length} SOURCES</span></div>
            <div className="summary-cards"><Summary label="SUPPORTED" value={counts.SUPPORTED} kind="supported"/><Summary label="CONTRADICTED" value={counts.CONTRADICTED} kind="contradicted"/><Summary label="UNVERIFIABLE" value={counts.UNVERIFIABLE} kind="unverifiable"/></div>
            <div className="filter-bar"><span>CLAIM FINDINGS <b>{visible.length}</b></span><label><span>FILTER</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">All findings</option><option value="SUPPORTED">Supported</option><option value="CONTRADICTED">Contradicted</option><option value="UNVERIFIABLE">Unverifiable</option></select><ChevronDown size={13}/></label></div>
            <div className="claim-list">{visible.map(claim => <ClaimCard key={claim.id} claim={claim}/>)}</div>
            <p className="disclaimer">AI findings can be wrong. Confirm important claims against the cited source documents.</p>
          </div>}
        </section>
        </ElectricBorder>
      </section>
    </main>
    <footer><span>VERITY <b>·</b> EVIDENCE INTELLIGENCE</span><span>TRACEABLE FINDINGS, SOURCE BY SOURCE</span></footer>
  </div>{showPreloader && <WordsPreloader onComplete={() => setShowPreloader(false)} />}</>;
}

function UploadCard({ label, hint, multiple = false, value, onChange }) {
  const [drag, setDrag] = useState(false);
  const files = multiple ? value : value ? [value] : [];
  return <div className="upload-block"><div className="upload-label">{label}</div><label className={`upload-zone ${drag ? 'dragging' : ''} ${files.length ? 'has-file' : ''}`} onDragOver={e => {e.preventDefault(); setDrag(true)}} onDragLeave={() => setDrag(false)} onDrop={e => {e.preventDefault(); setDrag(false); onChange(Array.from(e.dataTransfer.files))}}>
    <input type="file" accept=".txt,.md,.markdown,.csv,.pdf,.docx" multiple={multiple} onChange={e => {onChange(Array.from(e.target.files || [])); e.target.value = ''}}/>
    {files.length ? <><span className="upload-icon success"><Check size={17}/></span><strong>{multiple ? `${files.length} sources added` : files[0].file.name}</strong><small>{multiple ? 'Add more evidence documents' : 'Click to replace report'}</small></> : <><span className="upload-icon"><Upload size={17}/></span><strong>Drop files or <u>browse</u></strong><small>{hint} · PDF, DOCX, TXT, MD</small></>}
  </label></div>;
}

function Summary({ label, value, kind }) { return <div className={`summary ${kind}`}><span>{label}</span><strong>{value}</strong></div>; }

function ClaimCard({ claim }) {
  const [open, setOpen] = useState(false);
  const icon = claim.verdict === 'SUPPORTED' ? <CheckCircle2/> : claim.verdict === 'CONTRADICTED' ? <AlertCircle/> : <HelpCircle/>;
  return <article className={`claim-card ${claim.verdict.toLowerCase()}`}><button className="claim-toggle" onClick={() => setOpen(!open)} aria-expanded={open}><span className="verdict-icon">{icon}</span><span className="claim-main"><span className="claim-text">{claim.text}</span><span className="claim-meta"><b>{claim.verdict}</b>{claim.source_doc && <span><FileText size={12}/>{claim.source_doc}{claim.page ? ` · PAGE ${claim.page}` : ''}</span>}</span></span><ChevronDown className={`claim-chevron ${open ? 'open' : ''}`} size={16}/></button>
    <AnimatePresence>{open && <motion.div className="claim-detail" initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}}><div className="detail-inner">{claim.evidence_quote && <div><div className="detail-label">SOURCE EVIDENCE</div><blockquote>“{claim.evidence_quote}”</blockquote></div>}<div><div className="detail-label">REASONING</div><p>{claim.explanation}</p></div></div></motion.div>}</AnimatePresence>
    </article>;
}

createRoot(document.getElementById('root')).render(<App/>);
