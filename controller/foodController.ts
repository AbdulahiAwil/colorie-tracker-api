import { Request, Response } from 'express';
import sharp from 'sharp';
import crypto from 'crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Config } from '../config/r2.js';
import { analyzeFood } from '../services/openai.js';
import FoodEntry from '../models/FoodEntry.js';

const optimizeImage = async (buffer: Buffer): Promise<Buffer> => {
    const originalSize = buffer.length;

    const optimizedBuffer = await sharp(buffer)
    .rotate()
    .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true 
    })
    .jpeg({
        quality: 85,
        mozjpeg: true
    })
    .toBuffer();
   
    return optimizedBuffer;
}

const uploadToR2 = async (buffer:Buffer): Promise<{ url: string, key: string }> => {
    const fileName = `${crypto.randomBytes(16).toString('hex')}.jpg`;
    const key = `colorie-trucker-rec/${fileName}`;
    try {
        const comand = new PutObjectCommand({
            Bucket: r2Config.bucketName,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg',
        })
        console.log("Uploading to R2...");
        const result = await r2Config.client.send(comand);
        console.log("Upload successful:", result);

        return {
            url: `${r2Config.publicUrl}/${key}`,
            key: key
        };
        
    } catch (error) {
        console.error("Error uploading to R2:", error);
        throw error;
    }
}


export const scanFood = async (req:Request, res:Response): Promise<void> => {

    try {
        // 1 Get image from request

        if (!req.file) {
            res.status(400).json({ message: 'No image file provided' });
            return;
        }
        const image = req.file.buffer;

        // 2 Optamize using sharp
        console.log("Optimizing image...");

        const optimizedImage = await optimizeImage(image);

        console.log("Uploading to R2...");
        const { url, key } = await uploadToR2(optimizedImage);

    // 3 Analyze with OpenAI
        console.log("Analyzing food with OpenAI...");
        const foodAnalysis = await analyzeFood(url);
        console.log("Food analysis result:", foodAnalysis);

        // Save food database

        const foodEntry = await FoodEntry.create({
            userId: req.user?._id,
            foodName: foodAnalysis.foodName,
            calories: foodAnalysis.calories,
            protein: foodAnalysis.protein,
            carbs: foodAnalysis.carbs,
            fat: foodAnalysis.fat,
            imageUrl: url,
            storageKey: key,
        })
        
        res.status(201).json({
            message: 'Food entry created successfully',
            food: foodEntry

        }) 
        
    } catch (error) {
        console.error("Error in scanFood:", error);
        res.status(500).json({ message: 'Internal server error' });
        
    }

}


export const analyzeFoodImage = async (req:Request, res:Response): Promise<void> => {
    try {

          // 1 Get image from request

        if (!req.file) {
            res.status(400).json({ message: 'No image file provided' });
            return;
        }

        // Check user is authenticated
        if(!req.user?._id){
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const image = req.file.buffer;

        // 2 Optamize using sharp
        console.log("Optimizing image...");

        const optimizedImage = await optimizeImage(image);

        console.log("Uploading to R2...");
        const { url, key } = await uploadToR2(optimizedImage);

    // 3 Analyze with OpenAI
        console.log("Analyzing food with OpenAI...");
        const foodData = await analyzeFood(url);
        console.log("Food analysis result:", foodData);

        // base64 encode the image

        const imageBase64 = `data:image/jpeg;base64,${optimizedImage.toString('base64')}`;

        console.log("image base64 encoded: ", imageBase64)

        res.status(200).json({
            ...foodData,
            imageUrl: url,
            storageKey: key,
            imageBase64
        })

  
    } catch (error) {
        console.error("Error in analyzeFoodImage:", error);
        res.status(500).json({ message: 'Internal server error' });
        return;
        
    }
}


export const saveFoodEntry = async (req:Request, res:Response): Promise<void> => {
    try {

        const { foodName, calories, protein, carbs, fat, imageUrl, storageKey, mealType } = req.body;

        if(!foodName || !calories === undefined || !imageUrl || !storageKey){
            res.status(400).json({ message: 'All fields are required except protein, carbs, and fat' });
            return;
        }

        // Check user is authenticated
        if(!req.user?._id){
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const foodEntry = await FoodEntry.create({
            userId: req.user._id,
            foodName,
            calories,
            protein,
            fat,
            carbs,
            mealType: mealType || 'snack',
            imageUrl,
            storageKey
         })

         console.log("Food entry saved:", foodEntry);
         res.status(201).json(foodEntry)
    
    } catch (error) {
        console.error("Error in saveFoodEntry:", error);
        res.status(500).json({ message: 'Internal server error' });
        return
    }
}


// Discard Food

export const discardAnalyzedFood = async(req: Request , res: Response): Promise<void> => {
    try {

        const { storageKey } = req.body;

        if(!storageKey){
            res.status(400).json({ message: 'storageKey is required' });
            return;
        }
        // Check user is authenticated
        if(!req.user?._id){
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Delete from R2
        try {
            const command = new DeleteObjectCommand({
                Bucket: r2Config.bucketName,
                Key: storageKey,
            })
            console.log("Deleting image from R2...");
            await r2Config.client.send(command);
            console.log("Image deleted from R2 successfully");
             res.status(200).json({ message: 'Analyzed food discarded successfully' });
             return;
   
        } catch (error) {
            console.error("Error deleting image from R2:", error);
            res.status(500).json({ message: 'Internal server error' });
            return;
        }
        
         
        
    } catch (error) {
        console.error("Error in discardAnalyzedFood:", error);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
}

export const getEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const { date, startDate, endDate, limit = '50' } = req.query;

    let query: Record<string, unknown> = { userId: req.user._id };

    // Filter by specific date
    if (date && typeof date === 'string') {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by date range
    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // query structure { userId: req.user._id, timestamp: { $gte: startOfDay, $lte: endOfDay } }

    const entries = await FoodEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));

    res.json(entries);
  } catch (error) {
    console.error('Get entries error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
