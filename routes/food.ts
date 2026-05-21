import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { analyzeFoodImage, discardAnalyzedFood, saveFoodEntry, scanFood } from '../controller/foodController.js';

const router = express.Router();

router.post('/scan',protect, upload.single('image'), scanFood)
router.post('/analyze',protect, upload.single('image'),analyzeFoodImage);
router.post('/save',protect, saveFoodEntry);
router.post('/discard',protect, discardAnalyzedFood);

export default router;