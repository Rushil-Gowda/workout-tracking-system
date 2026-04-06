import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Plus, 
  BarChart3, 
  LayoutDashboard, 
  LogOut, 
  Dumbbell,
  ChevronRight,
  Play,
  CheckCircle2,
  User as UserIcon
} from 'lucide-react';
import { cn } from './lib/utils';

// Types
import { View, User, Workout, Exercise } from './types';

// Views
import Landing from './views/Landing';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import WorkoutBuilder from './views/WorkoutBuilder';
import WorkoutSession from './views/WorkoutSession';
import Reports from './views/Reports';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [previousSession, setPreviousSession] = useState<any | null>(null);

  // Reload workouts and sessions when user changes
  useEffect(() => {
    reloadWorkouts();
    reloadSessions();
  }, [user]);

  const reloadWorkouts = () => {
    console.log("Calling backend... Fetching workouts for user:", user?.email || 'none');
    const url = user?.email 
      ? `/workouts?user_id=${user.email}` 
      : "/workouts";
      
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log("Workouts fetched:", data);
        setWorkouts(data);
      })
      .catch(err => console.error(err));
  };

  const reloadSessions = () => {
    if (!user?.email) return;
    console.log("Calling backend... Fetching sessions for user:", user.email);
    fetch(`/sessions?user_id=${user.email}`)
      .then(res => res.json())
      .then(data => {
        console.log("Sessions fetched:", data);
        setSessions(data);
      })
      .catch(err => console.error(err));
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setWorkouts([]);
    setCurrentView('landing');
  };

  const startWorkout = (workout: Workout) => {
    console.log("Starting temporary session for workout:", workout.workout_id);
    
    // Fetch last session data
    fetch(`/last-session/${workout.workout_id}/${user?.email}`)
      .then(res => res.json())
      .then(data => {
        console.log("Previous session loaded:", data);
        setPreviousSession(data);
      })
      .catch(err => console.error("Error fetching last session:", err));

    const tempSession = {
      workout_id: workout.workout_id,
      workout_name: workout.name,
      user_id: user?.email,
      datetime: new Date().toISOString(),
      exercises: workout.exercises.map(e => ({
        exercise_name: e.name,
        muscle_group: e.muscle_group,
        sets_data: JSON.parse(JSON.stringify(e.sets_data))
      }))
    };
    setActiveSession(tempSession);
    setCurrentView('session');
  };

  const handleDelete = async (id: string) => {
    console.log("Calling backend... Deleting workout:", id);

    let confirmDelete = true;
    try {
      confirmDelete = window.confirm("Are you sure you want to delete this workout?");
    } catch (e) {
      console.warn("window.confirm blocked by iframe. Proceeding with delete.");
    }
    
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/workout/${id}`, { method: "DELETE" });
      if (response.ok) {
        reloadWorkouts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderView = () => {
    console.log('Rendering view:', currentView);
    switch (currentView) {
      case 'landing':
        return <Landing onGetStarted={() => setCurrentView('auth')} />;
      case 'auth':
        return <Auth onLogin={handleLogin} />;
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            workouts={workouts} 
            sessions={sessions}
            onStartWorkout={startWorkout}
            onDeleteWorkout={handleDelete}
            onNewWorkout={() => setCurrentView('builder')}
          />
        );
      case 'builder':
        return (
          <WorkoutBuilder 
            onSave={async (workout) => {
              console.log("Creating workout...");
              console.log("Calling backend... Saving new workout:", workout.name);
              try {
                const response = await fetch('/workouts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: workout.name, user_id: user?.email }),
                });
                if (response.ok) {
                  const savedWorkout = await response.json();
                  console.log('Workout created:', savedWorkout);
                  
                  // Add exercises one by one as per requested POST /exercises route
                  for (const ex of workout.exercises) {
                    await fetch("/exercises", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        workout_id: savedWorkout.workout_id,
                        name: ex.name,
                        muscle_group: ex.muscle_group,
                        sets_data: ex.sets_data
                      })
                    });
                  }
                  
                  reloadWorkouts();
                  setCurrentView('dashboard');
                } else {
                  console.error('Failed to save workout:', response.statusText);
                }
              } catch (error) {
                console.error('Error saving workout:', error);
              }
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'session':
        return activeSession ? (
          <WorkoutSession 
            session={activeSession} 
            previousSession={previousSession}
            onComplete={async (finalSession) => {
              if (finalSession) {
                console.log("Saving session:", finalSession);
                try {
                  const response = await fetch("/sessions", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalSession),
                  });
                  if (response.ok) {
                    console.log("Session saved successfully");
                    reloadSessions();
                  }
                } catch (error) {
                  console.error('Error saving session:', error);
                }
              }
              setActiveSession(null);
              setPreviousSession(null);
              setCurrentView('dashboard');
            }}
          />
        ) : null;
      case 'reports':
        return <Reports user={user} sessions={sessions} onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Landing onGetStarted={() => setCurrentView('auth')} />;
    }
  };

  return (
    <div className="min-h-screen bg-beige-100 selection:bg-earth-800 selection:text-white">
      {/* Navigation for logged in users */}
      {user && currentView !== 'session' && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-earth-900/90 backdrop-blur-2xl px-8 py-4 rounded-[2.5rem] flex items-center gap-10 shadow-2xl shadow-earth-900/40 border border-white/10"
          >
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 relative group",
                currentView === 'dashboard' ? "bg-white text-earth-900 shadow-xl" : "text-white/40 hover:text-white"
              )}
            >
              <LayoutDashboard size={22} />
              {currentView === 'dashboard' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setCurrentView('builder')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 relative group",
                currentView === 'builder' ? "bg-white text-earth-900 shadow-xl" : "text-white/40 hover:text-white"
              )}
            >
              <Plus size={22} />
              {currentView === 'builder' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setCurrentView('reports')}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300 relative group",
                currentView === 'reports' ? "bg-white text-earth-900 shadow-xl" : "text-white/40 hover:text-white"
              )}
            >
              <BarChart3 size={22} />
              {currentView === 'reports' && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button 
              onClick={handleLogout}
              className="p-3 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
            >
              <LogOut size={22} />
            </button>
          </motion.div>
        </nav>
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="pb-40 lg:pb-40"
        >
          {renderView()}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

// Helper for cn
// import { cn } from './lib/utils';
