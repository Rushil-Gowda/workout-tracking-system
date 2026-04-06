import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, ChevronLeft, Timer, Trophy, X, ArrowUpRight, ArrowDownRight, Minus, Dumbbell, Plus } from 'lucide-react';
import { Workout, Exercise, WorkoutSet, Session } from '../types';
import { cn } from '../lib/utils';

const getPercentageChange = (current: number, previous: number) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

interface WorkoutSessionProps {
  session: Session;
  previousSession?: Session | null;
  onComplete: (updatedSession?: Session) => void;
}

export default function WorkoutSession({ session, previousSession, onComplete }: WorkoutSessionProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [activeSession, setActiveSession] = useState<Session>({ ...session });
  const [completedSets, setCompletedSets] = useState<Record<number, boolean[]>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Pre-fill logic
  useEffect(() => {
    console.log("Previous session:", previousSession);
    if (previousSession && previousSession.exercises) {
      console.log("Pre-filling session with previous data");
      setActiveSession(prev => {
        const updatedExercises = prev.exercises.map(ex => {
          const prevEx = previousSession.exercises.find(pe => pe.exercise_name === ex.exercise_name);
          if (prevEx && prevEx.sets_data && prevEx.sets_data.length > 0) {
            return {
              ...ex,
              sets_data: prevEx.sets_data.map((ps, sIdx) => ({
                set_number: sIdx + 1,
                reps: ps.reps,
                weight: ps.weight
              }))
            };
          }
          return ex;
        });
        const newState = { ...prev, exercises: updatedExercises };
        console.log("Current session initialized:", newState);
        return newState;
      });
    }
  }, [previousSession]);

  // Stopwatch logic
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = activeSession.exercises[currentExerciseIndex];
  const totalSets = activeSession.exercises.reduce((acc, ex) => acc + (ex.sets_data?.length || 0), 0);
  const completedSetsCount = Object.values(completedSets).flat().filter(Boolean).length;
  const overallProgress = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;

  const getPercentageChange = (current: number, original: number) => {
    if (!original || original === 0) return null;
    const change = ((current - original) / original) * 100;
    if (Math.abs(change) < 0.1) return null;
    return change;
  };

  const ChangeIndicator = ({ change }: { change: number | null }) => {
    if (change === null) return null;
    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? "text-green-500" : "text-red-500";
    
    return (
      <div className={cn("absolute -right-3 -top-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-beige-200 shadow-md text-[11px] font-black z-10", colorClass)}>
        <Icon size={11} strokeWidth={3} />
        {Math.abs(change).toFixed(0)}%
      </div>
    );
  };

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    const ex = activeSession.exercises[exerciseIndex];
    if (!ex) return;
    const exerciseSets = completedSets[exerciseIndex] || new Array(ex.sets_data?.length || 0).fill(false);
    const newSets = [...exerciseSets];
    newSets[setIndex] = !newSets[setIndex];
    setCompletedSets({ ...completedSets, [exerciseIndex]: newSets });
  };

  const addSet = (exerciseIndex: number) => {
    setActiveSession(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) => 
        idx === exerciseIndex 
          ? { ...ex, sets_data: [...(ex.sets_data || []), { set_number: (ex.sets_data?.length || 0) + 1, reps: 0, weight: 0 }] }
          : ex
      )
    }));
    
    // Also update completedSets to include the new set (as false)
    setCompletedSets(prev => {
      const current = prev[exerciseIndex] || [];
      return { ...prev, [exerciseIndex]: [...current, false] };
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: number) => {
    setActiveSession(prev => {
      const updatedExercises = prev.exercises.map((ex, idx) => {
        if (idx === exerciseIndex) {
          const updatedSets = ex.sets_data.map((s, sIdx) => {
            if (sIdx === setIndex) {
              const current = value;
              const prevEx = previousSession?.exercises.find(pe => pe.exercise_name === ex.exercise_name);
              const previous = prevEx?.sets_data[setIndex]?.[field] as number || 0;
              console.log(`Current vs Previous for ${field}:`, current, previous);
              return { ...s, [field]: value };
            }
            return s;
          });
          return { ...ex, sets_data: updatedSets };
        }
        return ex;
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  if (!session.exercises || session.exercises.length === 0) {
    return <p>No exercises added</p>;
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-earth-900 text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Trophy size={48} className="text-yellow-400" />
          </div>
          <h2 className="text-5xl font-display font-bold mb-4">Workout Complete!</h2>
          <p className="text-white/60 mb-4 text-lg">You crushed your session.</p>
          <div className="bg-white/5 p-6 rounded-3xl mb-10 border border-white/10">
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Duration</p>
                <p className="text-2xl font-bold font-mono">{formatTime(seconds)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Exercises</p>
                <p className="text-2xl font-bold font-mono">{session.exercises.length}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onComplete(activeSession)}
            className="w-full py-4 bg-white text-earth-900 rounded-2xl font-bold text-xl hover:scale-105 transition-all active:scale-95"
          >
            Finish Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-50 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white border-b border-beige-200 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => onComplete()} className="p-2 hover:bg-beige-100 rounded-full transition-all">
            <X size={20} />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg">Workout Session</h1>
            <p className="text-[10px] text-earth-900/40 font-bold uppercase tracking-widest">Session in progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-beige-100 rounded-full">
          <Timer size={16} className="text-earth-900/60" />
          <span className="text-sm font-mono font-bold">{formatTime(seconds)}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-beige-200">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          className="h-full bg-earth-900"
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        {/* Exercise Selection Sidebar */}
        <aside className="w-full md:w-80 bg-white border-r border-beige-200 p-6 overflow-y-auto max-h-[300px] md:max-h-full">
          <p className="text-[10px] font-bold text-earth-900/40 uppercase tracking-widest mb-6">Exercises</p>
          <div className="space-y-2">
            {activeSession.exercises.map((ex, idx) => {
              const isCompleted = completedSets[idx]?.every(Boolean) && completedSets[idx]?.length === ex.sets_data?.length;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentExerciseIndex(idx)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between group",
                    currentExerciseIndex === idx 
                      ? "bg-earth-900 text-white shadow-lg shadow-earth-900/20" 
                      : "hover:bg-beige-50 text-earth-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border",
                      currentExerciseIndex === idx ? "border-white/20 bg-white/10" : "border-beige-200 bg-beige-50"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm truncate max-w-[140px]">{ex.exercise_name}</span>
                  </div>
                  {isCompleted && <CheckCircle2 size={16} className={currentExerciseIndex === idx ? "text-white" : "text-green-500"} />}
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => setIsFinished(true)}
            className="w-full mt-8 py-4 bg-earth-900 text-white rounded-2xl font-bold text-sm hover:bg-earth-800 transition-all flex items-center justify-center gap-2"
          >
            Finish Workout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExerciseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-12">
                <h2 className="text-5xl md:text-6xl font-display font-bold tracking-tight mb-4">{currentExercise.exercise_name}</h2>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 bg-beige-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-earth-900/60">
                    {currentExercise.muscle_group}
                  </span>
                  <span className="px-4 py-1.5 bg-beige-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-earth-900/60">
                    {currentExercise.sets_data?.length || 0} Sets
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Header for sets */}
                <div className="grid grid-cols-12 gap-4 px-6 text-[10px] font-bold text-earth-900/30 uppercase tracking-widest">
                  <div className="col-span-1">Set</div>
                  <div className="col-span-4 text-center">Weight (KG)</div>
                  <div className="col-span-4 text-center">Reps</div>
                  <div className="col-span-3 text-right">Done</div>
                </div>

                {currentExercise.sets_data?.map((set, i) => {
                  const isDone = completedSets[currentExerciseIndex]?.[i];
                  
                  return (
                    <motion.div
                      key={i}
                      className={cn(
                        "grid grid-cols-12 gap-4 items-center p-6 rounded-[2rem] border-2 transition-all",
                        isDone ? "bg-white border-earth-900 shadow-lg shadow-earth-900/5" : "bg-white border-beige-200"
                      )}
                    >
                      <div className="col-span-1 font-display font-bold text-xl">{i + 1}</div>
                      
                      <div className="col-span-4 relative">
                        <input 
                          type="number" 
                          value={set.weight}
                          onChange={(e) => updateSet(currentExerciseIndex, i, 'weight', parseInt(e.target.value) || 0)}
                          className="w-full bg-beige-50 border border-beige-200 rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-earth-900/10 text-black"
                        />
                        {previousSession && (
                          <div className="absolute -top-6 left-0 w-full flex justify-center">
                            {(() => {
                              const prevEx = previousSession.exercises.find(pe => pe.exercise_name === currentExercise.exercise_name);
                              const prevWeight = prevEx?.sets_data[i]?.weight || 0;
                              const change = getPercentageChange(set.weight, prevWeight);
                              if (change === null) return null;
                              return (
                                <span className={cn(
                                  "text-[10px] font-black",
                                  change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-earth-900/40"
                                )}>
                                  {change > 0 ? '+' : ''}{change.toFixed(0)}%
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="col-span-4 relative">
                        <input 
                          type="number" 
                          value={set.reps}
                          onChange={(e) => updateSet(currentExerciseIndex, i, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full bg-beige-50 border border-beige-200 rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-earth-900/10 text-black"
                        />
                        {previousSession && (
                          <div className="absolute -top-6 left-0 w-full flex justify-center">
                            {(() => {
                              const prevEx = previousSession.exercises.find(pe => pe.exercise_name === currentExercise.exercise_name);
                              const prevReps = prevEx?.sets_data[i]?.reps || 0;
                              const change = getPercentageChange(set.reps, prevReps);
                              if (change === null) return null;
                              return (
                                <span className={cn(
                                  "text-[10px] font-black",
                                  change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-earth-900/40"
                                )}>
                                  {change > 0 ? '+' : ''}{change.toFixed(0)}%
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <button
                          onClick={() => toggleSet(currentExerciseIndex, i)}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                            isDone ? "bg-earth-900 text-white" : "bg-beige-100 text-earth-900/20 hover:text-earth-900/40"
                          )}
                        >
                          <CheckCircle2 size={24} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                <button 
                  onClick={() => addSet(currentExerciseIndex)}
                  className="w-full py-4 border-2 border-dashed border-beige-200 rounded-[2rem] text-earth-900/40 font-bold text-sm hover:border-earth-900/20 hover:text-earth-900/60 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add Set
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
