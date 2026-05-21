import mongoose, { Document, Schema, Types } from 'mongoose';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface IFoodEntry extends Document {
  userId: Types.ObjectId;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  storageKey: string;
  timestamp: Date;
  mealType: MealType;
}

const foodEntrySchema = new Schema<IFoodEntry>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  foodName: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
  },
  calories: {
    type: Number,
    required: [true, 'Calories are required'],
    min: [0, 'Calories cannot be negative'],
  },
  protein: {
    type: Number,
    min: [0, 'Protein cannot be negative'],
    default: 0,
  },
  carbs: {
    type: Number,
    min: [0, 'Carbs cannot be negative'],
    default: 0,
  },
  fat: {
    type: Number,
    min: [0, 'Fat cannot be negative'],
    default: 0,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  storageKey: {
    type: String,
    required: true,
    // Stores the R2 object key (e.g., "calorie-tracker/abc123.jpg")
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack',
  },
});

// Index for efficient queries
foodEntrySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IFoodEntry>('FoodEntry', foodEntrySchema);