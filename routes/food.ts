import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { analyzeFoodImage, discardAnalyzedFood, getEntries, saveFoodEntry, scanFood } from '../controller/foodController.js';

const router = express.Router();

router.post('/scan',protect, upload.single('image'), scanFood)
router.post('/analyze',protect, upload.single('image'),analyzeFoodImage);
router.post('/save',protect, saveFoodEntry);
router.post('/discard',protect, discardAnalyzedFood);
router.get('/entries', protect, getEntries);

export default router;