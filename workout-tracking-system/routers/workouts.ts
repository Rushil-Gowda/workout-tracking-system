import { Router } from 'express';
import { Workout, User, Exercise } from '../models.js';
import { CreateWorkoutSchema } from '../schemas.js';

const router = Router();

// GET /workouts (All workouts - for testing)
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.findAll({ 
      include: [{ model: Exercise }]
    });
    res.json({ workouts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// POST /workouts
router.post('/', async (req, res) => {
  try {
    const validatedData = CreateWorkoutSchema.parse(req.body);
    
    // Check user existence
    const user = await User.findByPk(validatedData.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create workout
    const workout = await Workout.create(validatedData);
    res.status(201).json({ message: 'Workout created successfully', workout_id: workout.workout_id });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create workout' });
  }
});

// GET /workouts/{user_id}
router.get('/user/:user_id', async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id);
    const workouts = await Workout.findAll({ 
      where: { user_id },
      include: [{ model: Exercise }]
    });
    
    // Synthesize sets array for frontend compatibility
    const formattedWorkouts = workouts.map(w => {
      const workout = w.toJSON();
      workout.exercises = workout.exercises.map((ex: any) => ({
        ...ex,
        sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight }))
      }));
      return workout;
    });

    res.json({ workouts: formattedWorkouts });
  } catch (error: any) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// GET /workout/{id}
router.get('/:id', async (req, res) => {
  try {
    const workout_id = parseInt(req.params.id);
    const workout = await Workout.findByPk(workout_id, {
      include: [{ model: Exercise }]
    });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    const formattedWorkout = workout.toJSON();
    formattedWorkout.exercises = formattedWorkout.exercises.map((ex: any) => ({
      ...ex,
      sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight }))
    }));

    res.json({ workout: formattedWorkout });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch workout details' });
  }
});

// PUT /workout/:id
router.put('/:id', async (req, res) => {
  try {
    const workout_id = parseInt(req.params.id);
    const workout = await Workout.findByPk(workout_id);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    await workout.update(req.body);
    res.json({ message: 'Workout updated successfully', workout });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update workout' });
  }
});

// DELETE /workout/:id
router.delete('/:id', async (req, res) => {
  try {
    const workout_id = parseInt(req.params.id);
    const workout = await Workout.findByPk(workout_id);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    await workout.destroy();
    res.json({ message: 'Workout deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

export default router;
