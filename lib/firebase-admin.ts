import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getServiceAccountFromEnv(): ServiceAccount {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 env variable is not set");
    }
    try {
        const json = Buffer.from(base64, 'base64').toString('utf8');
        return JSON.parse(json) as ServiceAccount;
    } catch (error) {
        throw new Error("Failed to parse service account from env: " + error);
    }
}

/**
 * Initialize Firebase Admin SDK
 */
export function initAdmin() {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
        try {
            initializeApp({
                credential: cert(getServiceAccountFromEnv()),
            });
        } catch (error) {
            console.error("Error initializing Firebase Admin:", error);
            throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return getAuth();
}
