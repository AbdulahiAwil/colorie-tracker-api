import dotenv from "dotenv";
dotenv.config();


export const config = {
    port: parseInt(process.env.PORT || "8000"),
    mongodbUri: process.env.NODE_ENV === "production" ? process.env.MONGODB_URI_PROD : process.env.MONGODB_URI_DEV,
    jwtSecret: process.env.JWT_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2PublicUrl: process.env.R2_PUBLIC_URL,
}