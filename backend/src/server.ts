import app from './app';
import config from './app/config';
import { database } from './app/DB';
import {
  startAbsenceSmsScheduler,
  stopAbsenceSmsScheduler,
} from './app/modules/attendance/absence-sms.scheduler';

async function main() {
  try {
    // Connect to MongoDB using our database singleton
    await database.connect();

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 School Management API server is running on port ${config.port}`);
      console.log(`📝 API Documentation: http://localhost:${config.port}/api/docs`);
      console.log(`🌍 Environment: ${config.node_env}`);
      startAbsenceSmsScheduler();
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      server.close(async () => {
        try {
          stopAbsenceSmsScheduler();
          await database.disconnect();
          console.log('✅ Database connection closed');
          console.log('👋 Server shut down successfully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

main();
