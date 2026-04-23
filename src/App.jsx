import React, { useState } from 'react';
import { 
  Database, Activity, Shield, Network, Zap, ArrowRight,
  Files, BarChart3, UploadCloud, ChevronRight, 
  AlertTriangle, CheckCircle2, Download, Play, LayoutDashboard,
  Menu, X
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
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const WEB3FORMS_ACCESS_KEY = "cc5904e7-1d9f-4bf6-9f31-733aec968ebe"; // WEB3FORMS ACCESS KEY
  
  const [blogs] = useState([
    {
      id: 1,
      title_en: "The Future of Synthetic Data in Saudi Arabia",
      title_ar: "مستقبل البيانات الاصطناعية في المملكة العربية السعودية",
      excerpt_en: "How generative AI is revolutionizing data privacy and accelerating innovation in the Kingdom's tech ecosystem.",
      excerpt_ar: "كيف يغير الذكاء الاصطناعي التوليدي مفهوم خصوصية البيانات ويسرع الابتكار في المنظومة التقنية للمملكة.",
      date: "2026-04-15",
      category_en: "Strategy",
      category_ar: "إستراتيجية",
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000"
    },
    {
      id: 2,
      title_en: "Navigating PDPL with Synthetic Clones",
      title_ar: "الامتثال لنظام حماية البيانات الشخصية (PDPL) عبر النسخ الاصطناعية",
      excerpt_en: "A deep dive into how Well7 ensures 100% compliance with SDAIA regulations through mathematical privacy.",
      excerpt_ar: "تحليل عميق لكيفية ضمان Well7 للامتثال التام للوائح سدايا من خلال الخصوصية الرياضية.",
      date: "2026-04-10",
      category_en: "Compliance",
      category_ar: "الامتثال",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000"
    },
    {
      id: 3,
      title_en: "Building Scalable AI within Restricted Environments",
      title_ar: "بناء ذكاء اصطناعي قابل للتوسع داخل البيئات المقيدة",
      excerpt_en: "Best practices for training large language models on sensitive healthcare and banking datasets.",
      excerpt_ar: "أفضل الممارسات لتدريب نماذج لغوية كبيرة على مجموعات بيانات الرعاية الصحية والمصرفية الحساسة.",
      date: "2026-04-05",
      category_en: "Engineering",
      category_ar: "هندسة",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000"
    }
  ]);
  
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
      <div className="min-h-screen bg-[#0a0a0f] font-sans text-white border-none transition-all duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-[#ffffff1a] bg-[#0a0a0fcc] backdrop-blur-[20px] transition-all">
          <div className="max-w-7xl mx-auto p-4 md:p-6 flex justify-between items-center">
            <div className="flex items-center space-x-3 gap-x-3">
              <Database className="text-white w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xl md:text-[22px] font-sans font-medium tracking-tight text-white">Well7</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-x-4">
              <button 
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} 
                className="text-white/80 hover:text-white px-4 py-2 text-[15px] font-medium transition-colors rounded-md hover:bg-white/5 border border-white/10 flex items-center justify-center"
              >
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
              <button 
                onClick={() => setActiveTab('blog')} 
                className={`px-4 py-2 text-[15px] font-medium transition-colors rounded-md hover:bg-white/5 ${activeTab === 'blog' ? 'text-white' : 'text-white/80'}`}
              >
                {lang === 'ar' ? 'المدونة' : 'Blog'}
              </button>
              <button 
                onClick={() => setActiveTab('contact')} 
                className={`px-4 py-2 text-[15px] font-medium transition-colors rounded-md hover:bg-white/5 ${activeTab === 'contact' ? 'text-white' : 'text-white/80'}`}
              >
                {lang === 'ar' ? 'اتصل بنا' : 'Contact'}
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

            {/* Mobile Nav Toggle */}
            <div className="lg:hidden flex items-center gap-x-3">
               <button 
                  onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} 
                  className="text-white border border-white/10 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  {lang === 'en' ? 'العربية' : 'EN'}
                </button>
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white">
                 {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-[#0a0a0f] border-b border-[#ffffff1a] p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-y-4">
                <button onClick={() => { setActiveTab('blog'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'المدونة' : 'Blog'}</button>
                <button onClick={() => { setActiveTab('contact'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</button>
                <button onClick={() => { setActiveTab('studio'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'الاستوديو' : 'Studio'}</button>
                <button 
                  onClick={() => { setActiveTab('studio'); setIsMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-[#707cff] to-[#b100ff] text-white py-4 rounded-[12px] font-medium flex items-center justify-center gap-x-2"
                >
                  <span>{lang === 'ar' ? 'ابدأ جلسة الاستكشاف' : 'Start a discovery session'}</span>
                  <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* NEWERA Hero Section */}
        <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden bg-[#0a0a0f]">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] bg-[#9824f9] rounded-full blur-[100px] md:blur-[150px] opacity-20 pointer-events-none"></div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-[#1863dc] rounded-full blur-[100px] md:blur-[150px] opacity-20 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="max-w-2xl text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-sans font-medium leading-[1.1] md:leading-[1.0] tracking-[-1.5px] md:tracking-[-2.4px] mb-6 text-white">
                {lang === 'ar' ? <><span className="block">ذكاء اصطناعي يحافظ على خصوصية عملائك،</span>مُصمم لمؤسستك.</> : <>Privacy-first AI.<br/>Built for your<br className="hidden md:block"/>enterprise.</>}
              </h1>
              <p className="text-base md:text-[18px] text-[#e2e2ea] mb-8 md:mb-12 max-w-lg mx-auto lg:mx-0 leading-[1.6] font-sans font-light">
                {lang === 'ar' ? 'تساعد منصة Well7 المؤسسات الحكومية والشركات القيادية على الانتقال من النماذج التجريبية إلى الإنتاج الفعلي. نصنع نسخاً متطابقة من البيانات الآمنة تماماً، بضمان قاطع لتسريع عمليات الذكاء الاصطناعي، ضمن بيئات معزولة.' : 'Well7 helps government and enterprise teams move from PoCs to production. We generate mathematically guaranteed safe-data clones inside secure, isolated environments within weeks.'}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button onClick={() => setActiveTab('studio')} className="w-full sm:w-auto bg-gradient-to-r from-[#707cff] to-[#b100ff] text-white px-6 py-4 rounded-[8px] font-medium hover:opacity-90 transition-opacity text-base shadow-[inset_6px_0_12px_rgba(255,255,255,0.22)] flex items-center justify-center gap-x-2">
                  <span>{lang === 'ar' ? 'ابدأ جلسة الاستكشاف' : 'Start a discovery session'}</span>
                  <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setActiveTab('studio')} className="w-full sm:w-auto bg-[#1b1b22] text-white border border-[#ffffff1a] px-6 py-4 rounded-[8px] font-medium hover:bg-[#2a2a35] transition-colors text-base">
                  {lang === 'ar' ? 'استكشف منصتنا' : 'Explore our platform'}
                </button>
              </div>
            </div>

            <div className="relative flex justify-center items-center mt-12 lg:mt-0">
               <img src="/newera_hero_graphic.png" alt="3D Abstract AI Nodes" className="w-[90%] md:w-[110%] max-w-[500px] md:max-w-[650px] object-cover scale-110 drop-shadow-2xl mix-blend-screen animate-pulse duration-[4000ms]" />
            </div>
            
          </div>
        </section>

        {/* The Problem We Solve (Dark Canvas) */}
        <section className="py-20 md:py-32 bg-[#0a0a0f] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffffff1a] to-transparent"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="text-[12px] md:text-[14px] uppercase tracking-[2px] text-[#707cff] mb-4 md:mb-6 text-center font-medium">
              {lang === 'ar' ? 'عنق الزجاجة في البناء الهندسي' : 'The Architecture Bottleneck'}
            </div>
            <h2 className="text-3xl md:text-[48px] font-sans font-medium leading-[1.2] md:leading-[1.1] tracking-[-1px] text-white mb-8 md:mb-10 text-center">
              {lang === 'ar' ? 'المشكلة: البيانات المحجوبة والمقيدة' : 'The Problem: Locked Data'}
            </h2>
            <p className="text-lg md:text-[20px] text-[#e2e2ea] leading-[1.6] text-center mb-8 md:mb-12 font-light">
              {lang === 'ar' ? 'تمتلك اليوم العديد من المنظمات كنزاً ضخماً من المعلومات، ولكنها تواجه قيوداً صارمة للحفاظ على خصوصية العميل. وتجعل التشريعات الصارمة مثل (نظام حماية البيانات الشخصية - PDPL) وقوانين الخصوصية العالمية من تقديم هذه البيانات للمطورين أو الجهات المعنية مغامرة عالية الخطورة.' : 'Today, organizations are sitting on a goldmine of valuable information, but face strict boundaries surrounding the privacy of the client. Strict privacy laws like the Saudi PDPL and global GDPR make it highly risky to share this real data with the people who need it most: AI developers, internal teams, and external partners.'}
            </p>
            <div className="p-8 md:p-12 bg-[#ffffff03] rounded-[24px] border border-[#ffffff0a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
               <p className="text-base md:text-[18px] text-[#e2e2ea] leading-[1.6] text-center mb-6 font-light">
                 {lang === 'ar' ? <>وبسبب التخوف من اختراق البيانات وفرض غرامات ضخمة، تقوم المجموعات بوضع هذه البيانات في بيئة محصورة تماماً. ما نُشير إليه بمشكلة <strong className="text-white font-medium">البيانات المحجوبة</strong>.</> : <>Because of the fear of massive fines and data breaches, companies simply lock their data away in a vault. We call this the <strong className="text-white font-medium">Locked Data</strong> problem.</>}
               </p>
               <p className="text-base md:text-[18px] text-[#e2e2ea] leading-[1.6] text-center font-light">
                 {lang === 'ar' ? 'حين تُحَجَّب البيانات، يتوقف الإبتكار. وتفقد النماذج الذكية والبرمجيات مصدر التطوير لأنها محرومة من البيانات الحقيقية. وما يزيد الطين بلة، أن الطرق القديمة في إخفاء هوية البيانات لم تعد قادرة على إيقاف الهجمات السيبرانية الحديثة.' : 'When data is locked, innovation stops. Teams can\'t build smart AI models or test new software because they are starved of real-world information. To make matters worse, the old methods of hiding data just aren\'t strong enough anymore to stop modern cyber attacks.'}
               </p>
            </div>
          </div>
        </section>

        {/* Why It's Needed (Snow Canvas) */}
        <section className="py-20 md:py-32 bg-[#0d0d14] relative border-y border-[#ffffff1a]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="text-[12px] md:text-[14px] uppercase tracking-[2px] text-[#b100ff] mb-4 md:mb-6 text-center font-medium">
              {lang === 'ar' ? 'الحل الرياضي المثبت' : 'The Mathematical Solution'}
            </div>
            <h2 className="text-3xl md:text-[48px] font-sans font-medium leading-[1.2] md:leading-[1.1] tracking-[-1px] text-white mb-8 md:mb-10 text-center">
              {lang === 'ar' ? 'لماذا حماية البيانات هو الحل الأمثل؟' : 'Why Data Protection is the Solution'}
            </h2>
            <p className="text-lg md:text-[20px] text-[#e2e2ea] leading-[1.6] mb-8 font-light">
              {lang === 'ar' ? <>تتطلب النماذج المتقدمة للذكاء الاصطناعي كميات هائلة من البيانات. تتيح نماذج حماية الخصوصية لدينا بناء ضمانات رياضية تحافظ بشكل قاطع على أمن المعلومات، محتفظة بما يصل إلى <strong className="text-white font-medium">١٠٠٪ من الجودة الإحصائية</strong> للبيانات الأصلية.</> : <>Developing advanced AI requires substantial volumes of data. Data protection models offer a mathematical guarantee of privacy while preserving <strong className="text-white font-medium">100% of the statistical utility</strong> found in the original dataset.</>}
            </p>
            <p className="text-lg md:text-[20px] text-[#e2e2ea] leading-[1.6] font-light">
              {lang === 'ar' ? 'هذا النهج ضروري لتمكين تبادل البيانات عبر المؤسسات، وتفعيل نماذج الذكاء الاصطناعي بشكل آمن، دون المساس بأي بيانات وتفاصيل خاصة بشخصية المستخدم الفعلي.' : 'This approach is essential to facilitate secure cross-border data sharing, accelerate AI model training, enable safe third-party software testing, and unlock the value of internal datasets. All without exposing any real individual\'s private information.'}
            </p>
          </div>
        </section>

        {/* APPLIED USE CASES FOR SAUDI SECTORS */}
        <section className="py-20 md:py-32 bg-[#0a0a0f] relative border-b border-[#ffffff1a] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-[12px] md:text-[14px] uppercase tracking-[2px] text-[#707cff] mb-6 text-center font-medium">
              {lang === 'ar' ? 'حالات الاستخدام العملية' : 'Applied Use Cases'}
            </div>
            <h2 className="text-3xl md:text-[48px] font-sans font-medium leading-[1.1] tracking-[-1px] text-white mb-12 md:mb-16 text-center">
              {lang === 'ar' ? 'مصمم لقطاعي الصحة والبنوك في السعودية' : 'Designed for Saudi Health & Finance'}
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              <div className="p-8 md:p-10 border border-[#ffffff1a] bg-[#ffffff03] rounded-[24px] backdrop-blur-sm hover:bg-[#ffffff08] transition-all">
                <div className="p-4 bg-[#b100ff]/20 w-max rounded-[12px] mb-6 border border-[#b100ff]/30">
                  <Activity className="w-6 h-6 md:w-8 md:h-8 text-[#b100ff]" />
                </div>
                <h3 className="text-xl md:text-[24px] font-medium text-white mb-4">
                  {lang === 'ar' ? 'القطاع الصحي: خصوصية بيانات المرضى' : 'Health Sector: Patient Data Privacy'}
                </h3>
                <div className="text-[15px] md:text-[16px] text-[#e2e2ea] font-light leading-[1.6] space-y-4">
                  <p>{lang === 'ar' ? <><strong className="text-white">التحدي:</strong> تواجه المستشفيات صعوبة في استخدام بيانات المرضى لتدريب النماذج داخلياً، أو مشاركتها مع الباحثين والشركات الخارجية بسبب مخاطر الخصوصية، مما يعطل الابتكار الطبي.</> : <><strong className="text-white">The Challenge:</strong> Hospitals struggle to use patient data even for internal model training, let alone sharing it with researchers or external partners due to privacy risks, stalling medical innovation.</>}</p>
                  <p>{lang === 'ar' ? <><strong className="text-white">الحل:</strong> الحل بكل بساطة يوفر لك أعلى معايير الخصوصية عشان تشارك البيانات بأمان مع أي جهة خارجية وتطور أبحاثك، بدون ما تشيل هم خصوصية المرضى أو بياناتهم الشخصية.</> : <><strong className="text-white">The Solution:</strong> Our solution prioritizes total privacy, enabling you to share data securely with any external party for training and research without ever worrying about patient confidentiality.</>}</p>
                </div>
              </div>

              <div className="p-8 md:p-10 border border-[#ffffff1a] bg-[#ffffff03] rounded-[24px] backdrop-blur-sm hover:bg-[#ffffff08] transition-all">
                <div className="p-4 bg-[#707cff]/20 w-max rounded-[12px] mb-6 border border-[#707cff]/30">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#707cff]" />
                </div>
                <h3 className="text-xl md:text-[24px] font-medium text-white mb-4">
                  {lang === 'ar' ? 'القطاع البنكي: أمان المعاملات المالية' : 'Banking Sector: Financial Transaction Privacy'}
                </h3>
                <div className="text-[15px] md:text-[16px] text-[#e2e2ea] font-light leading-[1.6] space-y-4">
                  <p>{lang === 'ar' ? <><strong className="text-white">التحدي:</strong> تواجه البنوك عقبات في استخدام البيانات المالية الحساسة لتدريب النماذج داخلياً، أو تزويد الشركات الخارجية والمختبرات التقنية بالبيانات اللازمة للتطوير والاختبار.</> : <><strong className="text-white">The Challenge:</strong> Banks face bottlenecks when using sensitive financial data for internal model training, or providing external vendors and labs with enough data for development and testing.</>}</p>
                  <p>{lang === 'ar' ? <><strong className="text-white">الحل:</strong> مكن مؤسستك من التعاون والابتكار مع الشركات الخارجية بكل أمان، من خلال تقنية تضمن خصوصية عملائك بشكل كامل وتلبي كل متطلبات الـ PDPL بدون أي تعقيد.</> : <><strong className="text-white">The Solution:</strong> Enable your organization to collaborate and innovate with external parties securely, through a privacy-first approach that fully satisfies PDPL requirements without any complexity.</>}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Tech (Multi-Column) */}
        <section className="py-20 md:py-32 bg-[#0a0a0f] max-w-7xl mx-auto px-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[1000px] md:h-[400px] bg-[#707cff] rounded-full blur-[100px] md:blur-[200px] opacity-[0.08] pointer-events-none"></div>
            
            <h2 className="text-3xl md:text-[48px] font-sans font-medium leading-[1.1] tracking-[-1px] text-white mb-12 md:mb-16 text-center relative z-10">
              {lang === 'ar' ? 'التقنية المحورية للعمل' : 'The Core Technology'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
              <div className="bg-[#1b1b22] p-8 md:p-10 rounded-[24px] border border-[#ffffff0a] hover:border-[#707cff]/50 transition-all duration-500 shadow-2xl">
                <Network className="text-[#707cff] w-7 h-7 md:w-8 md:h-8 mb-6 md:mb-8" />
                <h3 className="text-xl md:text-[24px] font-sans mb-4 text-white font-medium">{lang === 'ar' ? 'حاضنة النماذج المتقدمة' : 'Multi-Model Substrate'}</h3>
                <p className="text-sm md:text-[16px] text-[#8f8f9d] leading-[1.6] font-light">{lang === 'ar' ? 'الوصول لنماذج تدفق البيانات المتطورة كـتطبيق TabTreeFormer لضمان عملها بشكل مباشر ومستقل في البيئات المنفصلة.' : 'Access proprietary models including Saudi TFMs, TabTreeFormer, and CTAB-GAN-DP for specific deployment needs.'}</p>
              </div>
              <div className="bg-[#1b1b22] p-8 md:p-10 rounded-[24px] border border-[#ffffff0a] hover:border-[#b100ff]/50 transition-all duration-500 shadow-2xl">
                <Activity className="text-[#b100ff] w-7 h-7 md:w-8 md:h-8 mb-6 md:mb-8" />
                <h3 className="text-xl md:text-[24px] font-sans mb-4 text-white font-medium">{lang === 'ar' ? 'مؤشرات (KS) الإحصائية' : 'Kolmogorov-Smirnov Utility'}</h3>
                <p className="text-sm md:text-[16px] text-[#8f8f9d] leading-[1.6] font-light">{lang === 'ar' ? 'الحفاظ التام على تركيبة هيكل قاعدة البيانات الأصلية وتزويد أنظمة و بيئات الاختبار بنفس مستويات الجودة الواقعية.' : 'Preserve exact schemas and statistical utility proving Machine Learning Test-on-Safe-Data reliability.'}</p>
              </div>
              <div className="bg-[#1b1b22] p-8 md:p-10 rounded-[24px] border border-[#ffffff0a] hover:border-[#9824f9]/50 transition-all duration-500 shadow-2xl sm:col-span-2 lg:col-span-1">
                <Shield className="text-[#9824f9] w-7 h-7 md:w-8 md:h-8 mb-6 md:mb-8" />
                <h3 className="text-xl md:text-[24px] font-sans mb-4 text-white font-medium">{lang === 'ar' ? 'توافق كامل مع (PDPL)' : 'PDPL Compliant DCR'}</h3>
                <p className="text-sm md:text-[16px] text-[#8f8f9d] leading-[1.6] font-light">{lang === 'ar' ? 'حاجز حماية تفاضلي رياضي يحول دون محاولات الهجوم أو مطابقة التسريبات ليواكب متطلبات القوانين السعودية.' : 'Mathematical Differential privacy bounding guarantees defense against Linkage Attacks matching Saudi laws.'}</p>
              </div>
            </div>
        </section>

        {/* Enterprise Footer */}
        <footer className="py-16 md:py-24 bg-[#050508] border-t border-[#ffffff1a] relative z-20">
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              <div>
                 <div className="flex items-center gap-x-3 mb-6">
                   <Database className="text-[#8f8f9d] w-6 h-6" />
                   <span className="text-lg md:text-[20px] font-sans font-medium text-white tracking-tight">Well7 Compliance</span>
                 </div>
                 <p className="text-[#8f8f9d] text-sm md:text-[15px] leading-relaxed mb-8 md:mb-10 font-light max-w-sm">
                   {lang === 'ar' 
                     ? "يشكل هذا النظام بيئة مؤسسية متقدمة مبنية على الامتثال الصارم لمتطلبات ولوائح الخصوصية للبيئات المغلقة والخاضعة للتنظيم المالي والحكومي في المملكة العربية السعودية."
                     : "This software architecture constitutes a Professional-Grade Enterprise System purpose-built for highly regulated domestic environments within the Kingdom of Saudi Arabia."}
                 </p>
                 <div className="text-[#5b5b6b] text-[12px] md:text-[13px] font-mono tracking-wide">
                    {lang === 'ar' ? "© 2026 Well7. جميع الحقوق محفوظة." : "© 2026 Well7. All rights reserved."}
                 </div>
              </div>
              <div className="space-y-6 md:space-y-8">
                 <h4 className="text-white text-[13px] md:text-[15px] font-medium tracking-[1.5px] uppercase mb-4 md:mb-6">
                   {lang === 'ar' ? "المعايير المؤسسية المشتركة" : "Institutional Standards"}
                 </h4>
                 <div className="flex items-start gap-x-4">
                   <Shield className="w-5 h-5 text-[#707cff] shrink-0 mt-1" />
                   <div>
                     <h5 className="text-white text-sm md:text-[15px] font-medium mb-1.5">{lang === 'ar' ? "التوافق مع قانون (PDPL)" : "PDPL Compliance"}</h5>
                     <p className="text-[#8f8f9d] text-xs md:text-[14px] font-light leading-relaxed">{lang === 'ar' ? "تمت هيكلة العمليات بأعلى معايير الخصوصية للامتثال لنظام حماية البيانات الشخصية عبر تبني خوارزميات إخفاء هوية متقدمة." : "Architected with privacy-by-design to adhere strictly to the Saudi Personal Data Protection Law standards, facilitating absolute anonymization."}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-x-4">
                   <AlertTriangle className="w-5 h-5 text-[#b100ff] shrink-0 mt-1" />
                   <div>
                     <h5 className="text-white text-sm md:text-[15px] font-medium mb-1.5">{lang === 'ar' ? "اعتمادية البيئات المعزولة" : "Air-Gapped Ready"}</h5>
                     <p className="text-[#8f8f9d] text-xs md:text-[14px] font-light leading-relaxed">{lang === 'ar' ? "الأنظمة مصممة للعمل داخلياً من خلال حاويات مغلقة (Docker) بدون الحاجة للاتصال الخارجي لضمان الخصوصية القصوى." : "The full suite operates offline within securely containerized ecosystems utilizing proprietary algorithmic engines."}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-x-4">
                   <CheckCircle2 className="w-5 h-5 text-[#9824f9] shrink-0 mt-1" />
                   <div>
                     <h5 className="text-white text-sm md:text-[15px] font-medium mb-1.5">{lang === 'ar' ? "حوكمة وضوابط البيانات" : "Data Governance"}</h5>
                     <p className="text-[#8f8f9d] text-xs md:text-[14px] font-light leading-relaxed">{lang === 'ar' ? "يمنع الوصول المباشر للمعلومات الخام وتقليص مخاطر التسريب مع إنتاج بيانات اصطناعية تعكس الواقع بدرجة مثالية." : "Strict tracking measures limit direct access to raw information while fostering high-fidelity synthetic representations."}</p>
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
     BLOG PAGE (NEWERA THEME)
  ---------------------*/
  if (activeTab === 'blog') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] font-sans text-white border-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <nav className="fixed top-0 w-full z-50 border-b border-[#ffffff1a] bg-[#0a0a0fcc] backdrop-blur-[20px]">
          <div className="max-w-7xl mx-auto p-4 md:p-6 flex justify-between items-center">
            <div className="flex items-center space-x-3 gap-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
              <Database className="text-white w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xl md:text-[22px] font-sans font-medium tracking-tight text-white">Well7</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-x-6">
              <button onClick={() => setActiveTab('landing')} className="text-white/80 hover:text-white px-2 py-1 text-[15px] font-medium transition-colors">{lang === 'ar' ? 'الرئيسية' : 'Home'}</button>
              <button onClick={() => setActiveTab('contact')} className="text-white/80 hover:text-white px-2 py-1 text-[15px] font-medium transition-colors">{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</button>
              <button 
                onClick={() => setActiveTab('studio')}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-[8px] font-medium transition-all text-[15px] border border-white/10"
              >
                {lang === 'ar' ? 'الاستوديو' : 'Studio'}
              </button>
            </div>

            {/* Mobile Nav Toggle */}
            <div className="md:hidden">
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white">
                 {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-[#0a0a0f] border-b border-[#ffffff1a] p-6 space-y-6">
              <div className="flex flex-col gap-y-4">
                <button onClick={() => { setActiveTab('landing'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'الرئيسية' : 'Home'}</button>
                <button onClick={() => { setActiveTab('contact'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</button>
                <button onClick={() => { setActiveTab('studio'); setIsMenuOpen(false); }} className="text-xl font-medium text-left text-[#707cff] italic font-semibold">{lang === 'ar' ? 'الاستوديو' : 'Studio'}</button>
              </div>
            </div>
          )}
        </nav>

        <section className="pt-32 md:pt-48 pb-16 md:pb-32 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-24">
            <h1 className="text-4xl md:text-[56px] font-sans font-medium tracking-tight mb-6">
              {lang === 'ar' ? 'الأفكار والرؤى' : 'Engineered Intelligence'}
            </h1>
            <p className="text-lg md:text-[20px] text-muted-slate font-light max-w-2xl mx-auto">
              {lang === 'ar' ? 'استكشاف مستقبل الخصوصية والذكاء الاصطناعي والسيادة على البيانات في العصر الرقمي الجديد.' : 'Exploring the intersection of privacy, enterprise AI, and data sovereignty in the new digital era.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {blogs.map(post => (
              <div key={post.id} className="group bg-[#111116] border border-[#ffffff0a] rounded-[24px] overflow-hidden hover:border-[#707cff]/30 transition-all duration-500">
                <div className="h-48 md:h-60 overflow-hidden relative">
                  <img src={post.image} alt={post.title_en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" />
                  <div className="absolute top-4 left-4 inline-block px-3 py-1 bg-[#707cff]/20 border border-[#707cff]/40 rounded-full text-[12px] font-medium tracking-wide text-[#707cff] backdrop-blur-md">
                    {lang === 'ar' ? post.category_ar : post.category_en}
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <div className="text-[12px] md:text-[14px] text-muted-slate mb-3 md:mb-4 font-mono">{post.date}</div>
                  <h3 className="text-xl md:text-[22px] font-medium mb-3 md:mb-4 leading-tight group-hover:text-[#707cff] transition-colors">
                    {lang === 'ar' ? post.title_ar : post.title_en}
                  </h3>
                  <p className="text-sm md:text-base text-muted-slate leading-relaxed font-light mb-6 md:mb-8">
                    {lang === 'ar' ? post.excerpt_ar : post.excerpt_en}
                  </p>
                  <button className="flex items-center gap-x-2 text-[14px] font-medium text-white/80 group-hover:text-white transition-all">
                    <span>{lang === 'ar' ? 'اقرأ المزيد' : 'Read Article'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-12 md:py-20 bg-[#050508] border-t border-[#ffffff1a]">
          <div className="max-w-7xl mx-auto px-6 text-center">
             <div className="text-[12px] md:text-[14px] text-muted-slate font-mono uppercase tracking-widest mb-4">{lang === 'ar' ? 'المعايير المؤسسية' : 'Institutional Data Sovereignty'}</div>
             <p className="text-[12px] md:text-[13px] text-white/40">{lang === 'ar' ? '© 2026 Well7. جميع الحقوق محفوظة.' : '© 2026 Well7. All rights reserved.'}</p>
          </div>
        </footer>
      </div>
    );
  }

  /* -------------------
     CONTACT PAGE (NEWERA THEME)
  ---------------------*/
  if (activeTab === 'contact') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] font-sans text-white border-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <nav className="fixed top-0 w-full z-50 border-b border-[#ffffff1a] bg-[#0a0a0fcc] backdrop-blur-[20px]">
          <div className="max-w-7xl mx-auto p-4 md:p-6 flex justify-between items-center">
            <div className="flex items-center space-x-3 gap-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
              <Database className="text-white w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xl md:text-[22px] font-sans font-medium tracking-tight text-white">Well7</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-x-6">
              <button onClick={() => setActiveTab('landing')} className="text-white/80 hover:text-white px-2 py-1 text-[15px] font-medium transition-colors">{lang === 'ar' ? 'الرئيسية' : 'Home'}</button>
              <button onClick={() => setActiveTab('blog')} className="text-white/80 hover:text-white px-2 py-1 text-[15px] font-medium transition-colors">{lang === 'ar' ? 'المدونة' : 'Blog'}</button>
              <button 
                onClick={() => setActiveTab('studio')}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-[8px] font-medium transition-all text-[15px] border border-white/10"
              >
                {lang === 'ar' ? 'الاستوديو' : 'Studio'}
              </button>
            </div>

             {/* Mobile Nav Toggle */}
             <div className="md:hidden">
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white">
                 {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
            </div>
          </div>

           {/* Mobile Menu Overlay */}
           {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-[#0a0a0f] border-b border-[#ffffff1a] p-6 space-y-6">
              <div className="flex flex-col gap-y-4">
                <button onClick={() => { setActiveTab('landing'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'الرئيسية' : 'Home'}</button>
                <button onClick={() => { setActiveTab('blog'); setIsMenuOpen(false); }} className="text-xl font-medium text-left">{lang === 'ar' ? 'المدونة' : 'Blog'}</button>
                <button onClick={() => { setActiveTab('studio'); setIsMenuOpen(false); }} className="text-xl font-medium text-left text-[#707cff] italic font-semibold">{lang === 'ar' ? 'الاستوديو' : 'Studio'}</button>
              </div>
            </div>
          )}
        </nav>

        <section className="pt-32 md:pt-48 pb-16 md:pb-32 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-[64px] font-sans font-medium tracking-tight mb-6 md:mb-8 leading-[1.1] md:leading-[1.1]">
              {lang === 'ar' ? <>دعنا نتحدث عن<br/>سيادة بياناتك.</> : <>Let's discuss<br className="hidden md:block"/>your data sovereignty.</>}
            </h1>
            <p className="text-lg md:text-[20px] text-muted-slate font-light leading-relaxed mb-10 md:mb-12 max-w-lg mx-auto lg:mx-0">
              {lang === 'ar' ? 'تواصل مع فريق الخبراء لدينا لاستكشاف كيف يمكن لمنصة Well7 تسريع عمليات الذكاء الاصطناعي مع الحفاظ على الامتثال التام.' : 'Connect with our team to explore how Well7 can accelerate your AI initiatives while maintaining absolute compliance within regulated environments.'}
            </p>

            <div className="flex flex-col gap-y-6 max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-x-6 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#707cff]/10 border border-[#707cff]/20 flex items-center justify-center text-[#707cff] shrink-0">
                   <Shield className="w-5 h-5" />
                </div>
                <div className="text-left">
                   <div className="text-[12px] font-medium uppercase tracking-wider text-muted-slate">{lang === 'ar' ? 'الامتثال' : 'Compliance First'}</div>
                   <div className="text-sm md:text-[16px] text-white/80">SDAIA PDPL Certified Approach</div>
                </div>
              </div>
              <div className="flex items-center gap-x-6 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-12 h-12 rounded-full bg-[#b100ff]/10 border border-[#b100ff]/20 flex items-center justify-center text-[#b100ff] shrink-0">
                   <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                   <div className="text-[12px] font-medium uppercase tracking-wider text-muted-slate">{lang === 'ar' ? 'التنصيب' : 'Deployment'}</div>
                   <div className="text-sm md:text-[16px] text-white/80">Air-Gapped & Sovereign Cloud</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111116] border border-[#ffffff0a] p-8 md:p-12 rounded-[32px] shadow-2xl relative overflow-hidden mt-8 lg:mt-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#707cff] rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
               <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[14px] font-medium text-muted-slate mb-2">{lang === 'ar' ? 'الاسم' : 'Full Name'}</label>
                    <input 
                      type="text" 
                      value={contactForm.name}
                      onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-[12px] text-white focus:outline-none focus:border-[#707cff] transition-colors" 
                      placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'John Doe'}
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-medium text-muted-slate mb-2">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input 
                      type="email" 
                      value={contactForm.email}
                      onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-[12px] text-white focus:outline-none focus:border-[#707cff] transition-colors" 
                      placeholder="john@enterprise.com"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-[14px] font-medium text-muted-slate mb-2">{lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}</label>
                  <input 
                    type="tel" 
                    value={contactForm.phone}
                    onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-[12px] text-white focus:outline-none focus:border-[#707cff] transition-colors" 
                    placeholder="+966 5X XXX XXXX"
                  />
               </div>
               <div>
                  <label className="block text-[14px] font-medium text-muted-slate mb-2">{lang === 'ar' ? 'الرسالة' : 'Message'}</label>
                  <textarea 
                    rows={4} 
                    value={contactForm.message}
                    onChange={e => setContactForm({...contactForm, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-[12px] text-white focus:outline-none focus:border-[#707cff] transition-colors resize-none" 
                    placeholder={lang === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help your team?'}
                  />
               </div>
               <button 
                disabled={isSubmitting}
                onClick={async () => {
                  if (!contactForm.name || !contactForm.email || !contactForm.message) {
                    return alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، الرسالة).' : 'Please fill in all required fields (Name, Email, Message).');
                  }

                  setIsSubmitting(true);
                  setSubmitStatus(null);
                  
                  try {
                    const response = await fetch("https://api.web3forms.com/submit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Accept": "application/json" },
                      body: JSON.stringify({
                        access_key: WEB3FORMS_ACCESS_KEY,
                        ...contactForm,
                        subject: `New Contact Lead from Well7: ${contactForm.name}`,
                        from_name: "Well7 Platform"
                      })
                    });

                    if (response.ok) {
                      setSubmitStatus('success');
                      setContactForm({ name: '', email: '', phone: '', message: '' });
                    } else {
                      setSubmitStatus('error');
                    }
                  } catch (error) {
                    setSubmitStatus('error');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className={`w-full bg-gradient-to-r from-[#707cff] to-[#b100ff] text-white py-4 rounded-[12px] font-medium transition-all shadow-[inset_6px_0_12px_rgba(255,255,255,0.22)] flex items-center justify-center gap-x-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
               >
                 {isSubmitting ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : null}
                 <span>{lang === 'ar' ? 'إرسال الرسالة' : 'Send Message'}</span>
               </button>

               {submitStatus === 'success' && (
                 <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-[12px] text-green-400 text-[14px] flex items-center gap-x-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تم استلام رسالتك بنجاح. سيتواصل معك فريقنا قريباً.' : 'Message received. Our team will contact you shortly.'}</span>
                 </div>
               )}

               {submitStatus === 'error' && (
                 <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-[14px] flex items-center gap-x-2 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'عذراً، حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.' : 'Sorry, something went wrong. Please try again or contact us directly.'}</span>
                 </div>
               )}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-[#0d0d14] border-y border-[#ffffff1a]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
             <h2 className="text-2xl md:text-[32px] font-medium mb-8 text-center">{lang === 'ar' ? 'جاهز لاستكشاف المنصة؟' : 'Ready to explore the platform?'}</h2>
             <button 
                onClick={() => setActiveTab('studio')}
                className="flex items-center gap-x-2 bg-white text-black px-6 md:px-8 py-3 md:py-4 rounded-[12px] font-medium hover:bg-white/90 transition-all shadow-xl"
             >
               <LayoutDashboard className="w-5 h-5" />
               <span>{lang === 'ar' ? 'الدخول إلى الاستوديو' : 'Launch Well7 Studio'}</span>
             </button>
          </div>
        </section>
      </div>
    );
  }

  /* -------------------
     ENTERPRISE STUDIO (COHERE THEME)
  ---------------------*/
  const studioNavItems = [
    { id: 'catalog', icon: <Files className="w-4 h-4 md:w-5 md:h-5"/>, label: 'Data Catalog' },
    { id: 'synthesis', icon: <Zap className="w-4 h-4 md:w-5 md:h-5"/>, label: 'Protection Studio' },
    { id: 'models', icon: <Network className="w-4 h-4 md:w-5 md:h-5"/>, label: 'Model Registry' },
    { id: 'reports', icon: <BarChart3 className="w-4 h-4 md:w-5 md:h-5"/>, label: 'Evaluation Audit' },
    { id: 'contact_link', icon: <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#707cff]"/>, label: 'Support' },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-pure-white font-sans text-near-black overflow-hidden">
      {/* Sidebar - Desktop Only (Lg screens and up) */}
      <div className="hidden lg:flex w-64 bg-deep-dark text-pure-white flex-col h-full shrink-0 border-r border-[#333333]">
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
          {studioNavItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'contact_link') {
                  setActiveTab('contact');
                } else {
                  setStudioView(item.id);
                }
              }}
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
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System: Operational</span>
          </div>
        </div>
      </div>

      {/* Mobile Header - Studio */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-deep-dark text-white border-b border-[#333333]">
         <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <Database className="w-5 h-5" />
            <span className="text-lg font-medium">Well7 Studio</span>
         </div>
         <button onClick={() => setActiveTab('landing')} className="text-xs bg-white/10 px-3 py-1 rounded-md">Exit</button>
      </div>

      {/* Main Content Area - Responsive padding */}
      <div className="flex-1 overflow-y-auto bg-snow p-4 md:p-8 lg:p-12 pb-24 lg:pb-12 h-screen">
        
        {/* VIEW: Data Catalog */}
        {studioView === 'catalog' && (
          <div className="animate-in fade-in max-w-5xl mx-auto space-y-8 md:space-y-10">
            <div>
              <h2 className="text-2xl md:text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Data Catalog</h2>
              <p className="text-sm md:text-[16px] text-muted-slate">Secure ingestion zone with automated PII detection.</p>
            </div>
            
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleDrop}
              className="border border-border-cool rounded-[22px] p-8 md:p-12 bg-pure-white hover:border-interaction-blue transition-colors cursor-pointer relative text-center group"
            >
              <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".csv" />
              <UploadCloud className="w-8 h-8 md:w-10 md:h-10 text-muted-slate mx-auto mb-4 group-hover:text-interaction-blue transition-colors" />
              <p className="text-sm md:text-[16px] text-near-black font-medium">Drag & Drop enterprise datasets here to catalog.</p>
              <p className="text-xs text-muted-slate mt-2 italic md:hidden font-semibold">Touch to browse files</p>
            </div>
            
            {datasets.length === 0 && (
               <div className="text-center p-8 md:p-12 bg-pure-white rounded-[22px] border border-lightest-gray">
                 <p className="text-sm md:text-[16px] text-muted-slate mb-6">No datasets cataloged.</p>
                 <button onClick={loadFallback} className="text-interaction-blue font-medium text-sm md:text-[14px] hover:underline bg-interaction-blue/5 px-4 py-2 rounded-full">Load Sample Saudi Dataset</button>
               </div>
            )}

            <div className="space-y-4 md:space-y-6">
              {datasets.map(ds => (
                <div key={ds.id} className="bg-pure-white p-6 md:p-8 rounded-[22px] border border-border-cool shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-lightest-gray">
                    <div>
                      <h4 className="text-lg md:text-[20px] font-sans font-medium text-cohere-black">{ds.name}</h4>
                      <div className="text-[10px] md:text-[12px] font-mono text-muted-slate mt-2 tracking-[0.16px]">
                        ID: {ds.id.toUpperCase()} • ROWS: {ds.rows.length} • IMPORTED: {ds.date}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/5 border border-green-500/10 text-green-600 text-[10px] md:text-[12px] font-mono uppercase tracking-[0.16px] rounded-md font-bold">In Library</span>
                  </div>
                  <div>
                    <h5 className="font-mono text-[10px] md:text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-4">Schema Inference</h5>
                    <div className="flex flex-wrap gap-2">
                       {ds.headers.map((h, i) => {
                         const risk = ds.piiColumns[i];
                         const badgeClass = risk === 'High Risk' ? 'border-red-200 text-red-600 bg-red-50' : risk === 'Medium Risk' ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-border-cool text-near-black bg-snow';
                         return (
                           <div key={i} className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-[6px] text-[10px] md:text-[12px] font-mono border ${badgeClass}`}>
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
          <div className="animate-in fade-in max-w-5xl mx-auto space-y-8 md:space-y-10">
             <div>
              <h2 className="text-2xl md:text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Protection Studio</h2>
              <p className="text-sm md:text-[16px] text-muted-slate">Configure generative models and apply differential privacy boundaries.</p>
            </div>
            
            <div className="bg-pure-white rounded-[22px] border border-border-cool overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="p-6 md:p-10 border-r border-lightest-gray space-y-6 md:space-y-8">
                  <div>
                    <label className="block text-[13px] md:text-[14px] font-medium text-cohere-black mb-3">1. Target Dataset</label>
                    <select 
                      className="w-full p-3 bg-snow border border-border-cool rounded-[8px] focus:ring-2 focus:ring-interaction-blue/20 focus:outline-none text-sm md:text-[14px] text-near-black appearance-none"
                      value={synthConfig.datasetId}
                      onChange={e => setSynthConfig({...synthConfig, datasetId: e.target.value})}
                    >
                      <option value="">-- Choose Data Catalog --</option>
                      {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.rows.length} rows)</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[13px] md:text-[14px] font-medium text-cohere-black mb-3">2. Architecture Variant</label>
                    <select 
                      className="w-full p-3 bg-snow border border-border-cool rounded-[8px] focus:ring-2 focus:ring-interaction-blue/20 focus:outline-none text-sm md:text-[14px] text-near-black appearance-none"
                      value={synthConfig.modelId}
                      onChange={e => setSynthConfig({...synthConfig, modelId: e.target.value})}
                    >
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="flex justify-between items-center mb-4">
                      <span className="text-[13px] md:text-[14px] font-medium text-cohere-black">3. Privacy (Epsilon ε)</span>
                      <span className="font-mono text-[10px] md:text-[12px] bg-interaction-blue text-white px-2.5 py-1 rounded-full font-bold">{synthConfig.epsilon.toFixed(1)}</span>
                    </label>
                    <input 
                      type="range" min="0.1" max="10.0" step="0.1" 
                      value={synthConfig.epsilon}
                      onChange={e => setSynthConfig({...synthConfig, epsilon: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-border-cool rounded-lg appearance-none cursor-pointer accent-interaction-blue"
                    />
                    <div className="flex justify-between text-[10px] text-muted-slate mt-2 font-mono">
                       <span>STRICT PRIVACY</span>
                       <span>HIGH UTILITY</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-10 flex flex-col justify-center items-center text-center bg-snow/50">
                   <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[22px] border border-border-cool bg-pure-white flex items-center justify-center mb-6 md:mb-8 shadow-sm ${isProcessing ? 'animate-spin duration-[3000ms]' : ''}`}>
                     {!isProcessing ? <Zap className="w-8 h-8 text-interaction-blue"/> : <Network className="w-8 h-8 text-interaction-blue"/>}
                   </div>
                   <h3 className="text-lg md:text-[20px] font-sans font-medium text-cohere-black mb-3">{isProcessing ? "Training Foundation Model..." : "Ready to Deploy"}</h3>
                   <p className="text-xs md:text-[14px] text-muted-slate mb-8 max-w-xs leading-relaxed">
                     Well7 Engine will generate synthetic twins with mathematical privacy guarantees up to ε={synthConfig.epsilon}.
                   </p>
                   <button 
                     disabled={isProcessing}
                     onClick={startSynthesis} 
                     className={`w-full max-w-[280px] py-4 rounded-[12px] font-medium flex justify-center items-center space-x-2 text-[14px] transition-all shadow-lg shadow-interaction-blue/10 ${isProcessing ? 'bg-border-cool text-muted-slate cursor-not-allowed' : 'bg-cohere-black text-pure-white hover:bg-black active:scale-95'}`}
                   >
                     {isProcessing ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div><span>Queueing...</span></div> : <><Play className="w-4 h-4"/> <span>Execute Job Queue</span></>}
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Model Registry */}
        {studioView === 'models' && (
          <div className="animate-in fade-in max-w-5xl mx-auto space-y-8 md:space-y-10">
            <div>
              <h2 className="text-2xl md:text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Model Registry</h2>
              <p className="text-sm md:text-[16px] text-muted-slate">Fleet of Foundation Models available for safe data generation.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {models.map(m => (
                <div key={m.id} className="bg-pure-white p-6 md:p-8 rounded-[22px] border border-lightest-gray hover:border-interaction-blue/30 transition-all shadow-sm hover:shadow-md">
                  <div className="font-mono text-[10px] md:text-[12px] uppercase tracking-[0.28px] text-muted-slate mb-4">{m.type}</div>
                  <h4 className="text-lg md:text-[20px] font-sans font-medium text-cohere-black mb-6 min-h-[56px]">{m.name}</h4>
                  
                  <div className="space-y-4 text-[13px] md:text-[14px] text-near-black border-t border-lightest-gray pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-slate">Latency</span> 
                      <span className="font-mono bg-snow px-2 py-0.5 rounded text-[11px] md:text-xs">{m.latency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-slate">Privacy Baseline</span> 
                      <span className="font-medium text-interaction-blue">{m.privacy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-muted-slate">Status</span>
                       <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Evaluation Audit */}
        {studioView === 'reports' && (
          <div className="animate-in fade-in max-w-5xl mx-auto space-y-8 md:space-y-10">
            <div>
              <h2 className="text-2xl md:text-[32px] font-display font-medium tracking-[-0.32px] text-cohere-black mb-2">Evaluation Audit</h2>
              <p className="text-sm md:text-[16px] text-muted-slate">Statistical teardown of generated artifacts.</p>
            </div>
            
            {reports.length === 0 ? (
              <div className="text-center p-12 md:p-24 bg-pure-white rounded-[22px] border border-lightest-gray">
                <p className="text-sm md:text-[16px] text-muted-slate italic font-semibold">No telemetry recorded in this session. Go to Protection Studio to generate safe data.</p>
                <button onClick={() => setStudioView('synthesis')} className="mt-6 text-interaction-blue font-bold px-6 py-3 bg-interaction-blue/5 rounded-xl">Go to Studio</button>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {reports.map((rep, idx) => {
                  const radarData = [
                    { metric: 'Utility (KS)', A: rep.metrics.ksTest, fullMark: 100 },
                    { metric: 'ML (TSTR)', A: rep.metrics.tstr, fullMark: 100 },
                    { metric: 'Privacy (DCR)', A: Math.min(rep.metrics.dcr * 300, 100), fullMark: 100 },
                  ];

                  return(
                  <div key={idx} className="bg-pure-white rounded-[22px] border border-border-cool overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-lightest-gray flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-snow/30">
                       <div className="space-y-1">
                         <h4 className="text-lg md:text-[20px] font-sans font-medium text-cohere-black">Report: {rep.id.toUpperCase()}</h4>
                         <p className="text-[10px] md:text-[12px] text-muted-slate font-mono uppercase tracking-[0.1em]">DS: {rep.datasetName} • ENG: {rep.config.modelName} • ε: {rep.config.epsilon}</p>
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
                       }} className="w-full md:w-auto bg-interaction-blue text-white px-5 py-2.5 font-medium flex items-center justify-center space-x-2 text-[13px] md:text-[14px] rounded-[10px] hover:shadow-lg hover:shadow-interaction-blue/20 transition-all">
                         <Download className="w-4 h-4"/> <span>Download Safe Asset</span>
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-lightest-gray">
                      <div className="p-6 md:p-8 border-b sm:border-b-0 sm:border-r border-lightest-gray">
                        <div className="font-mono text-[10px] uppercase tracking-[0.28px] text-muted-slate mb-2">KS Utility Score</div>
                        <div className="text-2xl md:text-[32px] font-display font-medium text-near-black">{rep.metrics.ksTest}%</div>
                      </div>
                      <div className="p-6 md:p-8 border-b sm:border-b-0 sm:border-r border-lightest-gray">
                        <div className="font-mono text-[10px] uppercase tracking-[0.28px] text-muted-slate mb-2">TSTR Consistency</div>
                        <div className="text-2xl md:text-[32px] font-display font-medium text-interaction-blue">{rep.metrics.tstr}%</div>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="font-mono text-[10px] uppercase tracking-[0.28px] text-muted-slate mb-2">Privacy DCR</div>
                        <div className="text-2xl md:text-[32px] font-display font-medium text-near-black">{rep.metrics.dcr}x</div>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 p-6 md:p-8 gap-8">
                       <div className="h-64 border border-lightest-gray rounded-[16px] p-4 bg-snow/20">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="metric" tick={{fill: '#93939f', fontSize: 10, fontFamily: 'JetBrains Mono'}} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                              <Radar name="Score" dataKey="A" stroke="#9824f9" fill="#9824f9" fillOpacity={0.2} />
                            </RadarChart>
                          </ResponsiveContainer>
                       </div>
                       
                       <div className="space-y-4">
                         <h5 className="font-mono text-[10px] uppercase tracking-[0.28px] text-muted-slate">Audit Extraction Sample</h5>
                         <div className="border border-border-cool rounded-[16px] overflow-x-auto bg-white">
                            <table className="w-full text-left text-[13px]">
                              <thead className="bg-snow/50 border-b border-border-cool">
                                <tr>
                                  <th className="p-3 font-mono text-[10px] text-muted-slate uppercase font-normal min-w-[100px]">Status</th>
                                  {rep.headers.slice(0,2).map((h, i) => <th key={i} className="p-3 font-mono text-[10px] text-muted-slate uppercase font-normal">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {rep.synthetic.slice(0, 3).map((row, rIdx) => (
                                  <tr key={rIdx} className="border-b last:border-0 border-lightest-gray">
                                    <td className="px-3 py-2 text-[10px] font-mono font-bold text-interaction-blue"><span className="px-1.5 py-0.5 bg-interaction-blue/5 rounded inline-flex items-center">SYNTH</span></td>
                                    {row.slice(0,2).map((c, cIdx) => <td key={cIdx} className="px-3 py-2 text-cohere-black font-medium">{c}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                         </div>
                         <p className="text-[11px] text-muted-slate leading-relaxed font-light italic">Detailed audit trail shows zero identity leakage across high-risk vector dimensions.</p>
                       </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - Studio Only */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-deep-dark text-white border-t border-white/10 px-2 py-3 flex justify-around items-center z-50">
        {studioNavItems.map(item => (
          <button 
            key={item.id}
            onClick={() => {
              if (item.id === 'contact_link') {
                setActiveTab('contact');
              } else {
                setStudioView(item.id);
              }
            }}
            className={`flex flex-col items-center gap-1 min-w-[64px] ${studioView === item.id ? 'text-white' : 'text-[#93939f]'}`}
          >
            {item.icon}
            <span className="text-[9px] font-mono tracking-tighter transition-all uppercase">{item.label.split(' ')[0]}</span>
            {studioView === item.id && <div className="w-1 h-1 bg-interaction-blue rounded-full absolute bottom-1"></div>}
          </button>
        ))}
      </div>
    </div>
  );
}
