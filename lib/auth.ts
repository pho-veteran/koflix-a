import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
    PhoneAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import toast from "react-hot-toast";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import axios from "axios";

// Define the window global for RecaptchaVerifier
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

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

// Send verification code to phone number
export const sendVerificationCode = async (
    phoneNumber: string
): Promise<string | null> => {
    try {
        // Validate and format the phone number
        let formattedNumber = phoneNumber;

        // Make sure we have a + prefix
        if (!formattedNumber.startsWith("+")) {
            formattedNumber = "+" + formattedNumber;
        }

        // Validate the phone number
        if (!isValidPhoneNumber(formattedNumber)) {
            toast.error("Invalid phone number format");
            throw new Error("auth/invalid-phone-number");
        }

        // Parse and format phone number in E.164 format
        const parsedNumber = parsePhoneNumber(formattedNumber);
        formattedNumber = parsedNumber.format("E.164");

        // Clear previous RecaptchaVerifier if it exists
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
        }

        // Create a new RecaptchaVerifier instance
        window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "invisible",
            }
        );

        // Send verification code
        const confirmationResult = await signInWithPhoneNumber(
            auth,
            formattedNumber,
            window.recaptchaVerifier
        );

        // Store verification ID and phone number
        localStorage.setItem(
            "phoneAuthVerificationId",
            confirmationResult.verificationId
        );
        localStorage.setItem("phoneAuthPhoneNumber", formattedNumber);

        toast.success("Verification code sent to your phone");

        return confirmationResult.verificationId;
    } catch (error) {
        console.error("Error sending verification code:", error);
        const errorMessage = getAuthErrorMessage(error);
        toast.error(errorMessage);

        // Add specific handling for quota exceeded errors
        if (typeof error === "object" && error && "code" in error) {
            const errorCode = (error as { code: string }).code;
            if (errorCode === "auth/quota-exceeded") {
                toast.error(
                    "SMS quota exceeded. Please try again later or use email registration."
                );
            } else if (errorCode === "auth/invalid-phone-number") {
                toast.error(
                    "The phone number is not valid. Please enter a valid number with country code."
                );
            } else if (errorCode === "auth/missing-phone-number") {
                toast.error("Please provide a phone number.");
            }
        }

        return null;
    } finally {
        // Clear recaptcha if it exists (in case of error)
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.error("Error clearing recaptcha:", e);
            }
        }
    }
};

// Verify the code entered by user
export const verifyCode = async (code: string): Promise<User | null> => {
    const verificationId = localStorage.getItem("phoneAuthVerificationId");
    const phoneNumber = localStorage.getItem("phoneAuthPhoneNumber");
    const name = localStorage.getItem("phoneRegistrationName");

    if (!verificationId) {
        toast.error("Verification ID is missing. Please request a new code.");
        return null;
    }

    try {
        // Create credential with verification ID and code
        const credential = PhoneAuthProvider.credential(verificationId, code);

        // Sign in with credential
        const result = await signInWithCredential(auth, credential);

        // Create session cookie via server API
        const idToken = await result.user.getIdToken();

        // Create session
        await axios.post("/api/auth/create-session", {
            idToken,
        });

        // Create user in database

await axios.post("/api/users", {
                idToken,
                name: name || "Phone User",
                emailOrPhone: phoneNumber,
            });


        // Get stored password from localStorage (if it exists)
        const storedPassword = localStorage.getItem(
            "phoneRegistrationPassword"
        );
        if (storedPassword) {
            localStorage.removeItem("phoneRegistrationPassword");
        }
        if (name) {
            localStorage.removeItem("phoneRegistrationName");
        }

        toast.success("Phone verification successful");

        // Clear phone auth state after successful verification
        localStorage.removeItem("phoneAuthVerificationId");
        localStorage.removeItem("phoneAuthPhoneNumber");

        return result.user;
    } catch (error) {
        console.error("Error verifying code:", error);
        const errorMessage = getAuthErrorMessage(error);

        // Add specific error messages for verification issues
        if (typeof error === "object" && error && "code" in error) {
            const errorCode = (error as { code: string }).code;
            if (errorCode === "auth/invalid-verification-code") {
                toast.error("Invalid verification code. Please try again.");
            } else if (errorCode === "auth/code-expired") {
                toast.error(
                    "The verification code has expired. Please request a new one."
                );
            } else if (errorCode === "auth/missing-verification-code") {
                toast.error("Please enter the verification code.");
            } else if (errorCode === "auth/invalid-verification-id") {
                toast.error("Invalid verification session. Please try again.");
            } else {
                toast.error(errorMessage);
            }
        } else {
            toast.error("Verification failed. Please try again.");
        }

        return null;
    } finally {
        // Clear recaptcha if it exists (in case of error)
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.error("Error clearing recaptcha:", e);
            }
        }
    }
};

// Check if there's an active phone verification session
export const hasActivePhoneVerification = (): boolean => {
    return localStorage.getItem("phoneAuthVerificationId") !== null;
};

// Get the phone number from an active verification session
export const getActivePhoneNumber = (): string | null => {
    return localStorage.getItem("phoneAuthPhoneNumber");
};

// Reset the phone auth state
export const resetPhoneAuth = (): void => {
    localStorage.removeItem("phoneAuthVerificationId");
    localStorage.removeItem("phoneAuthPhoneNumber");
    localStorage.removeItem("phoneRegistrationPassword");

    // Also clear the recaptcha if it exists
    if (window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier.clear();
            delete window.recaptchaVerifier;
        } catch (e) {
            console.error("Error clearing recaptcha:", e);
        }
    }
};

// Get current auth state
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};
