const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Helper for week number
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

// Mock database
let workouts = [
  { 
    workout_id: 1, 
    name: "Leg Day", 
    user_id: "rushilgowdah@gmail.com",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: "10:30:00",
    exercises: [
      {
        id: "ex1",
        name: "Squats",
        muscle_group: "Legs",
        sets_data: [
          { set_number: 1, reps: 10, weight: 100 },
          { set_number: 2, reps: 10, weight: 100 },
          { set_number: 3, reps: 10, weight: 100 }
        ]
      }
    ] 
  },
  { 
    workout_id: 2, 
    name: "Push Day", 
    user_id: "rushilgowdah@gmail.com",
    date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    time: "14:15:00",
    exercises: [
      {
        id: "ex2",
        name: "Bench Press",
        muscle_group: "Chest",
        sets_data: [
          { set_number: 1, reps: 12, weight: 60 },
          { set_number: 2, reps: 10, weight: 70 },
          { set_number: 3, reps: 8, weight: 80 }
        ]
      }
    ] 
  }
];

app.get("/", (req, res) => {
  res.send("Backend is working");
});

app.get("/workouts", (req, res) => {
  const { user_id } = req.query;
  let filteredWorkouts = workouts;
  
  if (user_id) {
    filteredWorkouts = workouts.filter(w => w.user_id === user_id);
    console.log(`Fetching workouts for user: ${user_id}`);
  } else {
    console.log('Fetching all workouts');
  }
  
  res.json(filteredWorkouts);
});

// 2. CREATE WORKOUT
app.post("/workouts", (req, res) => {
  const { name, user_id } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const now = new Date();
  const newWorkout = {
    workout_id: workouts.length > 0 ? Math.max(...workouts.map(w => w.workout_id)) + 1 : 1,
    name,
    user_id,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    exercises: []
  };
  workouts.push(newWorkout);
  console.log(`Workout created: ${name} (ID: ${newWorkout.workout_id}) for user: ${user_id} at ${newWorkout.time}`);
  res.status(201).json(newWorkout);
});

// 3. ADD EXERCISE TO WORKOUT
app.post("/exercises", (req, res) => {
  const { workout_id, name, muscle_group, sets, reps, weight, sets_data } = req.body;

  const workout = workouts.find(w => w.workout_id === Number(workout_id));
  if (!workout) {
    return res.status(404).json({ error: "Workout not found" });
  }

  let finalSetsData = [];
  if (sets_data && Array.isArray(sets_data)) {
    finalSetsData = sets_data.map((s, idx) => ({
      set_number: s.set_number || idx + 1,
      reps: Number(s.reps) || 0,
      weight: Number(s.weight) || 0
    }));
  } else {
    // Fallback to old structure
    finalSetsData = Array.from({ length: Number(sets) || 1 }, (_, idx) => ({ 
      set_number: idx + 1,
      reps: Number(reps) || 0, 
      weight: Number(weight) || 0 
    }));
  }

  const newExercise = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    muscle_group,
    sets_data: finalSetsData
  };

  workout.exercises.push(newExercise);
  console.log(`Exercise added: ${name} to Workout ID: ${workout_id}`);
  res.status(201).json(newExercise);
});

// 4. GET SINGLE WORKOUT / SESSION
app.get("/session/:workout_id", (req, res) => {
  const { workout_id } = req.params;
  const workout = workouts.find(w => w.workout_id === Number(workout_id));
  if (!workout) return res.status(404).json({ error: "Workout not found" });
  
  console.log(`Fetching session ID: ${workout_id}`);
  res.json({
    workout_id: workout.workout_id,
    name: workout.name,
    date: workout.date,
    time: workout.time,
    exercises: workout.exercises.map(e => ({
      exercise_name: e.name,
      muscle_group: e.muscle_group,
      sets_data: e.sets_data
    }))
  });
});

// REP DISTRIBUTION API
app.get("/rep-distribution/:workout_id", (req, res) => {
  const { workout_id } = req.params;
  const workout = workouts.find(w => w.workout_id === Number(workout_id));
  if (!workout) return res.status(404).json({ error: "Workout not found" });

  const allSets = [];
  workout.exercises.forEach(e => {
    e.sets_data.forEach(s => {
      allSets.push({
        set_number: s.set_number,
        reps: s.reps
      });
    });
  });

  const setGroups = {};
  allSets.forEach(s => {
    if (!setGroups[s.set_number]) {
      setGroups[s.set_number] = { totalReps: 0, count: 0 };
    }
    setGroups[s.set_number].totalReps += s.reps;
    setGroups[s.set_number].count += 1;
  });

  const sets = Object.entries(setGroups).map(([set_number, data]) => ({
    set_number: Number(set_number),
    reps: Math.round(data.totalReps / data.count)
  })).sort((a, b) => a.set_number - b.set_number);

  console.log(`Rep distribution data for session ${workout_id}:`, sets);
  res.json({ sets });
});

app.get("/workout/:id", (req, res) => {
  const { id } = req.params;
  const workout = workouts.find(w => w.workout_id === Number(id));
  if (!workout) return res.status(404).json({ error: "Workout not found" });
  
  console.log(`Fetching workout ID: ${id}`);
  res.json(workout);
});

// DELETE WORKOUT
app.delete("/workout/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = workouts.length;
  workouts = workouts.filter(w => w.workout_id !== Number(id));
  
  if (workouts.length === initialLength) {
    return res.status(404).json({ error: "Workout not found" });
  }
  
  console.log(`Workout deleted: ID ${id}`);
  res.json({ message: "Workout deleted successfully" });
});

// 5. UPDATE EXERCISE
app.put("/exercise/:id", (req, res) => {
  const { id } = req.params;
  const { sets, reps, weight, sets_data } = req.body;

  let found = false;
  workouts.forEach(w => {
    const ex = w.exercises.find(e => e.id === id);
    if (ex) {
      if (sets_data && Array.isArray(sets_data)) {
        ex.sets_data = sets_data.map((s, idx) => ({
          set_number: s.set_number || idx + 1,
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0
        }));
      } else {
        ex.sets_data = Array.from({ length: Number(sets) || ex.sets_data.length }, (_, idx) => ({
          set_number: idx + 1,
          reps: Number(reps) || 0,
          weight: Number(weight) || 0
        }));
      }
      found = true;
    }
  });

  if (!found) return res.status(404).json({ error: "Exercise not found" });

  console.log(`Exercise updated: ID ${id}`);
  res.json({ message: "Exercise updated successfully" });
});

// 6. DETAILED REPORTS API
app.get("/reports/:user_id", (req, res) => {
  const { user_id } = req.params;
  console.log("Generating report for user:", user_id);

  const userWorkouts = workouts.filter(w => w.user_id === user_id);

  if (userWorkouts.length === 0) {
    return res.json({
      total_volume: 0,
      total_workouts: 0,
      volume_over_time: [],
      volume_by_muscle_group: [],
      muscle_trends: [],
      insights: ["No workout data available"]
    });
  }

  // 1. Total Metrics
  const total_workouts = userWorkouts.length;
  let total_volume = 0;

  // 2. Data Aggregation
  const metricsByDate = {};
  const metricsByMuscle = {};
  const muscleHistory = {};

  userWorkouts.forEach(w => {
    const date = w.date || 'Unknown';
    metricsByDate[date] = metricsByDate[date] || { volume: 0, weight: 0, reps: 0, sets: 0 };

    w.exercises.forEach(e => {
      const exerciseVolume = e.sets_data.reduce((acc, s) => acc + (s.reps * s.weight), 0);
      const exerciseWeight = e.sets_data.reduce((acc, s) => acc + s.weight, 0);
      const exerciseReps = e.sets_data.reduce((acc, s) => acc + s.reps, 0);
      const exerciseSets = e.sets_data.length;

      total_volume += exerciseVolume;
      
      metricsByDate[date].volume += exerciseVolume;
      metricsByDate[date].weight += exerciseWeight;
      metricsByDate[date].reps += exerciseReps;
      metricsByDate[date].sets += exerciseSets;

      if (e.muscle_group) {
        metricsByMuscle[e.muscle_group] = metricsByMuscle[e.muscle_group] || { volume: 0, weight: 0, reps: 0, sets: 0 };
        metricsByMuscle[e.muscle_group].volume += exerciseVolume;
        metricsByMuscle[e.muscle_group].weight += exerciseWeight;
        metricsByMuscle[e.muscle_group].reps += exerciseReps;
        metricsByMuscle[e.muscle_group].sets += exerciseSets;
        
        muscleHistory[e.muscle_group] = muscleHistory[e.muscle_group] || {};
        muscleHistory[e.muscle_group][date] = muscleHistory[e.muscle_group][date] || { volume: 0, weight: 0, reps: 0, sets: 0 };
        muscleHistory[e.muscle_group][date].volume += exerciseVolume;
        muscleHistory[e.muscle_group][date].weight += exerciseWeight;
        muscleHistory[e.muscle_group][date].reps += exerciseReps;
        muscleHistory[e.muscle_group][date].sets += exerciseSets;
      }
    });
  });

  // 3. Volume Over Time (Sorted)
  const volume_over_time = Object.entries(metricsByDate)
    .map(([date, metrics]) => ({ date, ...metrics }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 4. Weekly Volume
  const weeklyVolume = {};
  volume_over_time.forEach((item) => {
    const d = new Date(item.date);
    const weekNum = getWeekNumber(d);
    const weekKey = `${d.getFullYear()}-W${weekNum}`;
    weeklyVolume[weekKey] = weeklyVolume[weekKey] || { volume: 0, weight: 0, reps: 0, sets: 0 };
    weeklyVolume[weekKey].volume += item.volume;
    weeklyVolume[weekKey].weight += item.weight;
    weeklyVolume[weekKey].reps += item.reps;
    weeklyVolume[weekKey].sets += item.sets;
  });
  const weekly_volume = Object.entries(weeklyVolume).map(([week, metrics]) => ({ week, ...metrics }));

  // 5. Volume By Muscle Group
  const volume_by_muscle_group = Object.entries(metricsByMuscle).map(([muscle, metrics]) => ({ muscle, ...metrics }));

  // 6. Strongest & Weakest Muscle
  let strongest_muscle = "";
  let weakest_muscle = "";
  if (volume_by_muscle_group.length > 0) {
    const sortedMuscles = [...volume_by_muscle_group].sort((a, b) => b.volume - a.volume);
    strongest_muscle = sortedMuscles[0].muscle;
    weakest_muscle = sortedMuscles[sortedMuscles.length - 1].muscle;
  }

  // 7. Muscle Trends
  const muscle_trends = Object.entries(muscleHistory).map(([muscle, historyMap]) => {
    const history = Object.entries(historyMap)
      .map(([date, metrics]) => ({ date, ...metrics }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const totalVolume = history.reduce((acc, h) => acc + h.volume, 0);
    
    let change_percentage = 0;
    if (history.length >= 2) {
      const latest = history[history.length - 1].volume;
      const previous = history[history.length - 2].volume;
      if (previous > 0) {
        change_percentage = ((latest - previous) / previous) * 100;
      }
    }

    return {
      muscle,
      history,
      total_volume: totalVolume,
      change_percentage
    };
  });

  // 8. Insights
  const insights = [];
  if (strongest_muscle) insights.push(`${strongest_muscle} is your strongest muscle group`);
  
  muscle_trends.forEach(trend => {
    if (trend.change_percentage > 10) {
      insights.push(`Your ${trend.muscle.toLowerCase()} training increased by ${trend.change_percentage.toFixed(0)}%`);
    } else if (trend.change_percentage < -10) {
      insights.push(`Your ${trend.muscle.toLowerCase()} training decreased by ${Math.abs(trend.change_percentage).toFixed(0)}%`);
    }
  });

  if (volume_by_muscle_group.length > 1) {
    const sorted = [...volume_by_muscle_group].sort((a, b) => a.volume - b.volume);
    if (sorted[0].volume < sorted[sorted.length - 1].volume * 0.5) {
      insights.push(`${sorted[0].muscle} is undertrained compared to other muscles`);
    }
  }

  res.json({
    total_volume,
    total_workouts,
    strongest_muscle,
    weakest_muscle,
    volume_over_time,
    weekly_volume,
    volume_by_muscle_group,
    muscle_trends,
    insights
  });
});

// 7. BASIC ANALYTICS (Legacy)
app.get("/reports", (req, res) => {
  let total_volume = 0;
  const volume_by_muscle_group = {};

  workouts.forEach(w => {
    w.exercises.forEach(e => {
      const volume = e.sets.reduce((acc, s) => acc + (s.reps * s.weight), 0);
      total_volume += volume;
      
      if (e.muscle_group) {
        volume_by_muscle_group[e.muscle_group] = (volume_by_muscle_group[e.muscle_group] || 0) + volume;
      }
    });
  });

  console.log('Generating reports');
  res.json({
    total_volume,
    volume_by_muscle_group
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
