# Umre Buldum - Umrah Marketplace Platform

## 🌍 Project Overview
**Umre Buldum** is a specialized marketplace connecting Umrah pilgrims (Umreci) with trusted Guides and Organizations. The platform facilitates direct requests, tour listings, and secure communication, ensuring a transparent and quality experience for spiritual journeys.

## 🛠 Tech Stack
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Lucide Icons, Shadcn UI
- **Backend**: Headless WordPress (HivePress, Custom Plugins)
- **Database**: WordPress Database (MySQL) + Local JSON DB (for development/caching)
- **Authentication**: NextAuth.js (Custom Credential Provider)
- **Payments**: Stripe (Integrated via API)
- **Map/Location**: Custom City Data

## 👥 Roles & Permissions

| Role | Description | Key Features |
|------|-------------|--------------|
| **USER (Umreci)** | Pilgrims looking for tours | Search tours, Create requests, Chat with guides |
| **GUIDE (Rehber)** | Certified individual guides | Create listings, Bid on requests, Manage profile |
| **ORGANIZATION** | Travel agencies | Manage multiple listings, Agency branding, Team features |
| **SYSTEM** | Admin & Background jobs | Moderation, Billing, Notifications |

## 🔄 Core Flows

### 1. Onboarding
- Users register and select a role.
- Guides/Organizations must complete a profile and verification steps.
- **Middleware** enforces role-based access (`/guide`, `/org`, `/request`).

### 2. Listings (Tours)
- Guides create detailed tour packages.
- **Search**: Advanced filtering by city, date, price, and "Diyanet Approved" status.
- **Featured**: Premium listings appear at the top.

### 3. Requests (Talep)
- Users submit specific needs (Date, Budget, Person count).
- Guides view requests in their dashboard and express interest.
- System limits "Interest" expressions based on Credits.

### 4. Monetization (Credits & Subscriptions)
- **Freemium**: Limited interactions.
- **Pro/Agency**: Subscription tiers unlock higher quotas, featured listings, and lower fees.
- **Credits**: Purchased via Stripe to "bid" on user requests.

## 🚀 Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   # or
   pnpm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in `frontend/`:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 💳 Stripe Test Mode
The project is configured for Stripe Test Mode.
- **Card**: `4242 4242 4242 4242`
- **Date**: Any future date
- **CVC**: Any 3 digits

## 📂 Folder Structure
```
frontend/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── dashboard/       # Guide/Org Dashboard (Chats, Listings, Billing)
│   ├── guide/           # Public Guide Profiles
│   ├── request/         # User Request Flow
│   ├── search/          # Search Results
│   ├── tours/           # Tour Listings (Server-Side)
│   └── api/             # Backend Proxy Routes
├── components/
│   ├── ui/              # Shadcn UI Components
│   ├── dashboard/       # Dashboard Widgets
│   ├── monetization/    # Credit & Billing Components
│   └── ...
├── lib/
│   ├── auth.ts          # Auth Logic
│   ├── db.ts            # Local JSON DB Adapter
│   └── utils.ts         # Helpers
```

## 🗺 Roadmap

- [x] **Phase 1-6**: Core Marketplace, Auth, Listings, Requests, Basic Billing.
- [ ] **Phase 7**: Mobile App Functionality (PWA check).
- [ ] **Phase 8**: Advanced Trust Score & Reviews.
- [ ] **Phase 9**: Admin Panel, Poster System, PDF Export.
