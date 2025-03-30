// Map Firebase auth error codes to user-friendly messages
const authErrors: Record<string, string> = {
    // Email/Password Authentication Errors
    "auth/email-already-in-use":
        "This email is already registered. Please login instead.",
    "auth/invalid-email": "The email address is not valid.",
    "auth/user-disabled":
        "This account has been disabled. Please contact support.",
    "auth/user-not-found":
        "No account found with this email. Please register instead.",
    "auth/wrong-password":
        "Incorrect password. Please try again or reset your password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests":
        "Too many unsuccessful login attempts. Please try again later.",
    "auth/network-request-failed":
        "Network error. Please check your connection and try again.",
    "auth/internal-error":
        "An internal authentication error occurred. Please try again later.",
    "auth/invalid-credential": "Invalid login credentials. Please try again.",
    "auth/account-exists-with-different-credential":
        "An account already exists with the same email but different sign-in credentials.",
    "auth/operation-not-allowed":
        "This login method is not enabled. Please contact support.",
    "auth/requires-recent-login":
        "This operation requires a more recent login. Please log in again.",

    // Phone Authentication Errors
    "auth/invalid-phone-number":
        "The phone number is not valid. Please enter a valid number with country code.",
    "auth/missing-phone-number": "Please provide a phone number.",
    "auth/quota-exceeded": "SMS quota exceeded. Please try again later.",
    "auth/invalid-verification-code":
        "Invalid verification code. Please try again.",
    "auth/code-expired":
        "The verification code has expired. Please request a new one.",
    "auth/missing-verification-code": "Please enter the verification code.",
    "auth/invalid-verification-id":
        "Invalid verification session. Please try again.",

    // OAuth/Social Login Errors
    "auth/popup-closed-by-user":
        "Login popup was closed before completing the sign in. Please try again.",
    "auth/popup-blocked":
        "Login popup was blocked by your browser. Please allow popups for this site.",
    "auth/cancelled-popup-request": "The login request was cancelled.",
    "auth/redirect-cancelled-by-user": "Login redirect was cancelled.",

    // Default error
    default: "Authentication failed. Please try again.",
};

/**
 * Get a user-friendly error message for Firebase auth errors
 * @param errorCode - Firebase error code or error object
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(errorCode: string | { code?: string } | unknown): string {
    if (typeof errorCode !== "string") {
        // Extract error code from Firebase error object if available
        if (errorCode && typeof errorCode === "object" && "code" in errorCode) {
            errorCode = (errorCode as { code: string }).code;
        } else {
            return authErrors.default;
        }
    }

    return typeof errorCode === "string" && errorCode in authErrors
        ? authErrors[errorCode]
        : authErrors.default;
}
