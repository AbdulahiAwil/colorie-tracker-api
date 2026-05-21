import { S3Client } from "@aws-sdk/client-s3";
import { config } from "./config.js";


const r2Client = new S3Client({
    region:"auto",
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials:{
        accessKeyId: config.r2AccessKeyId as string,
        secretAccessKey: config.r2SecretAccessKey as string,
    }
})

export const r2Config = {
    client: r2Client,
    bucketName: config.r2BucketName,
    publicUrl: config.r2PublicUrl,
}