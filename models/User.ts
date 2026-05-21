import bcrypt from "bcryptjs";
import mongoose, { Document, Schema } from "mongoose";


export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    dailyColorieGoal: number;
    onboardingCompleted: boolean;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        // mchamuda@dugsiiye.com
        match:[/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"],
        maxlength: [32, "Password must be less than 32 characters long"],
        select: false,
    },
    name: {
        type: String,
        trim: true,
        required: true,
    },
    dailyColorieGoal: {
        type: Number,
        default: 2000,
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Intaadan db ka ku save garayn passwordka userka, waxaan u baahanahay inaan hash gareyno passwordka ka hor inta aan la save garayn. Waxaan isticmaali doonaa bcryptjs si aan u hash gareyno passwordka.

userSchema.pre('save', async function(){
    if(!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

})

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
}

export default mongoose.model<IUser>('User', userSchema);