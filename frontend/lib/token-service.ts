
import { db, GuideProfile } from "./db";

export class TokenService {
    static readonly COST_VIEW_REQUEST = 5;
    static readonly COST_CHAT_START = 10;

    static hasBalance(profile: GuideProfile, cost: number): boolean {
        return (profile.tokens || 0) >= cost;
    }

    static async deductTokens(userId: string, cost: number, reason: string): Promise<boolean> {
        const database = db.read();
        const profileIndex = database.guideProfiles.findIndex(p => p.userId === userId);

        if (profileIndex === -1) return false;

        const profile = database.guideProfiles[profileIndex];
        const currentTokens = profile.tokens || 0;

        if (currentTokens < cost) return false;

        profile.tokens = currentTokens - cost;
        database.guideProfiles[profileIndex] = profile;

        db.write(database);
        console.log(`[TokenService] Deducted ${cost} tokens from ${userId} for ${reason}. New balance: ${profile.tokens}`);
        return true;
    }

    static async grantTokens(userId: string, amount: number): Promise<void> {
        const database = db.read();
        const profileIndex = database.guideProfiles.findIndex(p => p.userId === userId);

        if (profileIndex === -1) return;

        const profile = database.guideProfiles[profileIndex];
        profile.tokens = (profile.tokens || 0) + amount;
        database.guideProfiles[profileIndex] = profile;

        db.write(database);
    }
}
