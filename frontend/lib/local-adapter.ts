
import { type Adapter } from "next-auth/adapters"
import fs from "fs"
import path from "path"

const dbPath = path.join(process.cwd(), "data", "db.json")

// Ensure data directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

// Initialize db if not exists
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], sessions: [], accounts: [], verificationTokens: [] }))
}

function readDb() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
}

function writeDb(data: any) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

export function LocalJSONAdapter(): Adapter {
    return {
        async createUser(user) {
            const db = readDb()
            const id = crypto.randomUUID()
            const newUser = { ...user, id }
            db.users.push(newUser)
            writeDb(db)
            return newUser
        },
        async getUser(id) {
            const db = readDb()
            return db.users.find((u: any) => u.id === id) || null
        },
        async getUserByEmail(email) {
            const db = readDb()
            return db.users.find((u: any) => u.email === email) || null
        },
        async getUserByAccount({ provider, providerAccountId }) {
            const db = readDb()
            const account = db.accounts.find((a: any) => a.provider === provider && a.providerAccountId === providerAccountId)
            if (!account) return null
            return db.users.find((u: any) => u.id === account.userId) || null
        },
        async updateUser(user) {
            const db = readDb()
            const index = db.users.findIndex((u: any) => u.id === user.id)
            if (index === -1) throw new Error("User not found")
            const updatedUser = { ...db.users[index], ...user }
            db.users[index] = updatedUser
            writeDb(db)
            return updatedUser
        },
        async deleteUser(userId) {
            const db = readDb()
            db.users = db.users.filter((u: any) => u.id !== userId)
            db.sessions = db.sessions.filter((s: any) => s.userId !== userId)
            db.accounts = db.accounts.filter((a: any) => a.userId !== userId)
            writeDb(db)
        },
        async linkAccount(account) {
            const db = readDb()
            db.accounts.push({ ...account, id: crypto.randomUUID() })
            writeDb(db)
            return account
        },
        async unlinkAccount({ provider, providerAccountId }) {
            const db = readDb()
            db.accounts = db.accounts.filter((a: any) => !(a.provider === provider && a.providerAccountId === providerAccountId))
            writeDb(db)
        },
        async createSession(session) {
            const db = readDb()
            db.sessions.push(session)
            writeDb(db)
            return session
        },
        async getSessionAndUser(sessionToken) {
            const db = readDb()
            const session = db.sessions.find((s: any) => s.sessionToken === sessionToken)
            if (!session) return null
            const user = db.users.find((u: any) => u.id === session.userId)
            if (!user) return null
            return { session, user }
        },
        async updateSession(session) {
            const db = readDb()
            const index = db.sessions.findIndex((s: any) => s.sessionToken === session.sessionToken)
            if (index === -1) return null
            const updatedSession = { ...db.sessions[index], ...session }
            db.sessions[index] = updatedSession
            writeDb(db)
            return updatedSession
        },
        async deleteSession(sessionToken) {
            const db = readDb()
            db.sessions = db.sessions.filter((s: any) => s.sessionToken !== sessionToken)
            writeDb(db)
        },
        async createVerificationToken(token) {
            const db = readDb()
            db.verificationTokens.push(token)
            writeDb(db)
            return token
        },
        async useVerificationToken({ identifier, token }) {
            const db = readDb()
            const index = db.verificationTokens.findIndex((t: any) => t.identifier === identifier && t.token === token)
            if (index === -1) return null
            const verificationToken = db.verificationTokens[index]
            db.verificationTokens.splice(index, 1) // Delete after use
            writeDb(db)
            return verificationToken
        },
    }
}
