/**
 * Auth Rate Limiter
 * Provides strict Bruteforce protection for Login/Register endpoints.
 * Emulates a Redis-based architecture for production-grade security.
 */

// In-memory Maps representing Redis hashes/counters
const ipFailures = new Map<string, { count: number; lockedUntil: number }>();
const emailFailures = new Map<string, { count: number; lockedUntil: number }>();

const IP_MAX_FAILS = 5;
const IP_LOCKOUT_MS = 15 * 60 * 1000; // 15 mins

const EMAIL_MAX_FAILS = 10;
const EMAIL_BASE_LOCKOUT_MS = 5 * 60 * 1000; // 5 mins

export const AuthRateLimit = {
    /**
     * Checks if the current IP or Email is locked out.
     */
    checkLockout: (ip: string, email?: string): { allowed: boolean; reason?: string } => {
        const now = Date.now();

        // 1. Check IP Lockout
        const ipRecord = ipFailures.get(ip);
        if (ipRecord && ipRecord.lockedUntil > now) {
            return { allowed: false, reason: "Too many login attempts. Please try again in 15 minutes." };
        }

        // 2. Check Email Lockout (Progressive Backoff)
        if (email) {
            const emailRecord = emailFailures.get(email.toLowerCase());
            if (emailRecord && emailRecord.lockedUntil > now) {
                return { allowed: false, reason: "Account locked due to multiple failed attempts. Try again later." };
            }
        }

        return { allowed: true };
    },

    /**
     * Registers a failed attempt and triggers lockout if thresholds are exceeded.
     */
    recordFailure: (ip: string, email?: string) => {
        const now = Date.now();

        // 1. IP Tracking
        const ipRecord = ipFailures.get(ip) || { count: 0, lockedUntil: 0 };
        ipRecord.count += 1;
        if (ipRecord.count >= IP_MAX_FAILS) {
            ipRecord.lockedUntil = now + IP_LOCKOUT_MS;
            ipRecord.count = 0; // Reset count upon lock
        }
        ipFailures.set(ip, ipRecord);

        // 2. Email Tracking
        if (email) {
            const normalizedEmail = email.toLowerCase();
            const emailRecord = emailFailures.get(normalizedEmail) || { count: 0, lockedUntil: 0 };
            emailRecord.count += 1;

            if (emailRecord.count >= EMAIL_MAX_FAILS) {
                // Progressive backoff: base * (count - Max + 1)
                const multiplier = emailRecord.count - EMAIL_MAX_FAILS + 1;
                emailRecord.lockedUntil = now + (EMAIL_BASE_LOCKOUT_MS * multiplier);
            }
            emailFailures.set(normalizedEmail, emailRecord);
        }
    },

    /**
     * Clears tracking for a successful login.
     */
    recordSuccess: (ip: string, email?: string) => {
        ipFailures.delete(ip);
        if (email) {
            emailFailures.delete(email.toLowerCase());
        }
    }
};
