import { Sequelize } from 'sequelize';
import path from 'path';

console.log('DATABASE.TS LOADED');
// For preview purposes, we use SQLite. 
// In a real production environment, you would use PostgreSQL by providing a connection string.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log, // Enable logging for debugging
});

export default sequelize;
