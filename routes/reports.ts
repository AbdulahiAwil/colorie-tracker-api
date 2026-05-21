import express from 'express';
import { protect } from '../middleware/auth.js';
import { getDailyReports, getMonthlyReports, getWeeklyReports } from '../controller/reportsController.js';


const router = express.Router();

router.get('/daily',protect, getDailyReports);
router.get('/weekly',protect, getWeeklyReports);
router.get('/monthly',protect, getMonthlyReports);

export default router;