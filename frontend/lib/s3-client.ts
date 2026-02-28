import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
    region: process.env.AWS_REGION || "eu-central-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "MOCK_KEY",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "MOCK_SECRET",
    },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "kyc-document-vault";

/**
 * Uploads a file securely to the private S3 vault.
 * Forces private ACL.
 */
export async function uploadToVault(key: string, body: Buffer, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: "private", // Strict private enforcement
    });

    // Auto-mocking for local environments without AWS credentials
    try {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== "MOCK_KEY") {
            await s3.send(command);
        } else {
            console.log(`[Mock S3 Vault] Saved file privately as ${key}`);
        }
        return key;
    } catch (e) {
        console.error("S3 Upload Error:", e);
        throw new Error("Vault upload failed");
    }
}

/**
 * Generates a short-lived, pre-signed URL for secure admin viewing.
 */
export async function getVaultPresignedUrl(key: string, expiresIn: number = 60) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    try {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== "MOCK_KEY") {
            return await getSignedUrl(s3, command, { expiresIn });
        } else {
            // Return a mock URL that proves the system logic works
            return `https://mock-s3.local.umrebuldum.com/${BUCKET_NAME}/${key}?X-Amz-Expires=${expiresIn}&mock=true`;
        }
    } catch (e) {
        console.error("S3 Presigner Error:", e);
        throw new Error("Could not generate presigned access URL");
    }
}
