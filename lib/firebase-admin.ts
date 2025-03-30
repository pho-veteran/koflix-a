import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { cert } from "firebase-admin/app";
import * as fs from "fs";
import * as path from "path";

/**
 * Initialize Firebase Admin SDK
 */
export function initAdmin() {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
        try {
            // Define path to the service account file
            const serviceAccountPath = path.join(
                process.cwd(),
                "lib",
                "firebase-admin",
                "service-account.json"
            );

            // Check if the file exists
            if (!fs.existsSync(serviceAccountPath)) {
                throw new Error(
                    `Service account file not found at ${serviceAccountPath}. Please add the service-account.json file to this directory.`
                );
            }

            // Read and parse the service account file
            const serviceAccountContent = fs.readFileSync(
                serviceAccountPath,
                "utf8"
            );
            const serviceAccount = JSON.parse(serviceAccountContent);

            // Initialize the app with the service account credentials
            initializeApp({
                credential: cert(serviceAccount),
            });

            console.log(
                "Firebase Admin initialized successfully with service account file"
            );
        } catch (error) {
            console.error("Error initializing Firebase Admin:", error);
            throw error;
        }
    }

    // Return the Auth instance
    return getAuth();
}
