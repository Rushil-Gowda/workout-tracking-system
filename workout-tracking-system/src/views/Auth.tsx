import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, Activity } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isLogin) {
      if (!name || !age || !password) {
        setError('Please fill in all fields');
        return;
      }
      if (isNaN(Number(age))) {
        setError('Age must be a number');
        return;
      }

      try {
        console.log("Calling API: POST /signup");
        const response = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, age: Number(age), password }),
        });

        const data = await response.json();
        console.log("Received data:", data);
        if (response.ok) {
          onLogin({ user_id: data.user_id, name, email });
        } else {
          setError(data.error || 'Signup failed');
        }
      } catch (err) {
        console.error("API ERROR:", err);
        setError('An error occurred during signup');
      }
    } else {
      try {
        console.log("Calling API: POST /login");
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log("Received data:", data);
        if (response.ok) {
          onLogin({ user_id: data.user_id, email, name: data.name || 'User' });
        } else {
          setError(data.error || 'Login failed');
        }
      } catch (err) {
        console.error("API ERROR:", err);
        setError('An error occurred during login');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-beige-100">
      {/* Left Side: Image Content */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-earth-900">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Using a more relevant "UI/Dashboard" themed image */}
          <img 
            src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200" 
            alt="Dashboard Mockup"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-earth-900/80 via-earth-900/40 to-transparent backdrop-blur-[1px]" />
        </motion.div>
        
        <div className="relative z-10 flex flex-col justify-center p-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="w-16 h-1 bg-white/30 mb-8 rounded-full" />
            <h2 className="text-7xl font-display font-bold mb-8 leading-[1.1] tracking-tighter">
              The future of <br />
              <span className="text-white/40">strength tracking.</span>
            </h2>
            <p className="text-white/60 text-xl max-w-md leading-relaxed font-medium">
              Experience a premium, data-driven approach to your fitness journey. Minimal design, maximum results.
            </p>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-earth-900 bg-beige-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i+20}`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Joined by 15k+ athletes</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-beige-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-earth-800/5 rounded-full blur-3xl md:hidden" />
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/40 backdrop-blur-2xl p-10 md:p-14 rounded-[3.5rem] shadow-2xl shadow-earth-900/5 border border-white/60">
            <div className="mb-12">
              <h2 className="text-4xl font-display font-bold tracking-tight mb-4 text-earth-900">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-earth-900/40 font-bold text-xs uppercase tracking-widest">
                {isLogin ? 'Sign in to continue' : 'Start your journey today'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-900/40 ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-earth-900/20 group-focus-within:text-earth-900 transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full pl-14 pr-6 py-4 bg-white/50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-earth-800/10 focus:bg-white transition-all duration-300 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-900/40 ml-1">Age</label>
                    <div className="relative group">
                      <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-earth-900/20 group-focus-within:text-earth-900 transition-colors" size={18} />
                      <input 
                        type="number" 
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="25"
                        className="w-full pl-14 pr-6 py-4 bg-white/50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-earth-800/10 focus:bg-white transition-all duration-300 font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-900/40 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-earth-900/20 group-focus-within:text-earth-900 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-14 pr-6 py-4 bg-white/50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-earth-800/10 focus:bg-white transition-all duration-300 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-900/40 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-earth-900/20 group-focus-within:text-earth-900 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-white/50 border border-beige-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-earth-800/10 focus:bg-white transition-all duration-300 font-medium"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-earth-900 text-white rounded-2xl font-bold text-lg mt-6 hover:bg-earth-800 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-earth-900/20"
              >
                {isLogin ? 'Sign In' : 'Get Started'}
                <ArrowRight size={20} />
              </button>
            </form>

            <div className="mt-12 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-bold text-earth-900/40 hover:text-earth-900 transition-colors uppercase tracking-[0.2em]"
              >
                {isLogin ? "New to Momento? Sign up" : "Already a member? Sign in"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
