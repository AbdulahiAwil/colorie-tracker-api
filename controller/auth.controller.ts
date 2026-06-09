
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "", {
    expiresIn: "30d",
  });
};

export const register = async(req: Request, res: Response): Promise<void> => {

    try {
        const { email, password, name, dailyColorieGoal } = req.body;

         console.log("req.body:", req.body);

        if(!email || !password || !name){
            res.json({message: "All fields are required"})
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();


        // check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if(existingUser){
            res.json({message: "User already exists with this email"})
            return;
        }

        // create new user
    const user = await User.create({
        email: normalizedEmail,
        password,
        name,
        dailyColorieGoal: dailyColorieGoal || 2000,
    });

    res.status(201).json({
        message: "User registered successfully",
        user: {
            email: user.email,
            name: user.name,
            dailyColorieGoal: user.dailyColorieGoal,
            token: generateToken(user._id.toString()),
        }
    });

        
    } catch (error) {
         console.error("Error creating user:", error);
         res.status(500).json({ message: "Internal server error" });
    }

}
  

// LOGIN FUNCTION
export const login = async(req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if(!email || !password){
            res.json({message: "All fields are required"})
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if(!user){
            res.json({message: "Invalid email or password"})
            return;
        }
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            res.json({message: "Invalid email or password"})
            return;
        }

        // generate token
        const token = generateToken(user._id.toString());

        res.status(200).json({
            message: "Login successful",
            user: {
                email: user.email,
                name: user.name,
                dailyColorieGoal: user.dailyColorieGoal,
                token,
            }
        });
        
    } catch (error) {
            console.error("Error logging in user:", error);
            res.status(500).json({ message: "Internal server error" });
        
    }
}

export const getMe = async(req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "User not found, authorization denied" });
            return;
        }
        res.status(200).json({
            message: "User found",
            user: req.user
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, dailyColorieGoal, onboardingCompleted } = req.body;

        const user = await User.findById(req.user?._id).select("-password");

        if(!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        if(name) user.name = name;
        if(dailyColorieGoal) user.dailyColorieGoal = dailyColorieGoal;
        if(onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

        const updatedUser = await user.save();

        res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          dailyCalorieGoal: updatedUser.dailyColorieGoal,
          onboardingCompleted: updatedUser.onboardingCompleted,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}