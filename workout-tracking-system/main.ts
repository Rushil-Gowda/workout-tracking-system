import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import sequelize from './database.js';
import authRouter from './routers/auth.js';
import workoutsRouter from './routers/workouts.js';
import exercisesRouter from './routers/exercises.js';
import reportsRouter from './routers/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting server...");

const app = express();

// 3. ENSURE EXPRESS IS INITIALIZED
app.use(express.json());
app.use(cors());

// 2. ADD TEST ROUTE (MANDATORY)
app.get("/", (req, res) => {
  console.log("GET / hit");
  res.send("Backend is working");
});

// 4. CHECK ROUTER MOUNTING
app.use('/workouts', workoutsRouter);
app.use('/', authRouter);
app.use('/', exercisesRouter);
app.use('/', reportsRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Strength Training Backend is running' });
});

// 7. CHECK FOR SILENT FAILURES
async function startServer() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connected.");
    
    await sequelize.sync({ force: false });
    console.log("Database synced.");

    if (process.env.NODE_ENV !== "production") {
      console.log("Initializing Vite middleware...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware integrated.");
    } else {
      console.log("Serving production build...");
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // 1. VERIFY SERVER IS LISTENING PROPERLY
    app.listen(3000, "0.0.0.0", () => {
      console.log("Server running on http://localhost:3000");
      console.log("Server listening on port 3000");
    });

  } catch (error) {
    console.error("CRITICAL: Server failed to start:", error);
    // Start listening even on error to allow debugging via the test route
    app.listen(3000, "0.0.0.0", () => {
      console.log("Server running on http://localhost:3000 (with errors)");
    });
  }
}

startServer();
