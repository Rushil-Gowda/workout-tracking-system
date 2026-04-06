import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  interface Exercise {
    id: string;
    name: string;
    muscle_group: string;
    sets_data: { set_number: number; reps: number; weight: number }[];
  }

  interface Workout {
    workout_id: number;
    name: string;
    user_id?: string;
    exercises: Exercise[];
  }

  interface Session {
    session_id: number;
    workout_id: number;
    workout_name?: string;
    user_id: string;
    datetime: string;
    exercises: {
      exercise_name: string;
      muscle_group: string;
      sets_data: { set_number: number; reps: number; weight: number }[];
    }[];
  }

  // Mock database
  let workouts: Workout[] = [];
  let sessions: Session[] = [];

  // Mock users
  let users: any[] = [
    { name: "Rushil", email: "rushilgowdah@gmail.com", password: "password", user_id: "rushilgowdah@gmail.com" }
  ];

  // Requested routes
  app.get("/", (req, res, next) => {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      next(); // Let Vite handle it
    } else {
      res.json({ status: "ok", message: "Backend is working" });
    }
  });

  app.post("/signup", (req, res) => {
    const { name, email, password, age } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    
    const userExists = users.find(u => u.email === email);
    if (userExists) return res.status(400).json({ error: "User already exists" });

    const newUser = { name, email, password, age, user_id: email };
    users.push(newUser);
    res.status(201).json({ message: "User created", user_id: email, name });
  });

  app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    
    res.json({ message: "Login successful", user_id: user.email, name: user.name });
  });

  app.get("/workouts", (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {
      console.log('Fetching all workouts (no user_id provided)');
      return res.json([]);
    }
    
    const filteredWorkouts = workouts.filter(w => w.user_id === user_id);
    console.log(`Workouts fetched:`, filteredWorkouts);
    res.json(filteredWorkouts);
  });

  // 2. CREATE WORKOUT
  app.post("/workouts", (req, res) => {
    const { name, user_id } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const newWorkout: Workout = {
      workout_id: workouts.length > 0 ? Math.max(...workouts.map(w => w.workout_id)) + 1 : 1,
      name,
      user_id,
      exercises: []
    };
    workouts.push(newWorkout);
    console.log(`Workout created: ${name} (ID: ${newWorkout.workout_id}) for user: ${user_id}`);
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

    const newExercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      muscle_group,
      sets_data: finalSetsData
    };

    workout.exercises.push(newExercise);
    console.log(`Exercise added: ${name} to Workout ID: ${workout_id}`);
    res.status(201).json(newExercise);
  });

  // 4. CREATE SESSION (Updated to accept full session data on finish)
  app.post("/sessions", (req, res) => {
    const { workout_id, workout_name, user_id, datetime, exercises } = req.body;
    console.log("Saving session for workout:", workout_id);
    
    const newSession: Session = {
      session_id: sessions.length > 0 ? Math.max(...sessions.map(s => s.session_id)) + 1 : 1,
      workout_id: Number(workout_id),
      workout_name,
      user_id,
      datetime: datetime || new Date().toISOString(),
      exercises: exercises || []
    };
    
    sessions.push(newSession);
    console.log("Session saved:", newSession.session_id);
    res.status(201).json(newSession);
  });

  // 5. UPDATE SESSION
  app.put("/sessions/:id", (req, res) => {
    const { id } = req.params;
    const { exercises } = req.body;
    
    const session = sessions.find(s => s.session_id === Number(id));
    if (!session) return res.status(404).json({ error: "Session not found" });
    
    if (exercises) {
      session.exercises = exercises;
    }
    
    console.log(`Session updated: ID ${id}`);
    res.json(session);
  });

  // 6. GET SINGLE SESSION
  app.get("/session/:session_id", (req, res) => {
    const { session_id } = req.params;
    const session = sessions.find(s => s.session_id === Number(session_id));
    if (!session) return res.status(404).json({ error: "Session not found" });
    
    console.log(`Fetching session ID: ${session_id}`);
    res.json(session);
  });

  // 6.5 GET ALL SESSIONS FOR USER
  app.get("/sessions", (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    
    const userSessions = sessions.filter(s => s.user_id === user_id);
    console.log(`Fetching ${userSessions.length} sessions for user: ${user_id}`);
    res.json(userSessions);
  });

  // GET LAST SESSION FOR WORKOUT + USER
  app.get("/last-session/:workout_id/:user_id", (req, res) => {
    const { workout_id, user_id } = req.params;
    
    const workoutSessions = sessions
      .filter(s => s.workout_id === Number(workout_id) && s.user_id === user_id)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    if (workoutSessions.length === 0) {
      return res.json(null);
    }

    console.log(`Last session found for workout ${workout_id}:`, workoutSessions[0].session_id);
    res.json(workoutSessions[0]);
  });

  // REP DISTRIBUTION API (Updated to use sessions)
  app.get("/rep-distribution/:session_id", (req, res) => {
    const { session_id } = req.params;
    const session = sessions.find(s => s.session_id === Number(session_id));
    if (!session) return res.status(404).json({ error: "Session not found" });

    const allSets: { set_number: number; reps: number }[] = [];
    session.exercises.forEach(e => {
      e.sets_data.forEach(s => {
        allSets.push({
          set_number: s.set_number,
          reps: s.reps
        });
      });
    });

    const setGroups: Record<number, { totalReps: number; count: number }> = {};
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

    console.log(`Rep distribution data for session ${session_id}:`, sets);
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
          // Update sets array to match requested count and values
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

  // 7. DETAILED REPORTS API (Updated to use sessions)
  app.get("/reports/:user_id", (req, res) => {
    const { user_id } = req.params;
    console.log("Generating report for user:", user_id);

    const userSessions = sessions.filter(s => s.user_id === user_id);

    if (userSessions.length === 0) {
      return res.json({
        total_volume: 0,
        total_workouts: 0,
        volume_over_time: [],
        volume_by_muscle_group: [],
        muscle_trends: [],
        insights: ["No session data available"]
      });
    }

    // 1. Total Metrics
    const total_workouts = userSessions.length;
    let total_volume = 0;

    // 2. Data Aggregation
    const metricsByMuscle: Record<string, any> = {};
    const muscleHistory: Record<string, Record<string, any>> = {};

    userSessions.forEach(session => {
      const datetime = session.datetime || new Date().toISOString();

      session.exercises.forEach(e => {
        const exerciseVolume = e.sets_data.reduce((acc, s) => acc + (s.reps * s.weight), 0);
        const exerciseWeight = e.sets_data.reduce((acc, s) => acc + s.weight, 0);
        const exerciseReps = e.sets_data.reduce((acc, s) => acc + s.reps, 0);
        const exerciseSets = e.sets_data.length;

        total_volume += exerciseVolume;
        
        if (e.muscle_group) {
          metricsByMuscle[e.muscle_group] = metricsByMuscle[e.muscle_group] || { volume: 0, weight: 0, reps: 0, sets: 0 };
          metricsByMuscle[e.muscle_group].volume += exerciseVolume;
          metricsByMuscle[e.muscle_group].weight += exerciseWeight;
          metricsByMuscle[e.muscle_group].reps += exerciseReps;
          metricsByMuscle[e.muscle_group].sets += exerciseSets;
          
          muscleHistory[e.muscle_group] = muscleHistory[e.muscle_group] || {};
          muscleHistory[e.muscle_group][datetime] = muscleHistory[e.muscle_group][datetime] || { volume: 0, weight: 0, reps: 0, sets: 0 };
          muscleHistory[e.muscle_group][datetime].volume += exerciseVolume;
          muscleHistory[e.muscle_group][datetime].weight += exerciseWeight;
          muscleHistory[e.muscle_group][datetime].reps += exerciseReps;
          muscleHistory[e.muscle_group][datetime].sets += exerciseSets;
        }
      });
    });

    // 3. Volume Over Time (Session-based, sorted by datetime)
    const volume_over_time = userSessions.map(session => {
      let sessionVolume = 0;
      let sessionWeight = 0;
      let sessionReps = 0;
      let sessionSets = 0;

      session.exercises.forEach(e => {
        e.sets_data.forEach(s => {
          sessionVolume += (s.reps * s.weight);
          sessionWeight += s.weight;
          sessionReps += s.reps;
          sessionSets += 1;
        });
      });
      
      return {
        datetime: session.datetime || new Date().toISOString(),
        volume: sessionVolume,
        weight: sessionWeight,
        reps: sessionReps,
        sets: sessionSets
      };
    }).sort((a, b) => a.datetime.localeCompare(b.datetime));

    console.log("Raw datetime from backend:", volume_over_time);

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
        .map(([datetime, metrics]) => ({ datetime, ...metrics }))
        .sort((a, b) => a.datetime.localeCompare(b.datetime));
      
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
    const insights: string[] = [];
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
      volume_by_muscle_group,
      muscle_trends,
      insights
    });
  });

  // 7. BASIC ANALYTICS (Legacy)
  app.get("/reports", (req, res) => {
    let total_volume = 0;
    const volume_by_muscle_group: Record<string, number> = {};

    workouts.forEach(w => {
      w.exercises.forEach(e => {
        const volume = e.sets_data.reduce((acc, s) => acc + (s.reps * s.weight), 0);
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

  // Keep existing API routes for compatibility
  app.get("/api/workouts", (req, res) => {
    res.json(workouts);
  });

  app.post("/api/workouts", (req, res) => {
    const newWorkout = req.body;
    workouts.push(newWorkout);
    res.status(201).json(newWorkout);
  });

  app.put("/api/workouts/:id", (req, res) => {
    const { id } = req.params;
    const updatedWorkout = req.body;
    workouts = workouts.map(w => String(w.workout_id) === String(id) ? updatedWorkout : w);
    res.status(200).json(updatedWorkout);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
