import { Router } from 'express';
import { Exercise, Workout, WorkoutLog, ExerciseLog } from '../models.js';
import { CreateExerciseSchema, StartSessionSchema, LogExerciseSchema } from '../schemas.js';

const router = Router();

// POST /exercises
router.post('/exercises', async (req, res) => {
  try {
    const validatedData = CreateExerciseSchema.parse(req.body);
    
    // Check workout existence
    const workout = await Workout.findByPk(validatedData.workout_id);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Create exercise
    const exercise = await Exercise.create(validatedData);
    res.status(201).json({ message: 'Exercise added successfully', exercise_id: exercise.exercise_id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to add exercise' });
  }
});

// GET /workout/{id}/exercises
router.get('/workout/:id/exercises', async (req, res) => {
  try {
    const workout_id = parseInt(req.params.id);
    const exercises = await Exercise.findAll({ where: { workout_id } });
    res.json({ exercises });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// POST /start-session
router.post('/start-session', async (req, res) => {
  try {
    const validatedData = StartSessionSchema.parse(req.body);
    const log = await WorkoutLog.create({ user_id: validatedData.user_id });
    res.status(201).json({ message: 'Session started', log_id: log.log_id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to start session' });
  }
});

// POST /log-exercise
router.post('/log-exercise', async (req, res) => {
  try {
    const validatedData = LogExerciseSchema.parse(req.body);
    
    // Check existence
    const log = await WorkoutLog.findByPk(validatedData.log_id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    
    const exercise = await Exercise.findByPk(validatedData.exercise_id);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    // Log exercise
    const exerciseLog = await ExerciseLog.create(validatedData);
    res.status(201).json({ message: 'Exercise logged', id: exerciseLog.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to log exercise' });
  }
});

// POST /end-session
router.post('/end-session', async (req, res) => {
  res.json({ message: 'Workout session finalized' });
});

export default router;
