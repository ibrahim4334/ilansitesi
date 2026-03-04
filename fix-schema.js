const fs = require('fs');

let oldSchema = fs.readFileSync('old_schema_utf8.prisma', 'utf8');

// The new models to append
const additions = `
// ─── Chat Moderation ────────────────────────────────────────────────────

model ChatMuteLog {
  id         String    @id @default(cuid())
  adminId    String
  userId     String
  muted      Boolean
  mutedUntil DateTime?
  reason     String    @db.Text
  createdAt  DateTime  @default(now())

  @@index([userId])
  @@index([adminId])
  @@map("chat_mute_logs")
}

// ─── Token Economy ──────────────────────────────────────────────────────

model TokenTransaction {
  id             String   @id @default(cuid())
  userId         String
  type           String   // "OFFER_SEND" | "DEMAND_UNLOCK" | "BOOST" | "REPUBLISH" | "PURCHASE" | "REFUND" | "ADMIN_GRANT" | "SUBSCRIPTION"
  amount         Int      // positive = grant, negative = spend
  reason         String   @db.Text
  relatedId      String?  // demandId, listingId, stripeSessionId
  idempotencyKey String?  @unique
  createdAt      DateTime @default(now())

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])                    // Balance + history
  @@index([userId, type])                         // "Bugün kaç teklif gönderdi?"
  @@index([type, createdAt])                      // Audit by type
  @@index([relatedId])                            // Idempotency lookups
  @@map("token_transactions")
}

// ─── Payment Webhooks ───────────────────────────────────────────────────

model WebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique
  eventType   String
  processedAt DateTime @default(now())
  status      String   @default("processed")
  error       String?  @db.Text

  @@index([processedAt])
  @@index([status])
  @@map("webhook_events")
}

// ─── Diyanet Badge Verification ─────────────────────────────────────────

model DiyanetApplication {
  id              String    @id @default(cuid())
  userId          String
  status          String    @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED" | "REVOKED"

  // ── Documents ──────────────────────────────────────────────
  idDocumentUrl   String    @db.Text            // Kimlik fotoğrafı URL
  certificateUrl  String    @db.Text            // Diyanet belgesi URL
  contactEmail    String                        // İletişim e-postası
  note            String?   @db.Text            // Başvuru notu

  // ── Admin Review ───────────────────────────────────────────
  reviewedBy      String?                       // Admin userId
  reviewedAt      DateTime?
  rejectionReason String?   @db.Text
  revokedReason   String?   @db.Text

  // ── Package Snapshot ───────────────────────────────────────
  packageAtApply  String                        // Başvuru anındaki paket

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])                             // Admin: "Bekleyen başvurular"
  @@index([status, createdAt])                  // Admin: sıralı liste
  @@map("diyanet_applications")
}

// ─── Reviews ────────────────────────────────────────────────────────────

model Review {
  id                    String    @id @default(cuid())
  guideId               String
  reviewerUserId        String
  requestId             String

  ratingCommunication   Int
  ratingKnowledge       Int
  ratingOrganization    Int
  ratingTimeManagement  Int
  overallRating         Decimal   @db.Decimal(2, 1)

  positiveTags          Json      @default("[]")
  negativeTags          Json      @default("[]")
  comment               String?   @db.VarChar(500)
  status                String    @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED"
  isVerified            Boolean   @default(true)

  ipHash                String?
  userAgentHash         String?

  createdAt             DateTime  @default(now())
  approvedAt            DateTime?
  deletedAt             DateTime?

  guide                 User      @relation("GuideReviews", fields: [guideId], references: [id], onDelete: Cascade)
  reviewer              User      @relation("UserReviews", fields: [reviewerUserId], references: [id], onDelete: Cascade)
  request               UmrahRequest @relation("DemandReviews", fields: [requestId], references: [id], onDelete: Cascade)

  @@unique([requestId, reviewerUserId])
  @@index([guideId])
  @@index([reviewerUserId])
  @@index([requestId])
  @@index([status])
  @@index([createdAt])
  @@map("reviews")
}
`;

// Inject into User model
let userInject = `
  tokenBalance       Int       @default(0)
  isDiyanetVerified  Boolean   @default(false)
  isApproved         Boolean   @default(false)
  fullName           String?
  city               String?
  bio                String?   @db.Text
  photo              String?
  trustScore         Int       @default(50)
  completedTrips     Int       @default(0)
  isMuted            Boolean   @default(false)
  mutedUntil         DateTime?

  tokenTransactions  TokenTransaction[]
  diyanetApplications DiyanetApplication[]
  reviewsReceived    Review[] @relation("GuideReviews")
  reviewsGiven       Review[] @relation("UserReviews")
  
  @@map("users")
`;

oldSchema = oldSchema.replace('@@map("users")', userInject);

// Write to final target
fs.writeFileSync('frontend/prisma/schema.prisma', oldSchema + additions, 'utf8');
console.log('Schema perfectly restored into frontend/prisma/schema.prisma');
