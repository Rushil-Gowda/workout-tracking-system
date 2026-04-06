export type WorkoutSet = {
  set_number?: number;
  reps: number;
  weight: number;
};

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string;
  sets_data: WorkoutSet[];
};

export type Workout = {
  workout_id: string | number;
  user_id?: string;
  name: string;
  exercises: Exercise[];
};

export type Session = {
  session_id: string | number;
  workout_id: string | number;
  workout_name?: string;
  user_id: string;
  datetime: string;
  exercises: {
    exercise_name: string;
    muscle_group: string;
    sets_data: WorkoutSet[];
  }[];
};

export type User = {
  user_id?: string;
  name: string;
  email: string;
  age?: number;
};

export type View = 'landing' | 'auth' | 'dashboard' | 'builder' | 'session' | 'reports';
