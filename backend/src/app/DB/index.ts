import mongoose from 'mongoose';
import config from '../config';
import { seedDatabase, validateSeeding } from '../utils/seeder';

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      // MongoDB connection options - Optimized for multi-tenancy (100+ schools)
      const options = {
        maxPoolSize: 500, // 5 connections per school (100 schools)
        minPoolSize: 50, // Keep warm connections
        socketTimeoutMS: 30000, // 30 second socket timeout
        serverSelectionTimeoutMS: 10000, // 10 second server selection timeout
        bufferCommands: false, // Disable mongoose buffering

        // Enable monitoring for connection pool events
        monitorCommands: true,
      };

      await mongoose.connect(config.mongodb_uri, options);

      // Connection event handlers
      mongoose.connection.on('connected', async () => {
        console.log('✅ MongoDB connected successfully');

        // Run database seeding after successful connection
        try {
          await seedDatabase();
          const isValid = await validateSeeding();
          if (!isValid) {
            console.warn('⚠️ Seeding validation failed - some issues detected');
          }
        } catch (error) {
          console.error('❌ Database seeding error:', error);
          // Don't exit process, just log the error
        }
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });

      // Connection pool monitoring for multi-tenancy
      mongoose.connection.on('connectionPoolCreated', (event: any) => {
        console.log(`[MongoDB] Connection pool created`);
      });

      mongoose.connection.on('connectionPoolClosed', (event: any) => {
        console.warn(`[MongoDB] Connection pool closed`);
      });

      mongoose.connection.on('connectionPoolCleared', (event: any) => {
        console.error(`[MongoDB] Connection pool cleared (connection error detected)`);
      });

      mongoose.connection.on('connectionCheckOutFailed', (event: any) => {
        console.error(`[MongoDB] Connection checkout failed - Pool may be exhausted. This indicates high load.`);
      });

      // Handle application termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('❌ Error while disconnecting from MongoDB:', error);
    }
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  public async dropDatabase(): Promise<void> {
    if (config.node_env === 'test') {
      await mongoose.connection.dropDatabase();
    } else {
      throw new Error('Database drop is only allowed in test environment');
    }
  }

  public async clearCollections(): Promise<void> {
    if (config.node_env === 'test') {
      const collections = mongoose.connection.collections;

      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } else {
      throw new Error('Collection clearing is only allowed in test environment');
    }
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export mongoose for direct usage if needed
export { mongoose };

// Default export
export default database;