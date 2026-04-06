import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './database.js';

// User Model
export class User extends Model {
  public user_id!: number;
  public name!: string;
  public email!: string;
  public age!: number;
  public password!: string;
}

User.init({
  user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.TEXT, allowNull: false },
  email: { type: DataTypes.TEXT, allowNull: false, unique: true },
  age: { type: DataTypes.INTEGER, allowNull: false },
  password: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'user' });

// Workout Model
export class Workout extends Model {
  public workout_id!: number;
  public user_id!: number;
  public name!: string;
}

Workout.init({
  workout_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'workout' });

// Exercise Model
export class Exercise extends Model {
  public exercise_id!: number;
  public workout_id!: number;
  public name!: string;
  public muscle_group!: string;
  public sets!: number;
  public reps!: number;
  public weight!: number;
}

Exercise.init({
  exercise_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  workout_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.TEXT, allowNull: false },
  muscle_group: { type: DataTypes.TEXT, allowNull: false },
  sets: { type: DataTypes.INTEGER, allowNull: false },
  reps: { type: DataTypes.INTEGER, allowNull: false },
  weight: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'exercise' });

// Workout Log Model
export class WorkoutLog extends Model {
  public log_id!: number;
  public user_id!: number;
  public date!: Date;
}

WorkoutLog.init({
  log_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, modelName: 'workout_log' });

// Exercise Log Model
export class ExerciseLog extends Model {
  public id!: number;
  public log_id!: number;
  public exercise_id!: number;
  public sets!: number;
  public reps!: number;
  public weight!: number;
}

ExerciseLog.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  log_id: { type: DataTypes.INTEGER, allowNull: false },
  exercise_id: { type: DataTypes.INTEGER, allowNull: false },
  sets: { type: DataTypes.INTEGER, allowNull: false },
  reps: { type: DataTypes.INTEGER, allowNull: false },
  weight: { type: DataTypes.INTEGER, allowNull: false },
}, { sequelize, modelName: 'exercise_log' });

// Relationships
User.hasMany(Workout, { foreignKey: 'user_id' });
Workout.belongsTo(User, { foreignKey: 'user_id' });

Workout.hasMany(Exercise, { foreignKey: 'workout_id' });
Exercise.belongsTo(Workout, { foreignKey: 'workout_id' });

User.hasMany(WorkoutLog, { foreignKey: 'user_id' });
WorkoutLog.belongsTo(User, { foreignKey: 'user_id' });

WorkoutLog.hasMany(ExerciseLog, { foreignKey: 'log_id' });
ExerciseLog.belongsTo(WorkoutLog, { foreignKey: 'log_id' });

Exercise.hasMany(ExerciseLog, { foreignKey: 'exercise_id' });
ExerciseLog.belongsTo(Exercise, { foreignKey: 'exercise_id' });
