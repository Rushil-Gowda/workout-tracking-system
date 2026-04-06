import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Dumbbell, BarChart3, LayoutDashboard, Zap } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background Parallax Effect */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2000" 
            alt="Strength Training Background"
            className="w-full h-full object-cover brightness-[0.4] blur-[1px]"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="relative z-10 max-w-5xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium tracking-wider uppercase">
              Elite Strength Tracking
            </span>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-8">
              track <br />
              <span className="text-white/40">/ your strength</span>
            </h1>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
              <button 
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-white text-earth-900 rounded-full font-semibold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Training <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <div className="flex items-center gap-4 px-6 py-3 glass rounded-full text-white/80">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <img 
                      key={i}
                      src={`https://i.pravatar.cc/100?u=${i + 10}`}
                      alt="User"
                      className="w-8 h-8 rounded-full border-2 border-earth-900"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">Join 15k+ lifters</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Stats Card (Reference Inspired) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-12 left-6 md:left-12 hidden lg:block"
        >
          <div className="glass p-6 rounded-[2.5rem] w-72 hover:scale-105 transition-transform duration-500 cursor-default">
            <p className="text-white/60 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Total Weight Lifted Today</p>
            <p className="text-white text-4xl font-display font-bold mb-4">12,500 <span className="text-xl text-white/40">KG</span></p>
            <div className="h-24 w-full bg-white/5 rounded-2xl flex items-end gap-1.5 p-3">
              {[30, 50, 40, 80, 60, 90, 75].map((h, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 1.5 + (i * 0.1), duration: 0.5 }}
                  className="flex-1 bg-white/30 rounded-full hover:bg-white/60 transition-colors"
                />
              ))}
            </div>
            <div className="flex justify-between mt-5 text-[10px] text-white/40 uppercase font-bold tracking-tighter">
              <div>Sets <br /><span className="text-white text-sm">32</span></div>
              <div>Sessions <br /><span className="text-white text-sm">2</span></div>
              <div>Volume <br /><span className="text-white text-sm">+15%</span></div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-beige-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Engineered for Strength</h2>
            <p className="text-earth-900/50 max-w-2xl mx-auto">Everything you need to push your limits and track every single rep with precision.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Dumbbell className="text-earth-800" />}
              title="Workout Tracking"
              description="Track sets, reps, and weights in real time with our intuitive interface."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-earth-800" />}
              title="Muscle Analysis"
              description="Identify your strongest and weakest muscle groups with deep data analysis."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="text-earth-800" />}
              title="Custom Plans"
              description="Create and manage workouts like Leg Day, Push Day, or specialized routines."
            />
            <FeatureCard 
              icon={<Zap className="text-earth-800" />}
              title="Progress Insights"
              description="Visualize your strength growth over time with interactive performance charts."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10, scale: 1.02 }}
      className="group p-8 rounded-[2.5rem] bg-white border border-beige-200 shadow-sm hover:shadow-2xl hover:shadow-earth-900/5 transition-all duration-500 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-earth-800/0 to-earth-800/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mb-8 text-earth-900 group-hover:bg-beige-200 group-hover:scale-110 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-display font-bold mb-4">{title}</h3>
      <p className="text-earth-900/60 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}
