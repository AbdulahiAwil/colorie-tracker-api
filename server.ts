import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import express , {Request, Response, NextFunction} from 'express';
import connectDB from './config/db.js';
import foodRoutes from './routes/food.js';
import reportsRoutes from './routes/reports.js';
import { config } from './config/config.js';

dotenv.config();

const app = express();

    
connectDB();

app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Api routes

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/', (req:Request, res:Response) => {
    res.json({
        message: 'Welcome to the calorie tracker!',
        status: 'success',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });

   
})

// error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// 404 middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: "Route not found" });
});


// // ✅ Saxda ah - Number ku bedel
// const PORT: number = parseInt(process.env.PORT || '8000', 10);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });


// ✅ Saxda ah - Number ku bedel
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});