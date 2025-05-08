import { query } from '.';

export async function setupDatabase() {
  try {
    // First, try to create the schema if it doesn't exist
    await query(`CREATE SCHEMA IF NOT EXISTS tk2namechanger_besidehorn`);

    // Set search path to the user's schema
    await query(`SET search_path TO tk2namechanger_besidehorn`);

    // Create user profiles table (extending Firebase auth data)
    await query(`
      CREATE TABLE IF NOT EXISTS tk2namechanger_besidehorn.user_profiles (
        uid VARCHAR(255) PRIMARY KEY,
        display_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for track name suggestions - without foreign key constraint for now
    await query(`
      CREATE TABLE IF NOT EXISTS tk2namechanger_besidehorn.track_suggestions (
        id SERIAL PRIMARY KEY,
        track_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create table for battle arena name suggestions - without foreign key constraint for now
    await query(`
      CREATE TABLE IF NOT EXISTS tk2namechanger_besidehorn.arena_suggestions (
        id SERIAL PRIMARY KEY,
        arena_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database tables created successfully");
    return { success: true };
  } catch (error) {
    console.error("Error setting up database:", error);
    return { success: false, error };
  }
}