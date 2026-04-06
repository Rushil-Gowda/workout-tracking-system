import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  Dumbbell, 
  ChevronLeft,
  Info,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Activity,
  Lightbulb,
  ArrowUp
} from 'lucide-react';
import { Workout, User } from '../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { cn } from '../lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportsProps {
  user: User | null;
  sessions: any[];
  onBack: () => void;
}

export default function Reports({ user, sessions, onBack }: ReportsProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [activeMetric, setActiveMetric] = useState<'Volume' | 'Weight' | 'Reps' | 'Sets'>('Volume');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | number>('');
  const [repDistributionData, setRepDistributionData] = useState<any[]>([]);

  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      fetch(`/reports/${user.email}`)
        .then(res => res.json())
        .then(data => {
          setReportData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching reports:", err);
          setLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    if (selectedSessionId) {
      fetch(`/rep-distribution/${selectedSessionId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Rep distribution data:", data);
          setRepDistributionData(data.sets);
        })
        .catch(err => console.error("Error fetching rep distribution:", err));
    }
  }, [selectedSessionId]);

  // Set initial selected session if available
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].session_id);
    }
  }, [sessions]);

  const sectionRefs = {
    overview: useRef<HTMLDivElement>(null),
    trends: useRef<HTMLDivElement>(null),
    insights: useRef<HTMLDivElement>(null),
    'Chest': useRef<HTMLDivElement>(null),
    'Back': useRef<HTMLDivElement>(null),
    'Legs': useRef<HTMLDivElement>(null),
    'Shoulders': useRef<HTMLDivElement>(null),
    'Arms': useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (section: keyof typeof sectionRefs) => {
    const element = sectionRefs[section].current;
    if (element) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const muscleData = reportData?.muscle_trends?.reduce((acc: any, trend: any) => {
    acc[trend.muscle] = {
      volume: trend.total_volume,
      trend: (trend.change_percentage >= 0 ? '+' : '') + trend.change_percentage.toFixed(0) + '%',
      insight: reportData.insights.find((i: string) => i.toLowerCase().includes(trend.muscle.toLowerCase())) || `Track your ${trend.muscle} progress over time.`,
      history: trend.history
    };
    return acc;
  }, {}) || {};

  const getMuscleTrendData = (muscle: string) => {
    const trend = reportData?.muscle_trends?.find((t: any) => t.muscle === muscle);
    if (!trend) return { labels: [], datasets: [] };

    const labels = trend.history.map((h: any) => {
      const date = new Date(h.datetime);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });
    const metricKey = activeMetric.toLowerCase();
    const data = trend.history.map((h: any) => h[metricKey]);

    return {
      labels,
      datasets: [{
        label: activeMetric,
        data,
        borderColor: '#1A1A1A',
        borderWidth: 3,
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(26, 26, 26, 0.1)');
          gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');
          return gradient;
        },
        tension: 0.4,
        pointBackgroundColor: '#1A1A1A',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#1A1A1A',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      }]
    };
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1A1A',
        padding: 12,
        cornerRadius: 12,
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { font: { weight: 'bold' as const } }
      },
      y: { 
        grid: { color: 'rgba(0,0,0,0.03)' },
        beginAtZero: true,
        ticks: { font: { weight: 'bold' as const } }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 16,
        cornerRadius: 16,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y}${activeMetric === 'Volume' || activeMetric === 'Weight' ? 'kg' : ''}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { 
          color: '#1A1A1A', 
          font: { weight: 'bold' as const, size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        }
      },
      y: { 
        grid: { color: 'rgba(0,0,0,0.03)' },
        ticks: { color: '#1A1A1A', font: { weight: 'bold' as const, size: 10 } }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-earth-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-earth-900/60 font-medium">Generating your performance report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-[160px] relative">
      <header className="mb-12 flex items-center justify-between sticky top-0 bg-beige-100/80 backdrop-blur-md z-40 py-4 -mx-6 px-6 border-b border-beige-200">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-beige-200 rounded-2xl hover:bg-beige-50 transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-earth-900">Strength Analytics</h1>
            <p className="text-earth-900/40 font-medium text-sm">Deep insights into your physical evolution</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-earth-900 text-white rounded-2xl shadow-xl shadow-earth-900/20">
          <BrainCircuit size={20} />
          <span className="text-sm font-bold">AI Insights Active</span>
        </div>
      </header>

      <div ref={sectionRefs.overview} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24 scroll-mt-24">
        {/* Muscle Overview Section */}
        <div className="lg:col-span-5 bg-white p-10 rounded-[3rem] border border-beige-200 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-10">
            <h2 className="text-2xl font-display font-bold text-earth-900">Muscle Overview</h2>
            <div className="flex bg-beige-100 p-1 rounded-2xl border border-beige-200">
              <button 
                onClick={() => setView('front')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  view === 'front' ? "bg-white text-earth-900 shadow-sm" : "text-earth-900/40 hover:text-earth-900"
                )}
              >
                Front
              </button>
              <button 
                onClick={() => setView('back')}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-bold transition-all",
                  view === 'back' ? "bg-white text-earth-900 shadow-sm" : "text-earth-900/40 hover:text-earth-900"
                )}
              >
                Back
              </button>
            </div>
          </div>
          
          <div className="relative w-full max-w-[320px] aspect-[1/1.5] mb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {view === 'front' ? (
                  <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    {/* Front View Muscular Figure - Anatomical Tracing */}
                    <g className="stroke-white/20 stroke-[0.5]">
                      {/* Head & Neck */}
                      <path d="M50 5 C55 5 60 10 60 18 C60 26 55 31 50 31 C45 31 40 26 40 18 C40 10 45 5 50 5 Z" fill="#1A1A1A" />
                      <path d="M44 28 L44 35 L56 35 L56 28 Z" fill="#1A1A1A" />
                      
                      {/* Traps (Front) */}
                      <path d="M44 32 L35 38 L40 40 L50 42 L60 40 L65 38 L56 32 Z" fill="#1A1A1A" opacity="0.6" />

                      {/* Chest (Pectorals) */}
                      <path 
                        d="M50 42 L34 44 C30 46 28 52 28 59 C28 66 38 72 50 72 L50 42 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Chest' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Chest')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Chest')}
                      />
                      <path 
                        d="M50 42 L66 44 C70 46 72 52 72 59 C72 66 62 72 50 72 L50 42 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Chest' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Chest')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Chest')}
                      />

                      {/* Abs (6-pack) */}
                      <g fill="#1A1A1A" opacity="0.4">
                        <rect x="42" y="76" width="7" height="8" rx="2" />
                        <rect x="51" y="76" width="7" height="8" rx="2" />
                        <rect x="42" y="86" width="7" height="8" rx="2" />
                        <rect x="51" y="86" width="7" height="8" rx="2" />
                        <rect x="42" y="96" width="7" height="8" rx="2" />
                        <rect x="51" y="96" width="7" height="8" rx="2" />
                      </g>

                      {/* Obliques */}
                      <path d="M28 75 L35 105 L40 105 L35 75 Z" fill="#1A1A1A" opacity="0.3" />
                      <path d="M72 75 L65 105 L60 105 L65 75 Z" fill="#1A1A1A" opacity="0.3" />

                      {/* Shoulders (Deltoids) */}
                      <path 
                        d="M32 36 C26 36 22 40 22 50 C22 58 26 62 32 60 C34 50 32 45 32 36 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Shoulders' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Shoulders')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Shoulders')}
                      />
                      <path 
                        d="M68 36 C74 36 78 40 78 50 C78 58 74 62 68 60 C66 50 68 45 68 36 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Shoulders' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Shoulders')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Shoulders')}
                      />

                      {/* Arms (Biceps & Forearms) */}
                      <path 
                        d="M22 52 C18 52 16 60 16 75 C16 85 20 90 25 85 L32 62 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Arms' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Arms')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Arms')}
                      />
                      <path 
                        d="M78 52 C82 52 84 60 84 75 C84 85 80 90 75 85 L68 62 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Arms' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Arms')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Arms')}
                      />
                      <path d="M25 88 L18 120 C18 125 22 125 26 120 L30 95 Z" fill="#1A1A1A" opacity="0.3" />
                      <path d="M75 88 L82 120 C82 125 78 125 74 120 L70 95 Z" fill="#1A1A1A" opacity="0.3" />

                      {/* Legs (Quads) */}
                      <path 
                        d="M32 105 L22 160 C22 170 35 175 42 165 L48 110 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Legs' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Legs')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Legs')}
                      />
                      <path 
                        d="M68 105 L78 160 C78 170 65 175 58 165 L52 110 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Legs' ? "fill-[url(#activeGrad)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Legs')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Legs')}
                      />
                      {/* Calves */}
                      <path d="M28 165 L24 195 C24 198 32 198 34 195 L38 168 Z" fill="#1A1A1A" opacity="0.2" />
                      <path d="M72 165 L76 195 C76 198 68 198 66 195 L62 168 Z" fill="#1A1A1A" opacity="0.2" />
                    </g>
                  </svg>
                ) : (
                  <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-2xl">
                    <defs>
                      <linearGradient id="activeGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    {/* Back View Muscular Figure - Anatomical Tracing */}
                    <g className="stroke-white/20 stroke-[0.5]">
                      {/* Head & Neck */}
                      <path d="M50 5 C55 5 60 10 60 18 C60 26 55 31 50 31 C45 31 40 26 40 18 C40 10 45 5 50 5 Z" fill="#1A1A1A" />
                      <path d="M44 28 L44 35 L56 35 L56 28 Z" fill="#1A1A1A" />
                      
                      {/* Upper Back / Traps */}
                      <path 
                        d="M50 32 L35 40 L40 55 L50 62 L60 55 L65 40 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Back' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Back')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Back')}
                      />

                      {/* Lats */}
                      <path 
                        d="M40 55 L30 85 C30 95 45 105 50 105 L50 62 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Back' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Back')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Back')}
                      />
                      <path 
                        d="M60 55 L70 85 C70 95 55 105 50 105 L50 62 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Back' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Back')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Back')}
                      />

                      {/* Lower Back (Erectors) */}
                      <path d="M45 105 L42 125 L58 125 L55 105 Z" fill="#1A1A1A" opacity="0.3" />

                      {/* Shoulders (Rear Delts) */}
                      <path 
                        d="M34 36 C28 36 24 40 24 50 C24 58 28 62 34 60 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Shoulders' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Shoulders')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Shoulders')}
                      />
                      <path 
                        d="M66 36 C72 36 76 40 76 50 C76 58 72 62 66 60 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Shoulders' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Shoulders')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Shoulders')}
                      />

                      {/* Arms (Triceps) */}
                      <path 
                        d="M24 52 C20 52 18 60 18 75 C18 85 22 90 28 85 L34 62 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Arms' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Arms')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Arms')}
                      />
                      <path 
                        d="M76 52 C80 52 82 60 82 75 C82 85 78 90 72 85 L66 62 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Arms' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Arms')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Arms')}
                      />

                      {/* Glutes */}
                      <path 
                        d="M32 95 C32 115 50 120 68 95 C68 90 50 85 32 95 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Legs' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Legs')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Legs')}
                      />

                      {/* Hamstrings */}
                      <path 
                        d="M32 115 L25 165 C25 175 40 175 45 165 L50 120 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Legs' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Legs')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Legs')}
                      />
                      <path 
                        d="M68 115 L75 165 C75 175 60 175 55 165 L50 120 Z" 
                        className={cn("transition-all duration-300 cursor-pointer", hoveredMuscle === 'Legs' ? "fill-[url(#activeGradBack)]" : "fill-[#1A1A1A]/20")}
                        onMouseEnter={() => setHoveredMuscle('Legs')}
                        onMouseLeave={() => setHoveredMuscle(null)}
                        onClick={() => scrollToSection('Legs')}
                      />
                    </g>
                  </svg>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Hover Details Overlay */}
            <AnimatePresence>
              {hoveredMuscle && muscleData[hoveredMuscle] && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-earth-900 text-white p-6 rounded-[2rem] shadow-2xl z-20 min-w-[180px] border border-white/10 pointer-events-none"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{hoveredMuscle}</p>
                  <p className="text-2xl font-display font-bold mb-3">{(muscleData as any)[hoveredMuscle].volume.toLocaleString()} KG</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                    <TrendingUp size={14} /> {(muscleData as any)[hoveredMuscle].trend}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-earth-900/40 text-sm font-medium max-w-[200px]">
            Click a muscle group to jump to detailed analysis.
          </p>
        </div>

      {/* Progress Trends Section */}
      <div ref={sectionRefs.trends} className="lg:col-span-7 space-y-6 scroll-mt-24">
        <div className="bg-white p-10 rounded-[3rem] border border-beige-200 shadow-sm">
          <h2 className="text-2xl font-display font-bold text-earth-900 mb-8">Progress Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(muscleData).map(([name, data]: [string, any]) => (
              <motion.div 
                key={name} 
                whileHover={{ scale: 1.02 }}
                onClick={() => scrollToSection(name as any)}
                className="p-6 bg-beige-50 rounded-[2rem] border border-beige-200 group hover:border-earth-900/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-1">{name}</p>
                    <p className="text-xl font-display font-bold text-earth-900">{data.volume.toLocaleString()} KG</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full",
                    data.trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {data.trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {data.trend}
                  </div>
                </div>
                <div className="h-16 w-full">
                  <Line data={getMuscleTrendData(name)} options={lineChartOptions} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Insights Section */}
        <div ref={sectionRefs.insights} className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-24">
          {reportData?.insights?.slice(0, 2).map((insight: string, idx: number) => (
            <InsightCard 
              key={idx}
              icon={idx === 0 ? <Zap className="text-yellow-600" /> : <Target className="text-blue-600" />}
              title={idx === 0 ? "Peak Performance" : "Growth Opportunity"}
              description={insight}
              highlight={idx === 0 ? "bg-yellow-50 border-yellow-100" : "bg-blue-50 border-blue-100"}
            />
          ))}
          {(!reportData?.insights || reportData.insights.length === 0) && (
            <InsightCard 
              icon={<Info className="text-earth-900" />}
              title="No Insights"
              description="Keep logging workouts to see AI-driven insights."
              highlight="bg-beige-50 border-beige-200"
            />
          )}
        </div>
      </div>
      </div>

      {/* Detailed Muscle Analysis Sections */}
      <div className="space-y-32">
        {Object.entries(muscleData).map(([name, data]: [string, any]) => (
          <motion.section 
            key={name}
            ref={sectionRefs[name as keyof typeof sectionRefs]}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="scroll-mt-32"
          >
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-earth-900 flex items-center justify-center text-white">
                    <Dumbbell size={24} />
                  </div>
                  <h2 className="text-4xl font-display font-bold text-earth-900">{name} Analysis</h2>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-earth-900/40 text-xs font-bold uppercase tracking-widest mb-1">Total Volume</p>
                    <p className="text-2xl font-display font-bold text-earth-900">{data.volume.toLocaleString()} KG</p>
                  </div>
                  <div className="w-px h-10 bg-beige-200" />
                  <div>
                    <p className="text-earth-900/40 text-xs font-bold uppercase tracking-widest mb-1">Weekly Trend</p>
                    <p className={cn(
                      "text-2xl font-display font-bold",
                      data.trend.startsWith('+') ? "text-green-600" : "text-red-600"
                    )}>{data.trend}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => scrollToSection('overview')}
                className="text-sm font-bold text-earth-900/40 hover:text-earth-900 transition-colors flex items-center gap-2"
              >
                Back to Overview <ArrowUp size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-beige-200 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-display font-bold text-earth-900">{activeMetric} Evolution</h3>
                  <div className="flex items-center gap-4">
                    <select 
                      value={activeMetric}
                      onChange={(e) => setActiveMetric(e.target.value as any)}
                      className="bg-beige-100 border border-beige-200 rounded-xl px-4 py-2 text-sm font-bold text-earth-900 focus:outline-none focus:ring-2 focus:ring-earth-900/20 transition-all"
                    >
                      <option value="Volume">Volume</option>
                      <option value="Weight">Weight</option>
                      <option value="Reps">Reps</option>
                      <option value="Sets">Sets</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-earth-900" />
                      <span className="text-xs font-bold text-earth-900/60">Current</span>
                    </div>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <Line data={getMuscleTrendData(name)} options={lineChartOptions} />
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-beige-200 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-display font-bold text-earth-900">Rep Distribution</h3>
                  <select 
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="bg-beige-100 border border-beige-200 rounded-xl px-4 py-2 text-xs font-bold text-earth-900 focus:outline-none focus:ring-2 focus:ring-earth-900/20 transition-all max-w-[150px]"
                  >
                    {sessions.map(s => (
                      <option key={s.session_id} value={s.session_id}>
                        {s.workout_name || 'Session'} - {new Date(s.datetime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="h-80 w-full">
                  <Bar 
                    data={{
                      labels: repDistributionData && repDistributionData.length > 0 ? repDistributionData.map(s => `Set ${s.set_number}`) : ['No Data'],
                      datasets: [{
                        label: 'Reps',
                        data: repDistributionData && repDistributionData.length > 0 ? repDistributionData.map(s => s.reps) : [0],
                        backgroundColor: '#1A1A1A',
                        borderRadius: 8,
                        hoverBackgroundColor: '#333',
                      }]
                    }} 
                    options={barChartOptions} 
                  />
                </div>
              </div>

              <div className="lg:col-span-3 bg-earth-900 text-white p-10 rounded-[3rem] shadow-xl flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <BrainCircuit size={32} className="text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-display font-bold mb-2">AI Insight</h4>
                  <p className="text-white/60 leading-relaxed font-medium">{data.insight}</p>
                </div>
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* Global Summary */}
      <section ref={sectionRefs.insights} className="mt-32 bg-white p-12 rounded-[4rem] border border-beige-200 shadow-sm text-center scroll-mt-24">
        <h2 className="text-4xl font-display font-bold text-earth-900 mb-4">Global Summary</h2>
        <p className="text-earth-900/40 font-medium mb-12 max-w-2xl mx-auto">
          Based on your last 30 days of training, here is your overall physical balance report.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SummaryCard 
            label="Strongest Group"
            value={reportData?.strongest_muscle || "N/A"}
            sub={`${(reportData?.volume_by_muscle_group?.find((m: any) => m.muscle === reportData.strongest_muscle)?.volume || 0).toLocaleString()} KG Volume`}
            color="text-green-600"
          />
          <SummaryCard 
            label="Weakest Group"
            value={reportData?.weakest_muscle || "N/A"}
            sub={`${(reportData?.volume_by_muscle_group?.find((m: any) => m.muscle === reportData.weakest_muscle)?.volume || 0).toLocaleString()} KG Volume`}
            color="text-red-600"
          />
          <SummaryCard 
            label="Total Volume"
            value={`${(reportData?.total_volume || 0).toLocaleString()} KG`}
            sub={`${reportData?.total_workouts || 0} Workouts Logged`}
            color="text-blue-600"
          />
        </div>
      </section>
    </div>
  );
}

function InsightCard({ icon, title, description, highlight }: { icon: React.ReactNode, title: string, description: string, highlight: string, key?: any }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("p-8 rounded-[2.5rem] border flex gap-6 items-start transition-all", highlight)}
    >
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-display font-bold text-earth-900 mb-2">{title}</h3>
        <p className="text-earth-900/60 text-sm leading-relaxed font-medium">{description}</p>
      </div>
    </motion.div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) {
  return (
    <div className="p-8 bg-beige-50 rounded-[3rem] border border-beige-200">
      <p className="text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-2">{label}</p>
      <h3 className={cn("text-3xl font-display font-bold mb-2", color)}>{value}</h3>
      <p className="text-earth-900/60 text-sm font-medium">{sub}</p>
    </div>
  );
}
