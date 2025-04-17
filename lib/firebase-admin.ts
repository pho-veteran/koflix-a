import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccountData from "@/lib/firebase-admin/service-account.json";

const serviceAccount = serviceAccountData as ServiceAccount;

/**
 * Initialize Firebase Admin SDK
 */
export function initAdmin() {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
        try {
            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error("Error initializing Firebase Admin:", error);
            throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    return getAuth();
}
