
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface GuideProfile {
    userId: string;
    fullName: string;
    phone: string;
    city: string;
    quotaTarget: number;
    currentCount: number;
    isApproved: boolean;
}

export interface GuideListing {
    id: string;
    guideId: string; // This maps to userId of the guide
    title: string;
    description: string;
    city: string;
    quota: number;
    filled: number;
    active: boolean;
}

export interface DatabaseSchema {
    users: any[];
    sessions: any[];
    accounts: any[];
    verificationTokens: any[];
    guideProfiles: GuideProfile[];
    guideListings: GuideListing[];
}

function getDb(): DatabaseSchema {
    if (!fs.existsSync(DB_PATH)) {
        return {
            users: [],
            sessions: [],
            accounts: [],
            verificationTokens: [],
            guideProfiles: [],
            guideListings: []
        };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(data);

    // Ensure arrays exist
    if (!db.guideProfiles) db.guideProfiles = [];
    if (!db.guideListings) db.guideListings = [];

    return db;
}

function saveDb(db: DatabaseSchema) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const db = {
    read: getDb,
    write: saveDb
};
