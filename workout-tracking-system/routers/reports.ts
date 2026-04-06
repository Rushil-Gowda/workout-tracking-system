import { Router } from 'express';
import { ExerciseLog, WorkoutLog, Exercise } from '../models.js';
import sequelize from '../database.js';
import { Op } from 'sequelize';

const router = Router();

// GET /reports/volume/{user_id}
router.get('/reports/volume/:user_id', async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id);
    
    // Calculate total volume over time
    // volume = sets * reps * weight
    const logs = await WorkoutLog.findAll({
      where: { user_id },
      include: [{
        model: ExerciseLog,
        attributes: [
          [sequelize.literal('sets * reps * weight'), 'volume']
        ]
      }]
    });

    const volume_over_time = logs.map(log => {
      const totalVolume = (log as any).exercise_logs.reduce((acc: number, curr: any) => acc + curr.get('volume'), 0);
      return { date: log.date, volume: totalVolume };
    });

    res.json({ volume_over_time });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch volume report' });
  }
});

// GET /reports/muscle-groups/{user_id}
router.get('/reports/muscle-groups/:user_id', async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id);
    
    // Calculate total volume grouped by muscle_group
    const results = await ExerciseLog.findAll({
      include: [
        {
          model: WorkoutLog,
          where: { user_id },
          attributes: []
        },
        {
          model: Exercise,
          attributes: ['muscle_group']
        }
      ],
      attributes: [
        [sequelize.col('exercise.muscle_group'), 'muscle_group'],
        [sequelize.fn('SUM', sequelize.literal('exercise_log.sets * exercise_log.reps * exercise_log.weight')), 'total_volume']
      ],
      group: ['exercise.muscle_group'],
      raw: true
    });

    res.json({ volume_by_muscle_group: results });
  } catch (error: any) {
    console.error('Muscle group report error:', error);
    res.status(500).json({ error: 'Failed to fetch muscle group report' });
  }
});

// GET /reports/weekly/{user_id}
router.get('/reports/weekly/:user_id', async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const logs = await WorkoutLog.findAll({
      where: {
        user_id,
        date: { [Op.gte]: oneWeekAgo }
      },
      include: [{
        model: ExerciseLog,
        attributes: [
          [sequelize.literal('sets * reps * weight'), 'volume']
        ]
      }]
    });

    const weekly_volume = logs.map(log => {
      const totalVolume = (log as any).exercise_logs.reduce((acc: number, curr: any) => acc + curr.get('volume'), 0);
      return { date: log.date, volume: totalVolume, week: 1 }; // Simplified week for now
    });

    res.json({ weekly_volume });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch weekly trends' });
  }
});

export default router;
