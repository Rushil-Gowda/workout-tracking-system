import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Dumbbell, Target, Timer, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { User, Workout } from '../types';
import { cn } from '../lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardProps {
  user: User | null;
  workouts: Workout[];
  sessions: any[];
  onStartWorkout: (workout: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  onNewWorkout: () => void;
}

export default function Dashboard({ user, workouts, sessions, onStartWorkout, onDeleteWorkout, onNewWorkout }: DashboardProps) {
  const [volumeData, setVolumeData] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchReports = async () => {
      const userId = user?.user_id || user?.email;
      if (!userId) return;
      console.log("Calling API: GET /reports/" + userId);
      try {
        const response = await fetch(`/reports/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Raw datetime from backend:", data.volume_over_time);
          setVolumeData(data.volume_over_time || []);
        } else {
          console.error("API ERROR:", response.statusText);
        }
      } catch (error) {
        console.error('API ERROR:', error);
      }
    };
    fetchReports();
  }, [user]);

  const chartData = {
    labels: volumeData.length > 0 
      ? volumeData.map(d => new Date(d.datetime).toLocaleString([], { month: 'short', day: 'numeric' })) 
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Volume (KG)',
        data: volumeData.length > 0 ? volumeData.map(d => d.volume) : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(26, 26, 26, 0.1)');
          gradient.addColorStop(1, 'rgba(26, 26, 26, 0)');
          return gradient;
        },
        borderColor: '#1A1A1A',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1A1A1A',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: volumeData.length === 1 ? 6 : 4,
        pointHoverRadius: 6,
        pointHitRadius: 10,
      },
    ],
  };

  const totalVolume = volumeData.reduce((acc, d) => acc + d.volume, 0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Inter', size: 14, weight: 'bold' as const },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y.toLocaleString()} KG`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11,
            weight: 'bold' as const,
          },
          color: '#1A1A1A',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.03)',
        },
        ticks: {
          display: false
        }
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-earth-900 flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name.charAt(0)}
            </div>
            <h1 className="text-5xl font-display font-bold tracking-tight">
              Hello, {user?.name.split(' ')[0]}
            </h1>
          </div>
          <p className="text-earth-900/50 text-lg font-medium">You've moved <span className="text-earth-800 font-bold">{totalVolume.toLocaleString()} KG</span> this week. Elite performance.</p>
        </motion.div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<Dumbbell className="text-earth-800" />} label="Total Weight" value={totalVolume.toLocaleString()} unit="kg" />
        <StatCard icon={<Target className="text-earth-800" />} label="Sessions Logged" value={sessions.length.toString()} unit="sessions" />
        <StatCard icon={<Timer className="text-earth-800" />} label="Total Time" value="--" unit="hours" />
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-beige-200 shadow-sm mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold">Strength Progress</h2>
            <p className="text-earth-900/40 text-sm font-medium">Daily volume tracking</p>
          </div>
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-1.5 rounded-full text-xs font-bold border border-green-100">
            <TrendingUp size={14} /> +15% vs last week
          </div>
        </div>
        <div className="h-64 w-full">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Workouts Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold">Your Routines</h2>
          <button 
            onClick={onNewWorkout}
            className="flex items-center gap-2 px-6 py-3 bg-earth-900 text-white rounded-2xl text-sm font-bold hover:bg-earth-800 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-earth-900/10"
          >
            <Plus size={18} /> New Workout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workouts.map((workout, index) => (
            <motion.div
              key={workout.workout_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-white p-8 rounded-[2.5rem] border border-beige-200 shadow-sm hover:shadow-2xl hover:shadow-earth-900/5 transition-all duration-300 relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center text-earth-900 group-hover:bg-beige-200 transition-all duration-300">
                  <Dumbbell size={24} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWorkout(String(workout.workout_id));
                    }}
                    className="p-2 text-earth-900/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-earth-900/40 block mb-1">
                      {workout.exercises.length} Exercises
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-earth-900/40 bg-beige-100 px-3 py-1 rounded-full">
                      Strength
                    </span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-display font-bold mb-3">{workout.name}</h3>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {Array.from(new Set(workout.exercises.map(ex => ex.muscle_group))).map(mg => (
                  <span key={mg} className="text-[10px] font-bold px-3 py-1.5 bg-beige-50 border border-beige-200 rounded-lg text-earth-900/60">
                    {mg}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => onStartWorkout(workout)}
                className="w-full py-4 bg-beige-100 text-earth-900 rounded-2xl font-bold text-sm hover:bg-earth-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Session <ChevronRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-20 bg-white/50 border-2 border-dashed border-beige-200 rounded-[3rem]">
            <Dumbbell size={48} className="mx-auto text-beige-200 mb-4" />
            <p className="text-earth-900/40 font-bold text-lg">No workouts yet</p>
            <p className="text-earth-900/30 text-sm mb-8">Start by creating your first routine!</p>
            <button 
              onClick={onNewWorkout}
              className="px-8 py-4 bg-earth-900 text-white rounded-2xl font-bold hover:scale-105 transition-all active:scale-95 shadow-xl shadow-earth-900/20"
            >
              Create First Workout
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string, unit: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-beige-200 shadow-sm flex items-center gap-8 hover:border-earth-900/20 hover:scale-[1.02] transition-all duration-300 group">
      <div className="w-16 h-16 rounded-2xl bg-beige-50 flex items-center justify-center text-2xl group-hover:bg-beige-100 transition-colors duration-300">
        {icon}
      </div>
      <div>
        <p className="text-earth-900/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-display font-bold">{value}</span>
          <span className="text-earth-900/30 text-sm font-bold uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
}
