import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();


const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    const allowedTypes= /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if(extname && mimetype){
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }

    // Upload 

}

const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        fileFilter: fileFilter
        
    });

export default upload;