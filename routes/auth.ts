import express from 'express';
import { getMe, login, register } from '../controller/auth.controller.js';
import { protect } from '../middleware/auth.js';


const router = express.Router();


router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)

export default router;