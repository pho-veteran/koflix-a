import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import toast from "react-hot-toast";
import axios from "axios";

// Email/Password Sign Up
export const signUp = async (
    email: string,
    password: string,
    name?: string
): Promise<User | null> => {
    try {
        const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        toast.success("Account created successfully");

        // Create session cookie via server API
        const idToken = await result.user.getIdToken();

        // Create session
        await axios.post("/api/auth/create-session", {
            idToken,
        });

        // Create user in database
        await axios.post("/api/users", {
            idToken,
            name,
            emailOrPhone: email,
        });

        return result.user;
    } catch (error) {
        const errorMessage = getAuthErrorMessage(error);
        toast.error(errorMessage || "Sign up failed. Please try again.");
        console.error("Sign up error:", error);
        return null;
    }
};

// Email/Password Sign In
export const signIn = async (
    email: string,
    password: string
): Promise<User | null> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        toast.success("Logged in successfully");

        // Create session cookie via server API
        const idToken = await result.user.getIdToken();
        const sessionResponse = await fetch("/api/auth/create-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
        });

        if (!sessionResponse.ok) {
            console.error(
                "Failed to create session:",
                await sessionResponse.text()
            );
            toast.error(
                "Session creation failed. Please try logging in again."
            );
        }

        return result.user;
    } catch (error) {
        const errorMessage = getAuthErrorMessage(error);
        toast.error(errorMessage);
        console.error("Sign in error:", error);
        return null;
    }
};

// Google Sign In
export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        toast.success("Logged in successfully with Google");

        // Create session cookie via server API
        const idToken = await result.user.getIdToken();

        // Create session
        await axios.post("/api/auth/create-session", {
            idToken,
        });

        // Create/update user in database
        await axios.post("/api/users", {
            idToken,
            name: result.user.displayName,
            emailOrPhone: result.user.email,
        });

        return result.user;
    } catch (error) {
        const errorMessage = getAuthErrorMessage(error);
        toast.error(errorMessage || "Google sign in failed. Please try again.");
        console.error("Google sign in error:", error);
        return null;
    }
};

// Sign Out
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);

        // Clear session cookies via API route
        const logoutResponse = await fetch("/api/auth/logout", {
            method: "POST",
        });

        if (!logoutResponse.ok) {
            console.error(
                "Failed to clear session:",
                await logoutResponse.text()
            );
        }

        toast.success("Logged out successfully");
    } catch (error) {
        const errorMessage = getAuthErrorMessage(error);
        toast.error(errorMessage);
        console.error("Sign out error:", error);
    }
};

// Password Reset
export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
        toast.success("Password reset email sent");
    } catch (error) {
        const errorMessage = getAuthErrorMessage(error);
        toast.error(errorMessage);
        console.error("Password reset error:", error);
    }
};

// Get current auth state
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};
