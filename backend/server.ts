import express, { Application } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import env from './config/env';
import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';

function createApp(): Application {
  const app = express();

  if (env.corsOrigin) {
    app.use(cors({ origin: env.corsOrigin }));
  } else {
    app.use(cors());
  }

  app.use(express.json());
  app.use(authRoutes);
  app.use(gameRoutes);
  app.use(userRoutes);
  return app;
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase(env.mongoUri);
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

if (require.main === module) {
  startServer();
}

export { createApp, startServer };
