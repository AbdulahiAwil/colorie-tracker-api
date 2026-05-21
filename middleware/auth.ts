import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';

declare global {
    namespace Express {
        interface Request {
            user?: IUser
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            const token = req.headers.authorization.split(' ')[1];

            if (!token) {
                res.status(401).json({ message: "No token provided, authorization denied" });
                return;
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as { id: string };

            // Get user from the database

            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                res.status(401).json({ message: "User not found, authorization denied" });
                return;
            }
            // everything is good, we can attach the user to the request object and call next()

            req.user = user;
            next();
            
        } catch (error) {
            console.error("Token verification failed:", error);
           res.status(500).json({ message: "Internal server error" });
            
        }
    }else {
        res.status(401).json({ message: "No token provided, authorization denied" });
        return;
    }


}