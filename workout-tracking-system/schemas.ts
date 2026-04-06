import { z } from 'zod';

// Auth Schemas
export const SignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0),
  password: z.string().min(6),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Workout Schemas
export const CreateWorkoutSchema = z.object({
  name: z.string().min(1),
  user_id: z.number().int(),
});

// Exercise Schemas
export const CreateExerciseSchema = z.object({
  workout_id: z.number().int(),
  name: z.string().min(1),
  muscle_group: z.string().min(1),
  sets: z.number().int().min(0),
  reps: z.number().int().min(0),
  weight: z.number().int().min(0),
});

// Session Schemas
export const StartSessionSchema = z.object({
  user_id: z.number().int(),
});

export const LogExerciseSchema = z.object({
  log_id: z.number().int(),
  exercise_id: z.number().int(),
  sets: z.number().int().min(0),
  reps: z.number().int().min(0),
  weight: z.number().int().min(0),
});
