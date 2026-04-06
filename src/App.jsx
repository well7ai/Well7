import React, { useState, useEffect } from 'react';
import { 
  Database, Activity, Shield, Users, Play, Zap, LayoutDashboard, 
  Files, Network, BarChart3, UploadCloud, ChevronRight, Settings, 
  CheckCircle2, AlertTriangle, FileJson, Download 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- MOCK BACKEND LOGIC (Simulating Enterprise Features) ---
const LocalSaudiFaker = {
  SAUDI_FIRST_NAMES: ['Ahmad', 'Mohammed', 'Ali', 'Omar', 'Abdullah', 'Faisal', 'Saud', 'Khalid', 'Fatima', 'Noura', 'Sara', 'Reem'],
  SAUDI_LAST_NAMES: ['Al-Saud', 'Al-Rajhi', 'Al-Nasser', 'Al-Dosari', 'Al-Otaibi', 'Al-Qahtani', 'Al-Ghamdi', 'Al-Zahrani'],
  generateName: () => `${LocalSaudiFaker.SAUDI_FIRST_NAMES[Math.floor(Math.random() * 12)]} ${LocalSaudiFaker.SAUDI_LAST_NAMES[Math.floor(Math.random() * 8)]}`,
  generateNationalId: () => {
    let id = (Math.random() > 0.5 ? '1' : '2');
    for (let i=0; i<9; i++) id += Math.floor(Math.random()*10).toString();
    return id;
  },
  generatePhone: () => '05' + Array.from({length:8}, () => Math.floor(Math.random()*10)).join(''),
  generateIban: () => 'SA' + Array.from({length:22}, () => Math.floor(Math.random()*10)).join(''),
  calculateBirthdate: (age) => {
    const dobY = new Date().getFullYear() - parseInt(age);
    const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${dobY}-${m}-${d}`;
  }
};

const processDataset = (csvData) => {
  const lines = csvData.split('\n').filter(l => l.trim().length > 0);
  let headerIdx = 0;
  for (let i=0; i<Math.min(5, lines.length); i++) {
    if (lines[i].split(',').length > 5) { headerIdx = i; break; }
  }
  const headers = lines[headerIdx].split(',').map(h => h.trim());
  const rows = lines.slice(headerIdx + 1).map(l => l.split(',').map(c => c.trim()));
  
  // Auto-PII Detection
  const piiColumns = headers.map(h => {
    const hl = h.toLowerCase();
    if (hl.includes('name') || hl.includes('id') || hl.includes('national') || hl.includes('phone') || hl.includes('iban')) return 'High Risk';
    if (hl.includes('age') || hl.includes('dob') || hl.includes('date')) return 'Medium Risk';
    return 'Safe';
  });

  return { id: `ds-${Math.random().toString(36).substr(2,9)}`, name: 'Uploaded_Dataset.csv', headers, rows, piiColumns, date: new Date().toLocaleDateString() };
};

const synthesizeData = (dataset, modelConfig) => {
  const { headers, rows } = dataset;
  const synthRows = rows.map(row => {
    const newRow = [...row];
    headers.forEach((h, i) => {
      const hl = h.toLowerCase();
      if (hl.includes('name')) newRow[i] = LocalSaudiFaker.generateName();
      else if (hl.includes('id') || hl.includes('national')) newRow[i] = LocalSaudiFaker.generateNationalId();
      else if (hl.includes('phone')) newRow[i] = LocalSaudiFaker.generatePhone();
      else if (hl.includes('iban')) newRow[i] = LocalSaudiFaker.generateIban();
      else if (hl.includes('age') && headers.indexOf('Generated_DOB') !== -1) newRow[headers.indexOf('Generated_DOB')] = LocalSaudiFaker.calculateBirthdate(newRow[i]);
      
      if (!isNaN(parseFloat(row[i])) && !hl.includes('id') && !hl.includes('phone') && !hl.includes('iban')) {
        const val = parseFloat(row[i]);
        const variance = (11 - modelConfig.epsilon) * 0.015 * Math.abs(val) || 10;
        const noise = (Math.random() - 0.5) * variance;
        newRow[i] = (val + noise).toFixed(2);
      }
    });
    return newRow;
  });
  
  return { 
    id: `rep-${Math.random().toString(36).substr(2,9)}`, 
    datasetId: dataset.id,
    datasetName: dataset.name,
    config: modelConfig,
    headers, 
    original: rows, 
    synthetic: synthRows,
    date: new Date().toLocaleDateString(),
    metrics: {
      ksTest: (100 - (10 / modelConfig.epsilon)).toFixed(1),
      dcr: (0.1 + (1 / modelConfig.epsilon) * 0.2).toFixed(2),
      tstr: (98 - (5 / modelConfig.epsilon)).toFixed(1)
    }
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [studioView, setStudioView] = useState('catalog');
  
  // Enterprise State
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([
    { id: 'm-1', name: 'Saudi Foundation Model (TFM)', type: 'Zero-Shot Gen', latency: 'Fast', privacy: 'High' },
    { id: 'm-2', name: 'TabTreeFormer', type: 'High Accuracy Tabular', latency: 'Medium', privacy: 'Medium' },
    { id: 'm-3', name: 'CTAB-GAN-DP', type: 'Strict Compliance', latency: 'Slow', privacy: 'Extreme' }
  ]);
  const [reports, setReports] = useState([]);

  // Catalog State
  const handleDrop = (e) => { e.preventDefault(); readFile(e.dataTransfer.files[0]); };
  const handleFileChange = (e) => { readFile(e.target.files[0]); };
  const readFile = (file) => {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setDatasets([...datasets, processDataset(e.target.result)]);
    reader.readAsText(file);
  };
  const loadFallback = () => {
    const fallback = `Title, Metadata\nAlinma Bank, 2026 Batch\nID,Name,Age,Balance,Phone,IBAN,TransactionDate\n10982312,John Doe,35,12500.50,0501234567,SA1234567890123456789012,2026-04-01\n22981234,Jane Smith,42,8500.00,0559876543,SA9876543210987654321098,2026-04-02`;
    setDatasets([...datasets, processDataset(fallback)]);
  };

  // Studio State
  const [synthConfig, setSynthConfig] = useState({ datasetId: '', modelId: 'm-1', epsilon: 1.0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const startSynthesis = () => {
    if(!synthConfig.datasetId) return alert("Select a dataset first!");
    setIsProcessing(true);
    setTimeout(() => {
      const selectedDs = datasets.find(d => d.id === synthConfig.datasetId);
      const selModel = models.find(m => m.id === synthConfig.modelId);
      const result = synthesizeData(selectedDs, { ...synthConfig, modelName: selModel.name });
      setReports([result, ...reports]);
      setIsProcessing(false);
      setStudioView('reports');
    }, 2000);
  };

  const marketingDemoData = [
    { name: 'Original', utility: 98, privacy: 10 },
    { name: 'Masked', utility: 40, privacy: 50 },
    { name: 'Well7 AI', utility: 95, privacy: 98 },
  ];

  /* -------------------
     LANDING PAGE
  ---------------------*/
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="text-emerald-500 w-8 h-8" />
              <span className="text-2xl font-bold tracking-tight">Well7</span>
            </div>
            <div className="space-x-6 flex items-center">
              <button 
                onClick={() => setActiveTab('studio')}
                className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-full font-semibold transition-colors flex items-center space-x-2"
              >
                <span>Access Data Studio <ChevronRight className="w-4 h-4 inline"/></span>
              </button>
            </div>
          </div>
        </nav>

        <section className="bg-slate-900 text-white py-24 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold mb-6 border border-emerald-500/30">
                Saudi Vision 2030 Aligned
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
                Enterprise data,<br/>synthesized <span className="text-emerald-500">flawlessly.</span>
              </h1>
              <p className="text-xl text-slate-400 mb-8 max-w-lg leading-relaxed">
                The Privacy-Safe Data Layer for Saudi AI. Deploy state-of-the-art foundation models (TFM) to transform sensitive records into reverse-engineering proof synthetic twins.
              </p>
              <button onClick={() => setActiveTab('studio')} className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform shadow-xl shadow-emerald-500/20">
                <LayoutDashboard className="w-5 h-5"/>
                <span>Launch Enterprise Studio</span>
              </button>
            </div>
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative">
              <h3 className="text-xl font-bold mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-emerald-500"/> Tradeoff Analysis</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketingDemoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
                    <Legend />
                    <Line type="monotone" dataKey="utility" stroke="#10b981" strokeWidth={3} name="Utility (KS Test)" />
                    <Line type="monotone" dataKey="privacy" stroke="#3b82f6" strokeWidth={3} name="Privacy (DCR)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem We Solve */}
        <section className="py-24 bg-rose-50/30 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <h2 className="text-4xl font-bold text-slate-900">The Problem: Locked Data</h2>
            </div>
            <p className="text-xl text-slate-600 leading-relaxed text-justify md:text-center">
              Today, organizations are sitting on a goldmine of valuable information, from banking transactions to patient health records. But there’s a catch. Strict privacy laws like the Saudi PDPL and global GDPR make it highly risky to share this real data with the people who need it most: AI developers, internal teams, and external partners.
            </p>
            <div className="mt-8 p-6 bg-white rounded-2xl border border-rose-100 shadow-sm">
               <p className="text-lg text-slate-700 leading-relaxed text-center font-medium">
                 Because of the fear of massive fines and data breaches, companies simply lock their data away in a vault. We call this the <span className="text-rose-600 font-bold">'Locked Data'</span> problem.
               </p>
               <p className="text-lg text-slate-700 leading-relaxed text-center mt-4">
                 When data is locked, innovation stops. Teams can't build smart AI models or test new software because they are starved of real-world information. To make matters worse, the old methods of hiding data, like simply blurring out names or ID numbers just aren't strong enough anymore to stop modern cyber attacks.
               </p>
            </div>
          </div>
        </section>

        {/* Why It's Needed */}
        <section className="py-24 bg-emerald-50/50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <h2 className="text-4xl font-bold text-slate-900">Why Synthetic Data is the Solution</h2>
            </div>
            <p className="text-xl text-slate-600 leading-relaxed text-justify md:text-center">
              Developing advanced AI requires substantial volumes of data. Synthetic data generation offers a mathematical guarantee of privacy while preserving <strong>100% of the statistical utility</strong> found in the original dataset.
            </p>
            <p className="text-xl text-slate-600 leading-relaxed mt-6 text-justify md:text-center">
              This approach is essential to facilitate secure cross-border data sharing, accelerate AI model training, enable safe third-party software testing, and unlock the value of internal datasets. All without exposing any real individual's private information.
            </p>
          </div>
        </section>

        <section className="py-24 max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16">The Core Technology</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="bg-emerald-100 w-16 h-16 flex items-center justify-center rounded-xl mb-6"><Network className="text-emerald-600 w-8 h-8" /></div>
                <h3 className="text-xl font-bold mb-4">Multi-Model Substrate</h3>
                <p className="text-slate-600">Access proprietary models including Saudi TFMs, TabTreeFormer, and CTAB-GAN-DP for specific deployment needs.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="bg-emerald-100 w-16 h-16 flex items-center justify-center rounded-xl mb-6"><Activity className="text-emerald-600 w-8 h-8" /></div>
                <h3 className="text-xl font-bold mb-4">Kolmogorov-Smirnov Utility</h3>
                <p className="text-slate-600">Preserve exact schemas and statistical utility proving Machine Learning Test-on-Synthetic reliability.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="bg-emerald-100 w-16 h-16 flex items-center justify-center rounded-xl mb-6"><Shield className="text-emerald-600 w-8 h-8" /></div>
                <h3 className="text-xl font-bold mb-4">PDPL Compliant DCR</h3>
                <p className="text-slate-600">Mathematical Differential privacy bounding guarantees defense against Linkage Attacks matching Saudi laws.</p>
              </div>
            </div>
        </section>
      </div>
    );
  }

  /* -------------------
     ENTERPRISE STUDIO
  ---------------------*/
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
        <div className="p-6 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="flex items-center space-x-2 text-white">
            <Database className="text-emerald-500 w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">Well7 Studio</span>
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-2">
          {[
            { id: 'catalog', icon: <Files className="w-5 h-5"/>, label: 'Data Catalog' },
            { id: 'synthesis', icon: <Zap className="w-5 h-5"/>, label: 'Synthesis Studio' },
            { id: 'models', icon: <Network className="w-5 h-5"/>, label: 'Model Registry' },
            { id: 'reports', icon: <BarChart3 className="w-5 h-5"/>, label: 'Evaluation Audit' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setStudioView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${studioView === item.id ? 'bg-emerald-500/20 text-emerald-400 font-semibold border-l-4 border-emerald-500' : 'hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800 text-sm">
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span>Queue: Operational</span></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        
        {/* VIEW: Data Catalog */}
        {studioView === 'catalog' && (
          <div className="animate-in fade-in">
            <h2 className="text-3xl font-bold mb-2">Data Catalog</h2>
            <p className="text-slate-500 mb-8">Secure ingestion zone with automated PII detection.</p>
            
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              className="border-dashed border-2 border-slate-300 rounded-xl p-10 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors mb-8 cursor-pointer relative text-center"
            >
              <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv" />
              <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Drag & Drop enterprise datasets here to catalog.</p>
            </div>
            
            {datasets.length === 0 && (
               <div className="text-center p-8 bg-white rounded-xl border border-slate-200">
                 <p className="text-slate-500 mb-4">No datasets cataloged.</p>
                 <button onClick={loadFallback} className="text-emerald-600 font-semibold hover:underline">Load Sample Saudi Dataset</button>
               </div>
            )}

            <div className="space-y-6">
              {datasets.map(ds => (
                <div key={ds.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{ds.name}</h4>
                      <p className="text-xs text-slate-400">ID: {ds.id} • Rows: {ds.rows.length} • Uploaded: {ds.date}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm mb-3 text-slate-600">Automated Schema & PII Inference</h5>
                    <div className="flex flex-wrap gap-2">
                       {ds.headers.map((h, i) => {
                         const risk = ds.piiColumns[i];
                         const badgeClass = risk === 'High Risk' ? 'bg-red-100 text-red-700 border border-red-200' : risk === 'Medium Risk' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200';
                         return (
                           <div key={i} className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium ${badgeClass}`}>
                             <span>{h}</span>
                             {risk !== 'Safe' && <AlertTriangle className="w-3 h-3"/>}
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Synthesis Studio */}
        {studioView === 'synthesis' && (
          <div className="animate-in fade-in">
            <h2 className="text-3xl font-bold mb-2">Synthesis Studio</h2>
            <p className="text-slate-500 mb-8">Configure generative models and apply differential privacy boundaries.</p>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-8 border-r border-slate-200 space-y-6 bg-slate-50/50">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">1. Select Target Dataset</label>
                    <select 
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={synthConfig.datasetId}
                      onChange={e => setSynthConfig({...synthConfig, datasetId: e.target.value})}
                    >
                      <option value="">-- Choose Data Catalog --</option>
                      {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.rows.length} rows)</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">2. Architecture Variant (TFM)</label>
                    <select 
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={synthConfig.modelId}
                      onChange={e => setSynthConfig({...synthConfig, modelId: e.target.value})}
                    >
                      {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.type})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                      <span>3. Differential Privacy (Epsilon ε)</span>
                      <span className="text-emerald-600 bg-emerald-100 px-2 rounded">{synthConfig.epsilon.toFixed(1)}</span>
                    </label>
                    <input 
                      type="range" min="0.1" max="10.0" step="0.1" 
                      value={synthConfig.epsilon}
                      onChange={e => setSynthConfig({...synthConfig, epsilon: parseFloat(e.target.value)})}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-8 flex flex-col justify-center items-center text-center">
                   <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center mb-6 transition-all ${isProcessing ? 'border-amber-500 border-t-amber-200 animate-spin bg-amber-50' : 'border-emerald-500 bg-emerald-50 shadow-inner'}`}>
                     {!isProcessing ? <Zap className="w-12 h-12 text-emerald-500"/> : <Network className="w-12 h-12 text-amber-500 animate-pulse"/>}
                   </div>
                   <h3 className="text-xl font-bold mb-2">{isProcessing ? "Training Foundation Model..." : "Ready to Deploy"}</h3>
                   <p className="text-slate-500 text-sm mb-6 max-w-xs">
                     PDPL regulations mathematically guaranteed up to Epsilon bound {synthConfig.epsilon}.
                   </p>
                   <button 
                     disabled={isProcessing}
                     onClick={startSynthesis} 
                     className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex justify-center items-center space-x-2 transition-all ${isProcessing ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800 hover:scale-105 shadow-slate-900/20'}`}
                   >
                     {isProcessing ? <span>Processing Queue...</span> : <><Play className="w-5 h-5"/> <span>Execute Job Queue</span></>}
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Model Registry */}
        {studioView === 'models' && (
          <div className="animate-in fade-in">
            <h2 className="text-3xl font-bold mb-2">Model Registry</h2>
            <p className="text-slate-500 mb-8">Fleet of Foundation Models available for synthesis drops.</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {models.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4"><Network className="text-emerald-600"/></div>
                  <h4 className="text-lg font-bold text-slate-800">{m.name}</h4>
                  <p className="text-xs font-semibold text-emerald-600 mb-4">{m.type}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between"><span>Compute Latency:</span> <strong>{m.latency}</strong></div>
                    <div className="flex justify-between"><span>Privacy Baseline:</span> <strong>{m.privacy}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Evaluation Audit */}
        {studioView === 'reports' && (
          <div className="animate-in fade-in">
            <h2 className="text-3xl font-bold mb-2">Evaluation Audit</h2>
            <p className="text-slate-500 mb-8">Statistical teardown of generated artifacts (TSTR & DCR).</p>
            
            {reports.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No jobs completed yet in this session.</p>
                <button onClick={() => setStudioView('synthesis')} className="mt-4 text-emerald-600 font-semibold hover:underline">Go to Studio</button>
              </div>
            ) : (
              <div className="space-y-8">
                {reports.map((rep, idx) => {
                  const radarData = [
                    { metric: 'Kolmogorov-Smirnov', A: rep.metrics.ksTest, fullMark: 100 },
                    { metric: 'Test-on-Synthetic (TSTR)', A: rep.metrics.tstr, fullMark: 100 },
                    { metric: 'Privacy Distance (DCR)', A: Math.min(rep.metrics.dcr * 300, 100), fullMark: 100 },
                  ];

                  return(
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                       <div>
                         <h4 className="text-xl font-bold mb-1">Execution Report: {rep.id}</h4>
                         <p className="text-slate-400 text-sm">Base: {rep.datasetName} • Engine: {rep.config.modelName} • ε={rep.config.epsilon}</p>
                       </div>
                       <button onClick={() => {
                          const csvContent = '\uFEFF' + rep.headers.join(',') + '\n' + rep.synthetic.map(r => r.join(',')).join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          const url = URL.createObjectURL(blob);
                          link.setAttribute('href', url);
                          link.setAttribute('download', `Well7_${rep.id}.csv`);
                          link.style.visibility = 'hidden';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                       }} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-bold flex items-center space-x-2 text-sm shadow-lg shadow-emerald-500/20">
                         <Download className="w-4 h-4"/> <span>Download Asset</span>
                       </button>
                    </div>
                    
                    <div className="grid md:grid-cols-3 border-b border-slate-100">
                      <div className="p-6 border-r border-slate-100 text-center">
                        <div className="text-3xl font-black text-emerald-500 mb-1">{rep.metrics.ksTest}%</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">KS Utility Fidelity</div>
                      </div>
                      <div className="p-6 border-r border-slate-100 text-center">
                        <div className="text-3xl font-black text-blue-500 mb-1">{rep.metrics.tstr}%</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">ML Retrain Score (TSTR)</div>
                      </div>
                      <div className="p-6 text-center">
                        <div className="text-3xl font-black text-purple-500 mb-1">{rep.metrics.dcr}x</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nearest Neighbor DCR</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 p-6 gap-8">
                       <div className="h-64">
                         <h5 className="font-bold text-slate-700 text-center mb-4">Multi-Dimensional Efficacy</h5>
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="metric" tick={{fill: '#64748b', fontSize: 12}} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                              <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                              <Tooltip/>
                            </RadarChart>
                          </ResponsiveContainer>
                       </div>
                       <div>
                         <h5 className="font-bold text-slate-700 mb-4">Sample Output Telemetry</h5>
                         <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-500">
                                <tr>{rep.headers.slice(0,4).map((h, i) => <th key={i} className="p-2 border-b">{h}</th>)}</tr>
                              </thead>
                              <tbody>
                                {rep.synthetic.slice(0, 5).map((row, rIdx) => (
                                  <tr key={rIdx} className="border-b last:border-0 hover:bg-slate-50/50">
                                    {row.slice(0,4).map((c, cIdx) => <td key={cIdx} className="p-2">{c}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                         </div>
                       </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
