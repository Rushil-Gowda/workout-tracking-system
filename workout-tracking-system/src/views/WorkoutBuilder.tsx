import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, X, Dumbbell } from 'lucide-react';
import { cn } from '../lib/utils';
import { Workout, Exercise, WorkoutSet } from '../types';

interface WorkoutBuilderProps {
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}

export default function WorkoutBuilder({ onSave, onCancel }: WorkoutBuilderProps) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Partial<Exercise>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const muscleGroupOptions = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const addExercise = () => {
    setError(null);
    setExercises([...exercises, { 
      id: Math.random().toString(), 
      name: '', 
      muscle_group: 'Chest',
      sets_data: [{ set_number: 1, reps: 0, weight: 0 }]
    }]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, field: string, value: any) => {
    setExercises(exercises.map(e => {
      if (e.id !== id) return e;
      
      if (field === 'sets_count') {
        const count = Math.max(0, parseInt(value) || 0);
        const currentSets = e.sets_data || [];
        let newSets = [...currentSets];
        
        if (count > currentSets.length) {
          const lastSet = currentSets[currentSets.length - 1] || { reps: 0, weight: 0 };
          for (let i = currentSets.length; i < count; i++) {
            newSets.push({ ...lastSet, set_number: i + 1 });
          }
        } else {
          newSets = newSets.slice(0, count);
        }
        return { ...e, sets_data: newSets };
      }

      if (field === 'reps' || field === 'weight') {
        const numValue = parseInt(value) || 0;
        const newSets = (e.sets_data || []).map(s => ({ ...s, [field]: numValue }));
        return { ...e, sets_data: newSets };
      }

      return { ...e, [field]: value };
    }));
  };

  const handleSave = () => {
    if (isSaving) return;
    console.log('Attempting to save workout:', name);
    if (!name.trim()) {
      setError('Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      setError('Please add at least one exercise to the workout');
      return;
    }
    
    const hasInvalidExercise = exercises.some(ex => !ex.name?.trim() || !ex.muscle_group);
    if (hasInvalidExercise) {
      setError('Please fill in all exercise names and muscle groups');
      return;
    }

    const hasZeroSets = exercises.some(ex => (ex.sets_data?.length || 0) <= 0);
    if (hasZeroSets) {
      setError('Each exercise must have at least one set');
      return;
    }
    
    setError(null);
    setIsSaving(true);
    // Ensure each exercise has valid data
    const formattedExercises: Exercise[] = exercises.map(ex => ({
      id: ex.id || Math.random().toString(),
      name: ex.name || 'Unnamed Exercise',
      muscle_group: ex.muscle_group || 'Chest',
      sets_data: ex.sets_data as WorkoutSet[]
    }));

    console.log('Saving workout with exercises:', formattedExercises.length);

    onSave({
      workout_id: Math.random().toString(),
      name,
      exercises: formattedExercises
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-display font-bold tracking-tight text-earth-900">Create Workout</h1>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="p-3 bg-white border border-beige-200 rounded-2xl text-earth-900/60 hover:text-earth-900 transition-all"
          >
            <X size={20} />
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-3 bg-earth-900 text-white rounded-2xl font-bold hover:bg-earth-800 transition-all shadow-lg shadow-earth-900/20",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            <Save size={20} /> {isSaving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl border border-red-100 font-bold text-sm">
            {error}
          </div>
        )}
        <div className="bg-white p-8 rounded-[2.5rem] border border-beige-200 shadow-sm">
          <label className="block text-sm font-bold uppercase tracking-widest text-earth-900/40 mb-3">Workout Name</label>
          <textarea 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Strength"
            rows={1}
            className="w-full text-3xl font-display font-bold bg-transparent border-b-2 border-beige-200 focus:border-earth-900 focus:outline-none pb-2 transition-all text-black placeholder:text-earth-900/20 resize-none overflow-hidden mb-8"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-earth-900">Exercises</h2>
            <button 
              onClick={addExercise}
              className="flex items-center gap-2 px-4 py-2 bg-beige-100 text-earth-900 rounded-full text-sm font-bold hover:bg-beige-200 transition-all"
            >
              <Plus size={16} /> Add Exercise
            </button>
          </div>

          {exercises.map((ex, index) => (
            <motion.div 
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-beige-200 shadow-sm"
            >
              <div className="flex flex-col gap-6">
                {/* Row 1: Name and Delete */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-2">Exercise Name</label>
                    <input 
                      type="text" 
                      value={ex.name}
                      onChange={(e) => updateExercise(ex.id!, 'name', e.target.value)}
                      placeholder="Bench Press"
                      className="w-full px-4 py-3 bg-beige-50 border border-beige-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-800/10 text-black font-bold"
                    />
                  </div>
                  <button 
                    onClick={() => removeExercise(ex.id!)}
                    className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all mt-6"
                    title="Remove Exercise"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                {/* Row 2: Details */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-2">Muscle Group</label>
                    <select 
                      value={ex.muscle_group}
                      onChange={(e) => updateExercise(ex.id!, 'muscle_group', e.target.value)}
                      className="w-full px-4 py-3 bg-beige-50 border border-beige-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-800/10 text-black font-bold"
                    >
                      {muscleGroupOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-2 text-center">Sets</label>
                    <input 
                      type="number" 
                      value={ex.sets_data?.length ?? 0}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateExercise(ex.id!, 'sets_count', val === "" ? 0 : Number(val));
                      }}
                      className="w-full px-3 py-3 bg-beige-50 border border-beige-200 rounded-xl focus:outline-none text-black font-bold text-center"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-2 text-center">Reps</label>
                    <input 
                      type="number" 
                      value={ex.sets_data?.[0]?.reps ?? 0}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateExercise(ex.id!, 'reps', val === "" ? 0 : Number(val));
                      }}
                      className="w-full px-3 py-3 bg-beige-50 border border-beige-200 rounded-xl focus:outline-none text-black font-bold text-center"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-earth-900/40 mb-2 text-center">Weight (KG)</label>
                    <input 
                      type="number" 
                      value={ex.sets_data?.[0]?.weight ?? 0}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateExercise(ex.id!, 'weight', val === "" ? 0 : Number(val));
                      }}
                      className="w-full px-3 py-3 bg-beige-50 border border-beige-200 rounded-xl focus:outline-none text-black font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {exercises.length === 0 && (
            <div className="text-center py-12 bg-white/50 border-2 border-dashed border-beige-200 rounded-[2.5rem]">
              <Dumbbell size={48} className="mx-auto text-beige-200 mb-4" />
              <p className="text-earth-900/40 font-medium">No exercises added yet. Start building your routine!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
