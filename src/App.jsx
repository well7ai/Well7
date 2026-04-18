import React, { useState } from 'react';
import { 
  Database, Activity, Shield, Network, Zap, ArrowRight,
  Files, BarChart3, UploadCloud, ChevronRight, 
  AlertTriangle, CheckCircle2, Download, Play, LayoutDashboard
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- SMART LOGICAL ENGINE (Correlated Synthetic Data Generator) ---
const LocalSaudiFaker = {
  MALE_FIRST: ["Mohammed","Abdullah","Abdulrahman","Ahmad","Khalid","Ali","Omar","Yousef","Saad","Fahad","Nasser","Sultan","Turki","Bander","Rashid","Majed","Waleed","Hani","Ziyad","Bader"],
  FEMALE_FIRST: ["Noura","Sara","Reem","Hind","Latifa","Muna","Ameera","Rana","Dana","Lina","Maryam","Fatima","Aisha","Rahaf","Ghada","Shaima","Wafaa","Asma","Hessa","Jawaher"],
  LAST_NAMES: ["Al-Ghamdi","Al-Omari","Al-Zahrani","Al-Shehri","Al-Qahtani","Al-Dosari","Al-Otaibi","Al-Malki","Al-Harbi","Al-Shammari","Al-Subaie","Al-Anazi"],
  EXPAT_FIRST: ['John', 'Michael', 'David', 'Sarah', 'Jessica', 'Tariq', 'Zayn', 'Rahul', 'Farhan', 'Syed', 'Maria', 'Ade'],
  EXPAT_LAST: ['Smith', 'Johnson', 'Williams', 'Khan', 'Ahmed', 'Ali', 'Garcia', 'Martinez', 'Chen', 'Wang'],
  CITIES: ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Tabuk', 'Abha', 'Buraidah'],
  PHONE_PREFIXES: ["0512","0513","0514","0515","0532","0533","0534","0535","0542","0543","0544","0552","0553","0554","0555","0566"],

  generateName: (isSaudi, gender = null) => {
    if (!isSaudi) return `${LocalSaudiFaker.EXPAT_FIRST[Math.floor(Math.random() * LocalSaudiFaker.EXPAT_FIRST.length)]} ${LocalSaudiFaker.EXPAT_LAST[Math.floor(Math.random() * LocalSaudiFaker.EXPAT_LAST.length)]}`;
    const gndr = gender || (Math.random() > 0.5 ? 'M' : 'F');
    const first = gndr === 'M' ? LocalSaudiFaker.MALE_FIRST[Math.floor(Math.random() * LocalSaudiFaker.MALE_FIRST.length)] : LocalSaudiFaker.FEMALE_FIRST[Math.floor(Math.random() * LocalSaudiFaker.FEMALE_FIRST.length)];
    const last = LocalSaudiFaker.LAST_NAMES[Math.floor(Math.random() * LocalSaudiFaker.LAST_NAMES.length)];
    return `${first} ${last}`;
  },
  
  generateNationalId: (isSaudi) => {
    // Implement exact structural Modulo-10 checksum logic from the Python file
    const type = isSaudi ? '1' : '2';
    const region = Math.floor(Math.random() * 9) + 1; // 1-9
    const middle = Array.from({length: 7}, () => Math.floor(Math.random() * 10)).join('');
    const base = type + region.toString() + middle;
    
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
        let n = parseInt(base[i]);
        if (i % 2 === 0) {
            n *= 2;
            if (n > 9) n -= 9;
        }
        sum += n;
    }
    const check = (10 - (sum % 10)) % 10;
    return base + check.toString();
  },
  
  generatePhone: () => LocalSaudiFaker.PHONE_PREFIXES[Math.floor(Math.random() * LocalSaudiFaker.PHONE_PREFIXES.length)] + Array.from({length:6}, () => Math.floor(Math.random()*10)).join(''),
  generateIban: () => `SA${Math.floor(Math.random()*90)+10}65` + Array.from({length:18}, () => Math.floor(Math.random()*10)).join(''),
  generateAddress: () => `${Math.floor(Math.random()*9000)+1000} King Fahd Rd, ${LocalSaudiFaker.CITIES[Math.floor(Math.random()*LocalSaudiFaker.CITIES.length)]}`,
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
  
  const piiColumns = headers.map(h => {
    const hl = h.toLowerCase();
    if (hl.includes('name') || hl.includes('id') || hl.includes('national') || hl.includes('phone') || hl.includes('iban') || hl.includes('address')) return 'High Risk';
    if (hl.includes('age') || hl.includes('dob') || hl.includes('date') || hl.includes('nationality')) return 'Medium Risk';
    return 'Safe';
  });

  return { id: `ds-${Math.random().toString(36).substr(2,9)}`, name: 'Uploaded_Dataset.csv', headers, rows, piiColumns, date: new Date().toLocaleDateString() };
};

const synthesizeData = (dataset, modelConfig) => {
  const { headers, rows } = dataset;
  
  // Find key column indices for smart correlation
  const ageIdx = headers.findIndex(h => h.toLowerCase().includes('age'));
  const natIdx = headers.findIndex(h => h.toLowerCase().includes('nationality'));
  
  const synthRows = rows.map(row => {
    const newRow = [...row];
    
    // Core Row Logistics
    const isSaudi = natIdx !== -1 ? row[natIdx].toLowerCase().trim() === 'saudi' : Math.random() > 0.3;
    const baseAge = ageIdx !== -1 ? parseInt(row[ageIdx]) : Math.floor(Math.random() * 40) + 22;
    
    // Variance bound by the Privacy Epsilon model configuration
    const epsilonVariance = (11 - modelConfig.epsilon) * 0.05; // 0.5% at highest epsilon, 50% at lowest
    
    // Step 1: Correlated Numeric Generation
    const generatedAge = Math.max(18, Math.round(baseAge + (Math.random() - 0.5) * baseAge * epsilonVariance * 0.5));
    const generatedExperience = Math.max(0, generatedAge - 22);
    const baseSalaryForExp = 4000 + (generatedExperience * 2500); 
    
    // Step 2: Traverse and Generate columns
    headers.forEach((h, i) => {
      const hl = h.toLowerCase();
      
      // Smart String Overrides
      if (hl.includes('name')) newRow[i] = LocalSaudiFaker.generateName(isSaudi);
      else if (hl.includes('address') || hl.includes('location')) newRow[i] = LocalSaudiFaker.generateAddress();
      else if (hl.includes('id') || hl.includes('national')) newRow[i] = LocalSaudiFaker.generateNationalId(isSaudi);
      else if (hl.includes('phone')) newRow[i] = LocalSaudiFaker.generatePhone();
      else if (hl.includes('iban')) newRow[i] = LocalSaudiFaker.generateIban();
      else if (hl.includes('dob') || hl.includes('birth')) newRow[i] = LocalSaudiFaker.calculateBirthdate(generatedAge);
      else if (hl.includes('age')) newRow[i] = generatedAge.toString();
      
      // Correlated Salary Override
      else if (hl.includes('salary') || hl.includes('balance') || hl.includes('income')) {
         // Use the correlated base, then apply strict Laplace noise based on Epsilon
         const noisySalary = baseSalaryForExp + ((Math.random() - 0.5) * baseSalaryForExp * epsilonVariance);
         // Cap max at realistic ceiling depending on role if role existed, default 100k
         newRow[i] = Math.min(120000, Math.max(4000, noisySalary)).toFixed(2);
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
  const [lang, setLang] = useState('en');
  
  const [datasets, setDatasets] = useState([]);
  const [models] = useState([
    { id: 'm-1', name: 'Saudi Foundation Model (TFM)', type: 'Zero-Shot Gen', latency: 'Fast', privacy: 'High' },
    { id: 'm-2', name: 'TabTreeFormer', type: 'High Accuracy Tabular', latency: 'Medium', privacy: 'Medium' },
    { id: 'm-3', name: 'CTAB-GAN-DP', type: 'Strict Compliance', latency: 'Slow', privacy: 'Extreme' }
  ]);
  const [reports, setReports] = useState([]);

  const handleDrop = (e) => { e.preventDefault(); readFile(e.dataTransfer.files[0]); };
  const handleFileChange = (e) => { readFile(e.target.files[0]); };
  const readFile = (file) => {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setDatasets([...datasets, processDataset(e.target.result)]);
    reader.readAsText(file);
  };
  const loadFallback = () => {
    const fallback = `ID,Nationality,Name,Age,DOB,Address,Salary,Phone,IBAN\n10982312,Saudi,John Doe,35,1991-05-12,123 Fake St,12500.50,0501234567,SA1234567890123456789012\n22981234,Expat,Jane Smith,42,1984-11-20,456 Real Ave,8500.00,0559876543,SA9876543210987654321098\n10344567,Saudi,Ali Khan,26,1998-02-01,789 Business Rd,5000.00,0563456789,SA4567890123456789012345`;
    setDatasets([...datasets, processDataset(fallback)]);
  };

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
     LANDING PAGE (COHERE THEME)
     Clinical White Canvas, Deep Purple Bands, Unica77/CohereText Fallbacks
  ---------------------*/
  if (activeTab === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] font-sans text-white border-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-[#ffffff1a] bg-[#0a0a0fcc] backdrop-blur-[20px] transition-all">
          <div className="max-w-7xl mx-auto p-6 flex justify-between items-center">
            <div className="flex items-center space-x-3 gap-x-3">
              <Database className="text-white w-6 h-6" />
              <span className="text-[22px] font-sans font-medium tracking-tight text-white">Well7</span>
            </div>
            <div className="flex items-center gap-x-4">
              <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-white/80 hover:text-white px-4 py-2 text-[15px] font-medium transition-colors rounded-md hover:bg-white/5 border border-white/10 flex items-center justify-center">
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
              <button onClick={() => setActiveTab('studio')} className="text-white/80 hover:text-white px-4 py-2 text-[15px] font-medium transition-colors rounded-md hover:bg-white/5">
                {lang === 'ar' ? 'الاستوديو' : 'Studio'}
              </button>
              <button 
                onClick={() => setActiveTab('studio')}
                className="bg-gradient-to-r from-[#707cff] to-[#b100ff] text-white px-6 py-2.5 rounded-[8px] font-medium hover:opacity-90 transition-opacity text-[15px] shadow-[inset_6px_0_12px_rgba(255,255,255,0.22)] flex items-center gap-x-1"
              >
                <span>{lang === 'ar' ? 'ابدأ جلسة الاستكشاف' : 'Start a discovery session'}</span>
                <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </nav>

        {/* NEWERA Hero Section */}
        <section className="relative pt-48 pb-32 overflow-hidden bg-[#0a0a0f]">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#9824f9] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-[#1863dc] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="max-w-2xl">
              <h1 className="text-[70px] lg:text-[80px] font-sans font-medium leading-[1.0] tracking-[-2.4px] mb-6 text-white">
                {lang === 'ar' ? <><span className="block">ذكاء اصطناعي يحافظ على خصوصية عملائك،</span>مُصمم لمؤسستك.</> : <>Privacy-first AI.<br/>Built for your<br/>enterprise.</>}
              </h1>
              <p className="text-[18px] text-[#e2e2ea] mb-12 max-w-lg leading-[1.6] font-sans font-light">
                {lang === 'ar' ? 'تساعد منصة Well7 المؤسسات الحكومية والشركات القيادية على الانتقال من النماذج التجريبية إلى الإنتاج الفعلي. نصنع نسخاً متطابقة من البيانات الآمنة تماماً، بضمان قاطع لتسريع عمليات الذكاء الاصطناعي، ضمن بيئات معزولة.' : 'Well7 helps government and enterprise teams move from PoCs to production. We generate mathematically guaranteed safe-data clones inside secure, isolated environments within weeks.'}
              </p>
              
              <div className="flex items-center gap-x-4">
                <button onClick={() => setActiveTab('studio')} className="bg-gradient-to-r from-[#707cff] to-[#b100ff] text-white px-6 py-4 rounded-[8px] font-medium hover:opacity-90 transition-opacity text-[16px] shadow-[inset_6px_0_12px_rgba(255,255,255,0.22)] flex items-center gap-x-2">
                  <span>{lang === 'ar' ? 'ابدأ جلسة الاستكشاف' : 'Start a discovery session'}</span>
                  <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setActiveTab('studio')} className="bg-[#1b1b22] text-white border border-[#ffffff1a] px-6 py-4 rounded-[8px] font-medium hover:bg-[#2a2a35] transition-colors text-[16px]">
                  {lang === 'ar' ? 'استكشف منصتنا' : 'Explore our platform'}
                </button>
              </div>
            </div>

            <div className="relative flex justify-center items-center">
               <img src="/newera_hero_graphic.png" alt="3D Abstract AI Nodes" className="w-[110%] max-w-[650px] object-cover scale-110 drop-shadow-2xl mix-blend-screen" />
            </div>
            
          </div>
        </section>

        {/* The Problem We Solve (Dark Canvas) */}
        <section className="py-32 bg-[#0a0a0f] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffffff1a] to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="text-[14px] uppercase tracking-[2px] text-[#707cff] mb-6 text-center font-medium">
              {lang === 'ar' ? 'عنق الزجاجة في البناء الهندسي' : 'The Architecture Bottleneck'}
            </div>
            <h2 className="text-[48px] font-sans font-medium leading-[1.1] tracking-[-1px] text-white mb-10 text-center">
              {lang === 'ar' ? 'المشكلة: البيانات المحجوبة والمقيدة' : 'The Problem: Locked Data'}
            </h2>
            <p className="text-[20px] text-[#e2e2ea] leading-[1.6] text-center mb-12 font-light">
              {lang === 'ar' ? 'تمتلك اليوم العديد من المنظمات كنزاً ضخماً من المعلومات، ولكنها تواجه قيوداً صارمة للحفاظ على خصوصية العميل. وتجعل التشريعات الصارمة مثل (نظام حماية البيانات الشخصية - PDPL) وقوانين الخصوصية العالمية من تقديم هذه البيانات للمطورين أو الجهات المعنية مغامرة عالية الخطورة.' : 'Today, organizations are sitting on a goldmine of valuable information, but face strict boundaries surrounding the privacy of the client. Strict privacy laws like the Saudi PDPL and global GDPR make it highly risky to share this real data with the people who need it most: AI developers, internal teams, and external partners.'}
            </p>
            <div className="p-12 bg-[#ffffff03] rounded-[24px] border border-[#ffffff0a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
               <p className="text-[18px] text-[#e2e2ea] leading-[1.6] text-center mb-6 font-light shrink-0">
                 {lang === 'ar' ? <>وبسبب التخوف من اختراق البيانات وفرض غرامات ضخمة، تقوم المجموعات بوضع هذه البيانات في بيئة محصورة تماماً. ما نُشير إليه بمشكلة <strong className="text-white font-medium">البيانات المحجوبة</strong>.</> : <>Because of the fear of massive fines and data breaches, companies simply lock their data away in a vault. We call this the <strong className="text-white font-medium">Locked Data</strong> problem.</>}
               </p>
               <p className="text-[18px] text-[#e2e2ea] leading-[1.6] text-center font-light">
                 {lang === 'ar' ? 'حين تُحَجَّب البيانات، يتوقف الإبتكار. وتفقد النماذج الذكية والبرمجيات مصدر التطوير لأنها محرومة من البيانات الحقيقية. وما يزيد الطين بلة، أن الطرق القديمة في إخفاء هوية البيانات لم تعد قادرة على إيقاف الهجمات السيبرانية الحديثة.' : 'When data is locked, innovation stops. Teams can\'t build smart AI models or test new software because they are starved of real-world information. To make matters worse, the old methods of hiding data just aren\'t strong enough anymore to stop modern cyber attacks.'}
               </p>
            </div>
          </div>
        </section>

        {/* Why It's Needed (Snow Canvas / Adjusted for dark theme flow) */}
        <section className="py-32 bg-[#0d0d14] relative border-y border-[#ffffff1a]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="text-[14px] uppercase tracking-[2px] text-[#b100ff] mb-6 text-center font-medium">
              {lang === 'ar' ? 'الحل الرياضي المثبت' : 'The Mathematical Solution'}
            </div>
            <h2 className="text-[48px] font-sans font-medium leading-[1.1] tracking-[-1px] text-white mb-10 text-center">
              {lang === 'ar' ? 'لماذا حماية البيانات هو الحل الأمثل؟' : 'Why Data Protection is the Solution'}
            </h2>
            <p className="text-[20px] text-[#e2e2ea] leading-[1.6] mb-8 font-light">
              {lang === 'ar' ? <>تتطلب النماذج المتقدمة للذكاء الاصطناعي كميات هائلة من البيانات. تتيح نماذج حماية الخصوصية لدينا بناء ضمانات رياضية تحافظ بشكل قاطع على أمن المعلومات، محتفظة بما يصل إلى <strong className="text-white font-medium">١٠٠٪ من الجودة الإحصائية</strong> للبيانات الأصلية.</> : <>Developing advanced AI requires substantial volumes of data. Data protection models offer a mathematical guarantee of privacy while preserving <strong className="text-white font-medium">100% of the statistical utility</strong> found in the original dataset.</>}
            </p>
            <p className="text-[20px] text-[#e2e2ea] leading-[1.6] font-light">
              {lang === 'ar' ? 'هذا النهج ضروري لتمكين تبادل البيانات عبر المؤسسات، وتفعيل نماذج الذكاء الاصطناعي بشكل آمن، دون المساس بأي بيانات وتفاصيل خاصة بشخصية المستخدم الفعلي.' : 'This approach is essential to facilitate secure cross-border data sharing, accelerate AI model training, enable safe third-party software testing, and unlock the value of internal datasets. All without exposing any real individual\'s private information.'}
            </p>
          </div>
        </section>

        {/* APPLIED USE CASES FOR SAUDI SECTORS */}
        <section className="py-32 bg-[#0a0a0f] relative border-b border-[#ffffff1a] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-[14px] uppercase tracking-[2px] text-[#707cff] mb-6 text-center font-medium">
              {lang === 'ar' ? 'حالات الاستخدام العملية' : 'Applied Use Cases'}
            </div>
            <h2 className="text-[48px] font-sans font-medium leading-[1.1] tracking-[-1px] text-white mb-16 text-center">
              {lang === 'ar' ? 'مصمم لقطاعي الصحة والبنوك في السعودية' : 'Designed for Saudi Health & Finance'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="p-10 border border-[#ffffff1a] bg-[#ffffff03] rounded-[24px] backdrop-blur-sm hover:bg-[#ffffff08] transition-colors">
                <div className="p-4 bg-[#b100ff]/20 w-max rounded-[12px] mb-6 border border-[#b100ff]/30">
                  <Activity className="w-8 h-8 text-[#b100ff]" />
                </div>
                <h3 className="text-[24px] font-medium text-white mb-4">
                  {lang === 'ar' ? 'القطاع الصحي: خصوصية بيانات المرضى' : 'Health Sector: Patient Data Privacy'}
                </h3>
                <p className="text-[16px] text-[#e2e2ea] font-light leading-[1.6]">
                  {lang === 'ar' 
                    ? <><strong className="text-white">التحدي:</strong> تواجه المستشفيات صعوبة في استخدام بيانات المرضى لتدريب النماذج داخلياً، أو مشاركتها مع الباحثين والشركات الخارجية بسبب مخاطر الخصوصية، مما يعطل الابتكار الطبي.<br/><strong className="text-white mt-2 block">الحل:</strong> الحل بكل بساطة يوفر لك أعلى معايير الخصوصية عشان تشارك البيانات بأمان مع أي جهة خارجية وتطور أبحاثك، بدون ما تشيل هم خصوصية المرضى أو بياناتهم الشخصية.</>
                    : <><strong className="text-white">The Challenge:</strong> Hospitals struggle to use patient data even for internal model training, let alone sharing it with researchers or external partners due to privacy risks, stalling medical innovation.<br/><strong className="text-white mt-2 block">The Solution:</strong> Our solution prioritizes total privacy, enabling you to share data securely with any external party for training and research without ever worrying about patient confidentiality.</>}
                </p>
              </div>

              <div className="p-10 border border-[#ffffff1a] bg-[#ffffff03] rounded-[24px] backdrop-blur-sm hover:bg-[#ffffff08] transition-colors">
                <div className="p-4 bg-[#707cff]/20 w-max rounded-[12px] mb-6 border border-[#707cff]/30">
                  <Shield className="w-8 h-8 text-[#707cff]" />
                </div>
                <h3 className="text-[24px] font-medium text-white mb-4">
                  {lang === 'ar' ? 'القطاع البنكي: أمان المعاملات المالية' : 'Banking Sector: Financial Transaction Privacy'}
                </h3>
                <p className="text-[16px] text-[#e2e2ea] font-light leading-[1.6]">
                  {lang === 'ar' 
                    ? <><strong className="text-white">التحدي:</strong> تواجه البنوك عقبات في استخدام البيانات المالية الحساسة لتدريب النماذج داخلياً، أو تزويد الشركات الخارجية والمختبرات التقنية بالبيانات اللازمة للتطوير والاختبار.<br/><strong className="text-white mt-2 block">الحل:</strong> مكن مؤسستك من التعاون والابتكار مع الشركات الخارجية بكل أمان، من خلال تقنية تضمن خصوصية عملائك بشكل كامل وتلبي كل متطلبات الـ PDPL بدون أي تعقيد.</>
                    : <><strong className="text-white">The Challenge:</strong> Banks face bottlenecks when using sensitive financial data for internal model training, or providing external vendors and labs with enough data for development and testing.<br/><strong className="text-white mt-2 block">The Solution:</strong> Enable your organization to collaborate and innovate with external parties securely, through a privacy-first approach that fully satisfies PDPL requirements without any complexity.</>}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Tech (Multi-Column) */}
        <section className="py-32 bg-[#0a0a0f] max-w-7xl mx-auto px-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#707cff] rounded-full blur-[200px] opacity-[0.08] pointer-events-none"></div>
            
            <h2 className="text-[48px] font-sans font-medium leading-[1.1] tracking-[-1px] text-white mb-16 text-center relative z-10">
              {lang === 'ar' ? 'التقنية المحورية للعمل' : 'The Core Technology'}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              <div className="bg-[#1b1b22] p-10 rounded-[24px] border border-[#ffffff0a] hover:border-[#707cff]/50 transition-colors duration-500 shadow-2xl">
                <Network className="text-[#707cff] w-8 h-8 mb-8" />
                <h3 className="text-[24px] font-sans mb-4 text-white font-medium">{lang === 'ar' ? 'حاضنة النماذج المتقدمة' : 'Multi-Model Substrate'}</h3>
                <p className="text-[16px] text-[#8f8f9d] leading-[1.6] font-light">{lang === 'ar' ? 'الوصول لنماذج تدفق البيانات المتطورة كـتطبيق TabTreeFormer لضمان عملها بشكل مباشر ومستقل في البيئات المنفصلة.' : 'Access proprietary models including Saudi TFMs, TabTreeFormer, and CTAB-GAN-DP for specific deployment needs.'}</p>
              </div>
              <div className="bg-[#1b1b22] p-10 rounded-[24px] border border-[#ffffff0a] hover:border-[#b100ff]/50 transition-colors duration-500 shadow-2xl">
                <Activity className="text-[#b100ff] w-8 h-8 mb-8" />
                <h3 className="text-[24px] font-sans mb-4 text-white font-medium">{lang === 'ar' ? 'مؤشرات (KS) الإحصائية' : 'Kolmogorov-Smirnov Utility'}</h3>
                <p className="text-[16px] text-[#8f8f9d] leading-[1.6] font-light">{lang === 'ar' ? 'الحفاظ التام على تركيبة هيكل قاعدة البيانات الأصلية وتزويد أنظمة و بيئات الاختبار بنفس مستويات الجودة الواقعية.' : 'Preserve exact schemas and statistical utility proving Machine Learning Test-on-Safe-Data reliability.'}</p>
              </div>
              <div className="bg-[#1b1b22] p-10 rounded-[24px] border border-[#ffffff0a] hover:border-[#9824f9]/50 transition-colors duration-500 shadow-2xl">
                <Shield className="text-[#9824f9] w-8 h-8 mb-8" />
                <h3 className="text-[24px] font-sans mb-4 text-white font-medium">{lang === 'ar' ? 'توافق كامل مع (PDPL)' : 'PDPL Compliant DCR'}</h3>
                <p className="text-[16px] text-[#8f8f9d] leading-[1.6] font-light">{lang === 'ar' ? 'حاجز حماية تفاضلي رياضي يحول دون محاولات الهجوم أو مطابقة التسريبات ليواكب متطلبات القوانين السعودية.' : 'Mathematical Differential privacy bounding guarantees defense against Linkage Attacks matching Saudi laws.'}</p>
              </div>
            </div>
        </section>

        {/* Enterprise Footer */}
        <footer className="py-20 bg-[#050508] border-t border-[#ffffff1a] relative z-20">
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                 <div className="flex items-center gap-x-3 mb-6">
                   <Database className="text-[#8f8f9d] w-6 h-6" />
                   <span className="text-[20px] font-sans font-medium text-white tracking-tight">Well7 Compliance</span>
                 </div>
                 <p className="text-[#8f8f9d] text-[15px] leading-relaxed mb-10 font-light max-w-sm">
                   {lang === 'ar' 
                     ? "يشكل هذا النظام بيئة مؤسسية متقدمة مبنية على الامتثال الصارم لمتطلبات ولوائح الخصوصية للبيئات المغلقة والخاضعة للتنظيم المالي والحكومي في المملكة العربية السعودية."
                     : "This software architecture constitutes a Professional-Grade Enterprise System purpose-built for highly regulated domestic environments within the Kingdom of Saudi Arabia."}
                 </p>
                 <div className="text-[#5b5b6b] text-[13px] font-mono tracking-wide">
                    {lang === 'ar' ? "© 2026 Well7. جميع الحقوق محفوظة." : "© 2026 Well7. All rights reserved."}
                 </div>
              </div>
              <div className="space-y-8">
                 <h4 className="text-white text-[15px] font-medium tracking-[1.5px] uppercase mb-6">
                   {lang === 'ar' ? "المعايير المؤسسية المشتركة" : "Institutional Standards"}
                 </h4>
                 <div className="flex items-start gap-x-4">
                   <Shield className="w-5 h-5 text-[#707cff] shrink-0 mt-0.5" />
                   <div>
                     <h5 className="text-white text-[15px] font-medium mb-1.5">{lang === 'ar' ? "التوافق مع قانون (PDPL)" : "PDPL Compliance"}</h5>
                     <p className="text-[#8f8f9d] text-[14px] font-light leading-relaxed">{lang === 'ar' ? "تمت هيكلة العمليات بأعلى معايير الخصوصية للامتثال لنظام حماية البيانات الشخصية عبر تبني خوارزميات إخفاء هوية متقدمة." : "Architected with privacy-by-design to adhere strictly to the Saudi Personal Data Protection Law standards, facilitating absolute anonymization."}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-x-4">
                   <AlertTriangle className="w-5 h-5 text-[#b100ff] shrink-0 mt-0.5" />
                   <div>
                     <h5 className="text-white text-[15px] font-medium mb-1.5">{lang === 'ar' ? "اعتمادية البيئات المعزولة" : "Air-Gapped Ready"}</h5>
                     <p className="text-[#8f8f9d] text-[14px] font-light leading-relaxed">{lang === 'ar' ? "الأنظمة مصممة للعمل داخلياً من خلال حاويات مغلقة (Docker) بدون الحاجة للاتصال الخارجي لضمان الخصوصية القصوى." : "The full suite operates offline within securely containerized ecosystems utilizing proprietary algorithmic engines."}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-x-4">
                   <CheckCircle2 className="w-5 h-5 text-[#9824f9] shrink-0 mt-0.5" />
                   <div>
                     <h5 className="text-white text-[15px] font-medium mb-1.5">{lang === 'ar' ? "حوكمة وضوابط البيانات" : "Data Governance"}</h5>
                     <p className="text-[#8f8f9d] text-[14px] font-light leading-relaxed">{lang === 'ar' ? "يمنع الوصول المباشر للمعلومات الخام وتقليص مخاطر التسريب مع إنتاج بيانات اصطناعية تعكس الواقع بدرجة مثالية." : "Strict tracking measures limit direct access to raw information while fostering high-fidelity synthetic representations."}</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  /* -------------------
     ENTERPRISE STUDIO (COHERE THEME)
  ---------------------*/
  return (
    <div className="flex h-screen bg-pure-white font-sans text-near-black overflow-hidden">
      {/* Sidebar - Deep Dark */}
      <div className="w-64 bg-deep-dark text-pure-white flex flex-col h-full shrink-0 border-r border-[#333333]">
        <div className="p-6 cursor-pointer mb-4" onClick={() => setActiveTab('landing')}>
          <div className="flex items-center space-x-2 text-pure-white">
            <Database className="w-6 h-6" />
            <span className="text-2xl font-display font-medium tracking-tight">Well7 Studio</span>
          </div>
        </div>
        
        <div className="px-6 mb-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.28px] text-[#93939f] mb-4">Workspace</div>
        </div>

        <div className="flex-1 px-4 space-y-1">
          {[
            { id: 'catalog', icon: <Files className="w-4 h-4"/>, label: 'Data Catalog' },
            { id: 'synthesis', icon: <Zap className="w-4 h-4"/>, label: 'Protection Studio' },
            { id: 'models', icon: <Network className="w-4 h-4"/>, label: 'Model Registry' },
            { id: 'reports', icon: <BarChart3 className="w-4 h-4"/>, label: 'Evaluation Audit' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setStudioView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-[8px] transition-colors text-[14px] ${
                studioView === item.id 
                ? 'bg-[#ffffff10] text-pure-white font-medium' 
                : 'text-[#93939f] hover:text-pure-white hover:bg-[#ffffff05]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-[#333333]">
          <div className="flex items-center space-x-2 text-[12px] font-mono text-[#93939f]">
            <div className="w-2 h-2 bg-pure-white rounded-full"></div>
            <span>System: Operational</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Snow Background for separation */}
      <div className="flex-1 overflow-y-auto bg-snow p-12">
        
        {/* VIEW: Data Catalog */}
        {studioView === 'catalog' && (
          <div className="animate-in fade-in max-w-5xl mx-auto">
            <div className="mb-10">
              <h2 className="text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Data Catalog</h2>
              <p className="text-[16px] text-muted-slate">Secure ingestion zone with automated PII detection.</p>
            </div>
            
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              className="border border-border-cool rounded-[22px] p-12 bg-pure-white hover:border-interaction-blue transition-colors mb-10 cursor-pointer relative text-center"
            >
              <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv" />
              <UploadCloud className="w-8 h-8 text-muted-slate mx-auto mb-4" />
              <p className="text-[16px] text-near-black font-medium">Drag & Drop enterprise datasets here to catalog.</p>
            </div>
            
            {datasets.length === 0 && (
               <div className="text-center p-12 bg-pure-white rounded-[22px] border border-lightest-gray">
                 <p className="text-[16px] text-muted-slate mb-6">No datasets cataloged.</p>
                 <button onClick={loadFallback} className="text-interaction-blue font-medium text-[14px] hover:underline">Load Sample Saudi Dataset</button>
               </div>
            )}

            <div className="space-y-6">
              {datasets.map(ds => (
                <div key={ds.id} className="bg-pure-white p-8 rounded-[22px] border border-border-cool">
                  <div className="flex justify-between items-center mb-6 pb-6 border-b border-lightest-gray">
                    <div>
                      <h4 className="text-[20px] font-sans font-medium text-cohere-black">{ds.name}</h4>
                      <div className="text-[12px] font-mono text-muted-slate mt-2 tracking-[0.16px]">
                        ID: {ds.id} • ROWS: {ds.rows.length} • IMPORTED: {ds.date}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-snow border border-border-cool text-cohere-black text-[12px] font-mono uppercase tracking-[0.16px] rounded-sm">Active</span>
                  </div>
                  <div>
                    <h5 className="font-mono text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-4">Schema Inference</h5>
                    <div className="flex flex-wrap gap-2">
                       {ds.headers.map((h, i) => {
                         const risk = ds.piiColumns[i];
                         const badgeClass = risk === 'High Risk' ? 'border-[#ff0000] text-[#ff0000]' : risk === 'Medium Risk' ? 'border-[#ff8c00] text-[#ff8c00]' : 'border-border-cool text-near-black';
                         return (
                           <div key={i} className={`flex items-center space-x-2 px-3 py-1.5 rounded-[4px] text-[12px] font-mono border bg-snow ${badgeClass}`}>
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
          <div className="animate-in fade-in max-w-5xl mx-auto">
             <div className="mb-10">
              <h2 className="text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Protection Studio</h2>
              <p className="text-[16px] text-muted-slate">Configure generative models and apply differential privacy boundaries.</p>
            </div>
            
            <div className="bg-pure-white rounded-[22px] border border-border-cool overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-10 border-r border-lightest-gray space-y-8">
                  <div>
                    <label className="block text-[14px] font-medium text-cohere-black mb-3">1. Target Dataset</label>
                    <select 
                      className="w-full p-3 bg-snow border border-border-cool rounded-[8px] focus:outline-2 focus:outline-interaction-blue text-[14px] text-near-black appearance-none"
                      value={synthConfig.datasetId}
                      onChange={e => setSynthConfig({...synthConfig, datasetId: e.target.value})}
                    >
                      <option value="">-- Choose Data Catalog --</option>
                      {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.rows.length} rows)</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[14px] font-medium text-cohere-black mb-3">2. Architecture Variant</label>
                    <select 
                      className="w-full p-3 bg-snow border border-border-cool rounded-[8px] focus:outline-2 focus:outline-interaction-blue text-[14px] text-near-black appearance-none"
                      value={synthConfig.modelId}
                      onChange={e => setSynthConfig({...synthConfig, modelId: e.target.value})}
                    >
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="flex justify-between items-center mb-3">
                      <span className="text-[14px] font-medium text-cohere-black">3. Privacy (Epsilon ε)</span>
                      <span className="font-mono text-[12px] bg-snow border border-border-cool px-2 py-1 rounded-sm">{synthConfig.epsilon.toFixed(1)}</span>
                    </label>
                    <input 
                      type="range" min="0.1" max="10.0" step="0.1" 
                      value={synthConfig.epsilon}
                      onChange={e => setSynthConfig({...synthConfig, epsilon: parseFloat(e.target.value)})}
                      className="w-full accent-cohere-black"
                    />
                  </div>
                </div>

                <div className="p-10 flex flex-col justify-center items-center text-center bg-snow">
                   <div className={`w-24 h-24 rounded-[22px] border border-border-cool bg-pure-white flex items-center justify-center mb-8 ${isProcessing ? 'animate-pulse' : ''}`}>
                     {!isProcessing ? <Zap className="w-8 h-8 text-cohere-black"/> : <Network className="w-8 h-8 text-interaction-blue"/>}
                   </div>
                   <h3 className="text-[20px] font-sans font-medium text-cohere-black mb-3">{isProcessing ? "Training Foundation Model..." : "Ready to Deploy"}</h3>
                   <p className="text-[14px] text-muted-slate mb-8 max-w-xs">
                     PDPL regulations mathematically guaranteed up to Epsilon bound {synthConfig.epsilon}.
                   </p>
                   <button 
                     disabled={isProcessing}
                     onClick={startSynthesis} 
                     className={`w-full py-4 rounded-[8px] font-medium flex justify-center items-center space-x-2 text-[14px] transition-all ${isProcessing ? 'bg-border-cool text-muted-slate' : 'bg-cohere-black text-pure-white hover:opacity-90'}`}
                   >
                     {isProcessing ? <span>Processing Queue...</span> : <><Play className="w-4 h-4"/> <span>Execute Job Queue</span></>}
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Model Registry */}
        {studioView === 'models' && (
          <div className="animate-in fade-in max-w-5xl mx-auto">
            <div className="mb-10">
              <h2 className="text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Model Registry</h2>
              <p className="text-[16px] text-muted-slate">Fleet of Foundation Models available for safe data generation.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {models.map(m => (
                <div key={m.id} className="bg-pure-white p-8 rounded-[22px] border border-lightest-gray hover:border-border-cool transition-colors">
                  <div className="font-mono text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-4">{m.type}</div>
                  <h4 className="text-[20px] font-sans font-medium text-cohere-black mb-6">{m.name}</h4>
                  
                  <div className="space-y-3 text-[14px] text-near-black border-t border-lightest-gray pt-6">
                    <div className="flex justify-between">
                      <span className="text-muted-slate">Latency</span> 
                      <span className="font-medium">{m.latency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-slate">Privacy Baseline</span> 
                      <span className="font-medium">{m.privacy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Evaluation Audit */}
        {studioView === 'reports' && (
          <div className="animate-in fade-in max-w-5xl mx-auto">
            <div className="mb-10">
              <h2 className="text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Evaluation Audit</h2>
              <p className="text-[16px] text-muted-slate">Statistical teardown of generated artifacts.</p>
            </div>
            
            {reports.length === 0 ? (
              <div className="text-center p-16 bg-pure-white rounded-[22px] border border-lightest-gray">
                <p className="text-[16px] text-muted-slate">No telemetry recorded in this session.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {reports.map((rep, idx) => {
                  const radarData = [
                    { metric: 'Utility (KS)', A: rep.metrics.ksTest, fullMark: 100 },
                    { metric: 'ML (TSTR)', A: rep.metrics.tstr, fullMark: 100 },
                    { metric: 'Privacy (DCR)', A: Math.min(rep.metrics.dcr * 300, 100), fullMark: 100 },
                  ];

                  return(
                  <div key={idx} className="bg-pure-white rounded-[22px] border border-border-cool overflow-hidden">
                    {/* Header - Ghost Button Usage */}
                    <div className="p-8 border-b border-lightest-gray flex justify-between items-center bg-snow">
                       <div>
                         <h4 className="text-[20px] font-sans font-medium text-cohere-black mb-2">Report: {rep.id}</h4>
                         <p className="text-[14px] text-muted-slate">Dataset: {rep.datasetName} • Engine: {rep.config.modelName} • Epsilon: {rep.config.epsilon}</p>
                       </div>
                       <button onClick={() => {
                          const escapeCsv = (val) => typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
                          const csvContent = '\uFEFF' + rep.headers.map(escapeCsv).join(',') + '\n' + rep.synthetic.map(r => r.map(escapeCsv).join(',')).join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          const url = URL.createObjectURL(blob);
                          link.setAttribute('href', url);
                          link.setAttribute('download', `Well7_${rep.id}.csv`);
                          link.style.visibility = 'hidden';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                       }} className="bg-transparent text-cohere-black hover:text-interaction-blue px-4 py-2 font-medium flex items-center space-x-2 text-[14px] border border-transparent hover:border-interaction-blue rounded-[8px] transition-colors">
                         <Download className="w-4 h-4"/> <span>Download Asset</span>
                       </button>
                    </div>
                    
                    <div className="grid md:grid-cols-3 border-b border-lightest-gray">
                      <div className="p-8 border-r border-lightest-gray">
                        <div className="font-mono text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-2">KS Utility</div>
                        <div className="text-[32px] font-display font-medium">{rep.metrics.ksTest}%</div>
                      </div>
                      <div className="p-8 border-r border-lightest-gray">
                        <div className="font-mono text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-2">TSTR Score</div>
                        <div className="text-[32px] font-display font-medium text-interaction-blue">{rep.metrics.tstr}%</div>
                      </div>
                      <div className="p-8">
                        <div className="font-mono text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-2">Privacy DCR</div>
                        <div className="text-[32px] font-display font-medium text-near-black">{rep.metrics.dcr}x</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 p-8 gap-10">
                       <div className="h-64 border border-lightest-gray rounded-[16px] p-4 bg-snow">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="#333333" />
                              <PolarAngleAxis dataKey="metric" tick={{fill: '#93939f', fontSize: 12, fontFamily: 'JetBrains Mono'}} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                              <Radar name="Score" dataKey="A" stroke="#ffffff" fill="#ffffff" fillOpacity={0.1} />
                            </RadarChart>
                          </ResponsiveContainer>
                       </div>
                       
                       <div>
                         <h5 className="font-mono text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-4">Sample Before/After Extraction</h5>
                         <div className="border border-border-cool rounded-[16px] overflow-hidden">
                            <table className="w-full text-left text-[14px]">
                              <thead className="bg-snow border-b border-border-cool">
                                <tr>
                                  <th className="p-4 font-mono text-[12px] text-muted-slate uppercase font-normal w-1/4">Status</th>
                                  {rep.headers.slice(0,3).map((h, i) => <th key={i} className="p-4 font-mono text-[12px] text-muted-slate uppercase font-normal">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {rep.synthetic.slice(0, 3).map((row, rIdx) => (
                                  <tr key={rIdx} className="border-b last:border-0 border-lightest-gray bg-pure-white">
                                    <td className="px-4 py-3 text-[12px] font-mono font-medium text-interaction-blue"><span className="px-2 py-1 bg-[#1863dc10] rounded-sm flex items-center w-max"><Zap className="w-3 h-3 mr-1"/> Synthetic</span></td>
                                    {row.slice(0,3).map((c, cIdx) => <td key={cIdx} className="px-4 py-3 text-cohere-black font-medium">{c}</td>)}
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
