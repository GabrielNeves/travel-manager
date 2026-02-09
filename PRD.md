# Travel Manager - Product Requirements Document (PRD)

## 1. Executive Summary

**Product Name:** Travel Manager
**Version:** 1.0
**Author:** Gabriel Neves
**Last Updated:** January 2026

Travel Manager is a flight price tracking application that helps frequent travelers find the best deals on airline tickets. The application monitors flight prices periodically and notifies users when prices drop below their defined thresholds via WhatsApp, push notifications, and in-app alerts.

---

## 2. Problem Statement

Frequent travelers spend significant time manually checking flight prices across multiple dates and routes. Price fluctuations are unpredictable, and missing a price drop can result in paying hundreds of reais more than necessary. Current solutions either lack localized support for Brazilian domestic flights or require expensive subscriptions.

**Target User:** Budget-conscious frequent travelers in Brazil who want to automate flight price monitoring and receive timely alerts for price drops.

---

## 3. Goals & Objectives

### Primary Goals
- Automate flight price monitoring for user-defined routes
- Notify users immediately when prices drop below thresholds
- Provide price history visualization for informed decision-making
- Integrate with calendar for post-purchase travel planning

### Success Metrics
- User receives price alert within 6 hours of a price drop
- 90%+ notification delivery success rate
- User saves money by purchasing at lower prices (tracked via purchase feature)

---

## 4. User Personas

### Primary Persona: Frequent Domestic Traveler
- Travels more than 15 times per year, mostly domestic Brazil
- Price-sensitive, willing to adjust dates for better deals
- Tech-savvy, comfortable with web applications
- Uses WhatsApp as primary communication channel
- Wants to share the app with family and friends later

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

| Feature | Description |
|---------|-------------|
| Google OAuth | Sign in with Google account |
| Email/Password | Traditional authentication with email verification |
| Email Verification | Token-based email verification flow sent on registration |
| Password Reset | Forgot password flow via email with secure reset token |
| Change Password | Authenticated users can update their current password |
| Delete Account | Self-service account deletion with confirmation |
| User Profile | Name, language preference, phone number (WhatsApp) |
| Multi-user Support | Independent accounts, all users have equal permissions |

### 5.2 Flight Tracking

#### 5.2.1 Create Flight Alert

**Required Fields:**

| Field | Type | Description |
|-------|------|-------------|
| Departure City | Text + Autocomplete | City name with airport suggestions |
| Departure Airport Code | Optional | Specific departure airport (e.g., CGH, GRU) |
| Destination City | Text + Autocomplete | City name with airport suggestions |
| Destination Airport Code | Optional | Specific destination airport (e.g., FLN, POA) |
| Trip Type | Select | One-way or Round-trip |
| Departure Date | Date/Range | Exact date OR flexible date range |
| Departure Day Shift | Multi-select | Morning, Afternoon, Night preference for outbound flight |
| Return Date | Date/Range | Optional for round-trip, exact or flexible |
| Return Day Shift | Multi-select | Morning, Afternoon, Night preference for return flight (round-trip only) |
| Price Threshold | Currency (BRL) | Maximum price to trigger alert |
| Airline Filter | Optional Multi-select | Specific airlines or "Any" |
| Max Flight Duration | Optional Time | Maximum acceptable flight duration (e.g., 3h) |
| Check Frequency | Select | How often to check (default: 6 hours) |

**Check Frequency Options:** 1 hour, 3 hours, 6 hours (default), 12 hours, 24 hours

**Flight Duration Filter:** Allows users to exclude flights with long layovers or excessive travel time. The Amadeus API returns total journey duration, enabling filtering before displaying results.

#### 5.2.2 Flight Alert Management
- View all active alerts with current lowest price
- Edit alert parameters
- Pause/Resume alerts
- Delete alerts
- View alert history (triggered notifications)

### 5.3 Price History & Analytics

| Feature | Description |
|---------|-------------|
| Price History Chart | Line chart showing price over time (90-day retention) |
| Lowest Price Indicator | Highlight historical low price point |
| Price Trend | Visual indicator if price is rising/falling/stable |
| Export Data | Download price history as CSV |

### 5.4 Notifications

#### 5.4.1 Notification Channels (User Configurable)

| Channel | Description |
|---------|-------------|
| In-App | Badge and notification center within the app |
| WhatsApp | Via Evolution API integration |
| Push Notification | Browser/PWA push notifications |

#### 5.4.2 Notification Triggers
- Price drops below user-defined threshold
- Price hits historical low (optional setting)

#### 5.4.3 Notification Rate Limiting
- **Maximum 1 notification per day per flight alert** to avoid notification fatigue
- If multiple price drops occur within 24 hours, only the first triggers a notification
- Users can view all price changes in the app's price history regardless of notification limits
- Rate limit resets at midnight in user's configured time zone

#### 5.4.4 Notification Content
```
🎉 *ALERTA DE PREÇO!*

✈️ *Rota:* São Paulo (CGH) → Florianópolis (FLN)
📅 *Data:* 15/03/2026 (Manhã)
💰 *Preço Encontrado:* R$ 289,00
🎯 *Seu Limite:* R$ 350,00
✅ *Economia:* R$ 61,00 (17%)
🏢 *Companhia:* LATAM

🔗 *Link:* [booking link]

⏰ 26/01/2026 15:30
```

### 5.5 Purchase & Calendar Integration

| Feature | Description |
|---------|-------------|
| Mark as Purchased | Button to indicate flight was bought |
| Purchase Details | Price paid, booking reference (optional) |
| Calendar Event Creation | Create Google Calendar events with flight details |

**Calendar Event Details:**
- **One event per flight segment:** For round-trip, creates two separate calendar events (outbound and return)
- **Event Title:** "✈️ Voo: [Departure] → [Destination]"
- **Date/Time:** Flight departure time
- **Description:** Departure city, arrival city, airline, booking reference (if provided)
- **Event Notifications:**
  - 2 days before: Reminder for online check-in opening
  - 2 hours before: Reminder before flight departure

### 5.6 Settings

| Setting | Description |
|---------|-------------|
| Language | Portuguese (default), English |
| Country | User's country for holiday calendar (default: Brazil) |
| Notification Preferences | Enable/disable each channel |
| WhatsApp Number | Phone for WhatsApp notifications |
| Default Check Frequency | Default for new alerts |
| Time Zone | For correct notification times |

**Holiday Calendar:** The date picker throughout the application displays national holidays based on the user's selected country. This helps users identify good travel dates (e.g., long weekends) and avoid peak pricing periods.

### 5.7 Dashboard

- Summary of active alerts
- Recent price changes
- Upcoming tracked flights
- Quick actions (create alert, view notifications)

---

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   Node.js API   │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │ Evolution │ │  Flight   │ │  Google   │
            │    API    │ │ Data API  │ │ Calendar  │
            │(WhatsApp) │ │ (Amadeus) │ │    API    │
            └───────────┘ └───────────┘ └───────────┘
```

### 6.2 Backend Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.x |
| Framework | Fastify |
| ORM | Prisma |
| Job Scheduler | BullMQ (Redis-backed) |
| Authentication | Passport.js (Google OAuth + Local) |
| Validation | Zod |
| API Documentation | OpenAPI/Swagger |

### 6.3 Frontend Stack

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Language | TypeScript 5.x |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Design System | Shadcn/ui |
| State Management | TanStack Query + Zustand |
| Charts | Recharts |
| Internationalization | i18next |
| Forms | React Hook Form + Zod |

### 6.4 Infrastructure

| Component | Technology |
|-----------|------------|
| Local Development | Docker Compose |
| Cloud Provider | Google Cloud Platform |
| Container Orchestration | Cloud Run |
| Database Hosting | Cloud SQL (PostgreSQL) |
| Cache/Queue | Cloud Memorystore (Redis) |
| IaC | Terraform |
| CI/CD | GitHub Actions |

---

## 7. Database Choice: PostgreSQL

### Rationale
1. **Structured Data:** Flight alerts, users, and price history have well-defined schemas
2. **Complex Queries:** Price analytics benefit from SQL's aggregation capabilities
3. **Time-Series:** Price history is inherently time-series data; PostgreSQL handles this well
4. **GCP Integration:** Cloud SQL provides managed PostgreSQL with automatic backups
5. **Prisma Support:** Excellent TypeScript integration with type-safe queries
6. **Cost:** Within $10/month budget on Cloud SQL basic tier

---

## 8. Design System Choice: Shadcn/ui

### Rationale
1. **Free & Open Source:** No licensing concerns or feature limitations
2. **Tailwind Native:** Perfect integration with chosen CSS framework
3. **Copy-Paste Model:** Components are copied into project, full control
4. **Modern Design:** Clean, professional aesthetic matching "modern, impeccable, friendly UI"
5. **Accessibility:** Built on Radix UI primitives, WCAG compliant
6. **Bundle Optimization:** Only includes components actually used
7. **Active Community:** Large community, frequent updates, many examples

### Complementary Libraries
- **Lucide React:** Icon library (used by shadcn/ui)
- **Framer Motion:** Animations
- **React Day Picker:** Date selection (integrated with shadcn/ui)
- **date-holidays:** Holiday data for calendar date picker (supports 200+ countries)

---

## 9. Flight Data Source: Amadeus Self-Service API

### Rationale
1. **Official GDS Data:** Direct access to airline inventory (LATAM, GOL, Azul)
2. **Brazil Coverage:** Excellent domestic Brazil coverage
3. **Free Tier:** 2,000 API calls/month (sufficient for 5-15 routes × 4 checks/day)
4. **Reliable:** No risk of blocking or ToS violations
5. **Rich Data:** Returns detailed flight information (times, airlines, stops)
6. **Production Ready:** Easy upgrade path if usage grows

### API Endpoints
- `GET /shopping/flight-offers` - Search for flights
- `GET /reference-data/locations` - Airport/city autocomplete

### Cost Control

Amadeus does not offer built-in spending caps. To prevent unexpected billing in production, the application implements a client-side monthly API call counter:

- **Storage:** Redis key per calendar month, auto-expires after 35 days
- **Configurable limit:** `AMADEUS_MONTHLY_CALL_LIMIT` env var (default: 2,000)
- **Behavior when limit reached:** Price check jobs are skipped (not lost — alerts are rescheduled for next cycle). Warning logged at 80% usage, error logged when limit is hit.
- **Monitoring:** Current usage count available for admin/settings UI

### Fallback Option
Kiwi.com Tequila API as secondary source for price comparison

---

## 10. API Specification

### Authentication
```
POST /api/auth/register          - Email/password registration
POST /api/auth/login             - Email/password login
GET  /api/auth/google            - Google OAuth initiate
GET  /api/auth/google/callback   - Google OAuth callback
POST /api/auth/refresh           - Refresh access token (via HttpOnly cookie)
POST /api/auth/logout            - Logout
GET  /api/auth/me                - Current user
POST /api/auth/verify-email      - Verify email with token
POST /api/auth/forgot-password   - Request password reset email
POST /api/auth/reset-password    - Reset password with token
POST /api/auth/change-password   - Change password (authenticated)
DELETE /api/auth/account         - Delete account (authenticated)
```

### Flight Alerts
```
GET    /api/alerts             - List user's alerts
POST   /api/alerts             - Create new alert
GET    /api/alerts/:id         - Get alert details
PUT    /api/alerts/:id         - Update alert
DELETE /api/alerts/:id         - Delete alert
POST   /api/alerts/:id/pause   - Pause alert
POST   /api/alerts/:id/resume  - Resume alert
```

### Price Data
```
GET /api/alerts/:id/prices     - Get price history for alert
GET /api/alerts/:id/current    - Get current lowest price
```

### Notifications
```
GET  /api/notifications              - List notifications
POST /api/notifications/:id/read     - Mark as read
GET  /api/notifications/unread-count - Get unread notification count
```

### Airports
```
GET /api/airports/search       - Airport/city autocomplete (query: ?q=...)
```

### Settings
```
GET  /api/settings             - Get user settings
PUT  /api/settings             - Update settings
POST /api/settings/test-whatsapp - Test WhatsApp connection
```

### Calendar
```
POST /api/calendar/event       - Create calendar event
```

---

## 11. Non-Functional Requirements

### Performance
- API response time: < 500ms (p95)
- Price check completion: < 30 seconds per alert
- Dashboard load time: < 2 seconds

### Scalability
- Support 100+ concurrent users
- Handle 1000+ active alerts
- Price history storage: 90 days per alert

### Security
- HTTPS only
- JWT tokens with refresh mechanism
- Rate limiting: 100 requests/minute per user
- Input validation on all endpoints
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React default escaping)

### Availability
- 99% uptime target
- Graceful degradation if flight API unavailable
- Notification retry mechanism (3 attempts)

### Internationalization
- UI fully translated: Portuguese (pt-BR), English (en-US)
- Currency: BRL formatting
- Date format: locale-aware

---

## 12. Testing Strategy

### Unit Tests
- Business logic (price comparison, threshold checks)
- Utility functions (formatters, validators)
- Coverage target: 80%+

### Integration Tests
- API endpoint testing
- Database operations
- External API mocking (Amadeus, Evolution)

### End-to-End Tests (Playwright)
- User registration/login flow
- Create flight alert flow
- Notification display
- Settings management
- Mobile responsive testing

---

## 13. Implementation Phases

### Phase 1: Foundation (MVP)
- [x] Project setup (monorepo with Turborepo)
- [x] Database schema design and Prisma setup
- [x] Authentication (Google OAuth + Email/Password)
- [x] Basic UI structure with shadcn/ui
- [x] User settings page

### Phase 2: Core Features
- [x] Flight alert CRUD
- [x] Amadeus API integration
- [x] Flight alerts frontend (list, create, edit, detail)
- [ ] Price check scheduler (BullMQ)
- [ ] Price history storage & frontend
- [ ] In-app notifications backend
- [ ] Notifications frontend & sidebar badge

### Phase 3: Notifications & Analytics
- [ ] WhatsApp integration (Evolution API)
- [ ] Push notifications (Web Push API)
- [ ] Price history chart
- [ ] Dashboard with analytics

### Phase 4: Calendar & Polish
- [ ] Purchase tracking
- [ ] Google Calendar integration
- [ ] Internationalization (pt-BR, en-US)
- [ ] Mobile responsive optimization
- [ ] Performance optimization

### Phase 5: Infrastructure & Launch
- [ ] Docker containerization
- [ ] Terraform GCP configuration
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Migrate Amadeus API from test to production environment (update BASE_URL and API credentials)
- [ ] Production deployment

### Phase 6: Auth Hardening
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Change password (authenticated)
- [ ] Delete account (self-service)

---

## 14. Project Structure

```
travel-manager/
├── apps/
│   ├── api/                    # Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── alerts/
│   │   │   │   ├── notifications/
│   │   │   │   ├── prices/
│   │   │   │   └── settings/
│   │   │   ├── services/
│   │   │   │   ├── amadeus/
│   │   │   │   ├── evolution/
│   │   │   │   └── calendar/
│   │   │   ├── jobs/
│   │   │   └── lib/
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── web/                    # Frontend
│       ├── src/
│       │   ├── components/
│       │   │   └── ui/         # shadcn/ui components
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── stores/
│       │   └── i18n/
│       └── public/
│
├── packages/
│   └── shared/                 # Shared types, utils
│
├── infrastructure/
│   └── terraform/
│
├── docker-compose.yml
└── package.json
```

---

## 15. Verification Plan

After implementation, verify the system works end-to-end:

1. **Auth Flow:** Register → Login → View profile
2. **Alert Creation:** Create alert → Verify in database → See in UI
3. **Price Check:** Manually trigger check → Verify Amadeus call → Store price
4. **Notification:** Set low threshold → Trigger check → Receive WhatsApp + Push
5. **Calendar:** Mark purchased → Create event → Verify in Google Calendar
6. **i18n:** Switch language → Verify all UI updates

---

## Appendix A: Evolution API Configuration

Based on existing price-monitor implementation:

```env
# Evolution API Configuration
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_api_key
EVOLUTION_INSTANCE=travel-manager
WHATSAPP_PHONE=5548999999999
```

**Endpoint:** `POST /message/sendText/{instanceName}`

```typescript
// Example notification service
async function sendWhatsAppAlert(phone: string, message: string) {
  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    }
  );
  return response.ok;
}
```

---

## Appendix B: Amadeus API Integration

**Authentication:** OAuth2 Client Credentials

```typescript
// Get access token
const tokenResponse = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
});

// Search flights
const flights = await fetch(
  'https://api.amadeus.com/v2/shopping/flight-offers?' +
  `originLocationCode=CGH&destinationLocationCode=FLN&departureDate=2026-03-15&adults=1`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
```

---

*This PRD serves as the authoritative reference for building the Travel Manager application.*
