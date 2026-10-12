# 🛡️ FinSight — Personal Financial Intelligence & Decision Platform

**FinSight** is a production-grade Personal Financial Intelligence & Decision Platform that transforms traditional retrospective expense logging into real-time financial decision science. Built with **Spring Boot 3.2 (Java 17/21)**, **MySQL 8**, and **React 18 (Vite + Tailwind CSS)**, FinSight answers the four fundamental questions of wealth management:

1. **UNDERSTAND**: *What happened to my money?* (Real-time financial pulse, multi-account liquid balances, 6-month cash-flow dynamics, and category allocations)
2. **EXPLAIN**: *Why did my financial situation change?* (Natural language narrative generation, $z$-score anomaly detection, variance analysis)
3. **PREDICT**: *What will happen if I continue on this path?* (4-factor weighted forecasting engine, category budget risk radar, normalized recurring commitments)
4. **DECIDE**: *What happens if I make a different decision?* ("Can I Afford It?" purchase simulator, What-If scenario engine, Digital Twin trajectories)

---

## ✨ Key Platform Features

### 1. 🛡️ Statistical Financial Health Engine 2.0
- **5-Pillar Weighted Scoring Model**:
  - **Savings Rate (25%)**: Rewards positive surplus, penalizes deficit spend.
  - **Budget Discipline (25%)**: Real-time category cap compliance and rollover auditing.
  - **Expense Stability (20%)**: Mathematical Mean ($\mu$), Standard Deviation ($\sigma$), and Coefficient of Variation ($CV$) across rolling historical windows.
  - **Goal Progress (15%)**: Weighted pace tracking against milestone target dates.
  - **Recurring Obligation Ratio (15%)**: Frequency-normalized subscription and fixed commitment burn rate.
- Maintains a 4-month historical health timeline with actionable diagnostic recommendations.

### 2. ⚖️ Signature Feature: Financial Decision Center ("Can I Afford It?")
- Purchase affordability simulator that evaluates:
  - Immediate balance impact across liquid checking and savings accounts.
  - **3-Month Essential Living Reserve Buffer**: Prevents purchases that breach emergency living expenses.
  - Goal delay calculation (quantifying the exact penalty in delayed months for active savings goals).
  - Health score delta impact.
  - Actionable recommendation verdict (`SAFE_TO_BUY`, `PROCEED_WITH_CAUTION`, `NOT_RECOMMENDED`).

### 3. 🏦 Atomic Multi-Account Transfers & Balance Synchronization
- Dedicated **`TRANSFER`** transaction type supporting distinct source and destination accounts.
- **Atomic Balance Updates**: Debits source account and credits destination account simultaneously within a database transaction.
- **Automatic Reversal**: Accurately reverses both account impacts upon transaction edit or deletion.
- Supports **Checking**, **Savings**, **Credit Card**, **Investment**, **Cash**, and **Wallet** accounts with live balance indicators.

### 4. 🔮 4-Factor Weighted Forecasting Engine
- Blends **Daily Discretionary Run Rate (40%)**, **3-Month Historical Average (30%)**, **Velocity Trend (20%)**, and **Frequency-Normalized Recurring Commitments (10%)**.
- Separates one-time recurring bills (like rent paid on day 1) from daily variable spend to eliminate projection distortion and run-rate explosion.
- Dynamically assigns confidence levels (`Low`, `Medium`, `High`) and produces a Category Budget Risk Radar (`SAFE`, `WATCH`, `AT_RISK`, `EXCEEDED`).

### 5. 📊 Dynamic Cash Flow Dynamics & Category Breakdown
- **6-Month Rolling Timeline**: Visualizes cash-flow dynamics across the last 6 months (Income vs Expenses) with Recharts composed bars.
- **Dual-Scope Category Allocation**: Interactive donut chart supporting both **Selected Month** and **All-Time** scopes.
- **Smart Quick-Switch Banner**: Automatically detects prior active months (e.g., September) when viewing a blank or new month (October), allowing 1-click historical switching.

### 6. 📖 Natural Language Story Generation (NLG)
- Synthesizes monthly income, expense deltas, and category shifts into plain-English financial narratives without external LLM dependencies.
- Generates headlines, narrative breakdowns, and key takeaways grounded directly in verified database numbers.

### 7. 🤖 Grounded Financial Copilot
- Conversational AI drawer assistant with query suggestion chips (*"Why did my expenses increase?"*, *"Where did I spend the most?"*, *"Can I afford a laptop?"*).
- Grounded strictly in authenticated user tools (`FinancialTools.java`) with zero AI hallucinations.

### 8. 🛡️ Duplicate Transaction Detection & File Imports
- **Batch Imports**: Supports CSV and Excel transaction file imports.
- **Duplicate Prevention**: Checks historical records and intra-batch items (`date + amount + description`) to eliminate accidental duplicate transactions.
- **Export**: PDF statement generation (iText) and Excel export (Apache POI).

### 9. 🎛️ What-If Scenario Simulator & Digital Twin
- **Scenario Simulator**: Interactive parameter sliders for salary adjustments, rent changes, monthly savings boosts, and category spending cuts with side-by-side baseline comparison.
- **Financial Digital Twin**: Projects 1, 3, 6, and 12-month wealth paths comparing **Current Trajectory** vs. **Optimized Trajectory**.

### 10. 🎨 Institutional Dark Fintech UX
- Tailored color tokens (deep navy `#070b14`, elevated cards `#0f172a`, emerald income `#10b981`, rose expenses `#f43f5e`, and violet accents `#6366f1`).
- Custom dark scrollbars, notification badges, unified responsive sidebar, and mobile bottom navigation.
- Grounded error boundaries: No fake fallbacks (score 75 or $0 balances); truthful error states with instant retry and session renewal.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 17 / 21, Spring Boot 3.2.0, Spring Security (JWT), Spring Data JPA, Hibernate 6 |
| **Database** | MySQL 8.0+ / Cloud Serverless (TiDB Cloud) |
| **Document/Export** | Apache POI 5 (Excel), iText 5 (PDF), OpenCSV |
| **Frontend** | React 18, Vite 8, Tailwind CSS, Recharts, Lucide Icons, Axios, React Hot Toast |
| **DevOps & Cloud** | Multi-Stage Docker, Render (Cloud PaaS), Alpine JRE 17 |
| **Architecture** | RESTful API, Controller-Service-Repository Pattern, JWT Stateless Authentication |

---

## 📁 Project Directory Structure

```text
finance-tracker/
├── Dockerfile                     # Multi-stage Docker build (Node + Maven + Alpine JRE)
├── .dockerignore                  # Docker build exclusions
├── render.yaml                    # Render cloud deployment blueprint
├── backend/                       # Spring Boot 3.2 Java Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/finance/
│   │   │   │   ├── account/       # Account management & atomic balance sync
│   │   │   │   ├── analytics/     # Health engine, forecasting, decision center, twin
│   │   │   │   ├── auth/          # JWT auth, login, registration, OTP verification
│   │   │   │   ├── budget/        # Category budgets, rollover & multi-tenant security
│   │   │   │   ├── category/      # Category management & auto-seeder
│   │   │   │   ├── config/        # Security, JWT filter, 401 EntryPoint, SPA WebMvc
│   │   │   │   ├── copilot/       # Fact-grounded tool execution assistant
│   │   │   │   ├── experiment/    # 30-day behavioral savings challenges
│   │   │   │   ├── goal/          # Savings goals & pace predictions
│   │   │   │   ├── recurring/     # Frequency-normalized obligations
│   │   │   │   ├── report/        # PDF & Excel export services
│   │   │   │   ├── transaction/   # Transfers, search, multi-filter, CSV/Excel import
│   │   │   │   └── user/          # User entity & repositories
│   │   │   └── resources/
│   │   │       ├── application.properties   # Cloud-ready environment configuration
│   │   │       └── static/                  # Production-bundled React SPA assets
│   │   └── test/                  # Automated JUnit 5 Unit Test Suites (12 tests)
│   │       ├── analytics/         # FinancialHealthServiceTest, DecisionCenterServiceTest
│   │       ├── budget/            # BudgetServiceTest (ownership isolation)
│   │       ├── recurring/         # RecurringCostNormalizerTest
│   │       └── transaction/       # TransactionServiceTest (atomic transfers & duplicates)
│   └── pom.xml
│
└── frontend/                      # React 18 + Vite Frontend
    ├── src/
    │   ├── components/            # Layout, Navigation, CopilotWidget
    │   ├── context/               # AuthContext (JWT & user state)
    │   ├── pages/                 # Dashboard, Transactions, Accounts, Budgets, Goals,
    │   │                          # DecisionCenter, Forecast, Subscriptions, Health, Settings
    │   ├── services/              # Axios API client (/api/*) with 401/403 auto-logout
    │   ├── App.jsx                # React Router DOM sitemap
    │   ├── main.jsx               # React DOM entry point
    │   └── index.css              # Custom dark theme directives
    ├── index.html
    ├── vite.config.js             # Vite proxy (port 5055 -> 8082) & static outDir
    ├── tailwind.config.js         # Dark fintech design system tokens
    └── package.json
```

---

## 🧪 Automated Testing Suite

FinSight includes **12 automated unit tests** covering critical financial logic, security boundaries, and transfer atomicity:

```bash
cd backend
mvn test
```

### Verified Test Suites:
1. **`TransactionServiceTest`**:
   - `testTransfer_DebitsSourceAndCreditsDestination`: Verifies simultaneous debit of source and credit of destination.
   - `testTransfer_SameAccount_ThrowsException`: Rejects attempts to transfer to the same account.
   - `testDeleteTransfer_ReversesBalancesCorrectly`: Ensures balance reversal when a transfer is removed.
   - `testImportCsv_SkipsDuplicates`: Confirms duplicate batch records are discarded without corrupting ledger.
2. **`FinancialHealthServiceTest`**:
   - `testZeroIncome_DoesNotThrowAndCalculatesSensibly`: Tests edge-case zero income stability.
   - `testNegativeSavingsRate_PenalizesScoreAppropriately`: Validates score degradation on deficit spending.
   - `testHighSavingsRate_CalculatesExpectedScore`: Tests maximum-tier savings rate reward.
3. **`DecisionCenterServiceTest`**:
   - `testPurchaseAffordability_ReserveBreach_AlertsUser`: Alerts users if a purchase breaches the 3-month essential living fund.
   - `testPurchaseAffordability_WithinSafeLimit`: Approves purchases that preserve liquid buffers.
4. **`BudgetServiceTest`**:
   - `testDelete_DifferentUser_ThrowsSecurityException`: Enforces multi-tenant isolation, preventing unauthorized deletion.
   - `testDelete_SameUser_DeletesSuccessfully`: Validates owner deletion access.
5. **`RecurringCostNormalizerTest`**:
   - Validates monthly normalization math across daily, weekly, monthly, and yearly cycles.

---

## 🚀 Running Locally

### Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18.0 or higher
- **MySQL**: 8.0 or higher
- **Maven**: 3.8+

### Step 1: Database Setup
1. Create a MySQL database:
   ```sql
   CREATE DATABASE finance_tracker;
   ```
2. Set environment variables (or rely on defaults in `application.properties`):
   - `DB_URL`: `jdbc:mysql://localhost:3306/finance_tracker`
   - `DB_USERNAME`: `root`
   - `DB_PASSWORD`: `YOUR_MYSQL_PASSWORD`

### Step 2: Start the Backend
```bash
cd backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8082`.*

### Step 3: Start the Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server runs on `http://localhost:5055`.*

---

## 🌐 100% Free Cloud Deployment Guide

FinSight is configured for **unified full-stack cloud deployment**: the Spring Boot container serves both the secured REST API and the bundled React SPA from a single port.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: complete FinSight platform ready for cloud deployment"
git push origin main
```
*(Your repository is linked to `https://github.com/naznin21/finsight-finance-tracker.git`)*

---

### Step 2: Create Free MySQL Database (60 Seconds)
Use **[TiDB Cloud](https://tidbcloud.com/)** (Free Serverless tier, 5GB storage forever, 100% MySQL 8 compatible):
1. Sign up with your GitHub account (`naznin21`).
2. Click **Create Cluster** -> Select **Serverless** (Free forever) -> Click **Create**.
3. Click **Connect** -> Choose **Java (JDBC)** -> Generate Password.
4. Note your parameters:
   - **JDBC URL**: `jdbc:mysql://<your-tidb-host>:4000/finance_tracker?sslMode=VERIFY_IDENTITY`
   - **User**: `<your-tidb-user>`
   - **Password**: `<your-tidb-password>`

---

### Step 3: Deploy Free on Render.com & Get Public URL
1. Sign in to **[Render.com](https://render.com/)** with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository: **`naznin21/finsight-finance-tracker`**.
4. Render will automatically detect the root **`Dockerfile`**.
5. Set:
   - **Name**: `finsight-tracker`
   - **Region**: Closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Instance Type**: **Free**
6. Under **Environment Variables**, add:
   - `DB_URL`: `jdbc:mysql://<your-tidb-host>:4000/finance_tracker?sslMode=VERIFY_IDENTITY`
   - `DB_USERNAME`: `<your-tidb-user>`
   - `DB_PASSWORD`: `<your-tidb-password>`
   - `JWT_SECRET`: Any random 32+ character string
7. Click **Deploy Web Service**!
8. In ~3 minutes, your live public link will be active:
   👉 **`https://finsight-tracker.onrender.com`**

---

## 💼 LinkedIn Post Template (Copy & Paste Ready)

```markdown
🚀 Excited to launch FinSight — Personal Financial Intelligence & Decision Platform!

Most expense trackers simply tell you where your money went after it's already gone. I wanted to engineer something proactive: a system that answers "Can I afford this purchase right now without putting my emergency fund or 6-month goals at risk?"

Over the past few weeks, I designed and built FinSight, an institutional-grade financial decision science platform featuring a modern Dark Fintech UX.

💡 Key Highlights & Engineering Challenges Solved:
🔹 Financial Decision Center ("Can I Afford It?"): Evaluates proposed purchases in real-time by analyzing liquid reserves, calculating goal delay penalties, and enforcing a 3-month essential burn buffer.
🔹 4-Factor Weighted Forecasting: Combines daily discretionary run-rates with normalized recurring commitments to prevent end-of-month projection distortions.
🔹 Grounded Financial Copilot: Built a tool-grounded AI conversational assistant that queries authorized backend data services directly with zero hallucinations.
🔹 Atomic Transaction Engine: Supports internal multi-account transfers with automatic bidirectional ledger synchronization and rollback on edits/deletions.
🔹 Institutional Dark UX: Custom design system built with React 18, Vite, Tailwind CSS, and responsive Recharts cash-flow visualizations.

🛠️ Tech Stack:
• Backend: Java 17, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA, Hibernate 6
• Database: Cloud Serverless MySQL 8
• Frontend: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
• DevOps & Cloud: Multi-stage Docker, Render (Cloud PaaS), REST APIs

🔗 Live Demo: https://finsight-tracker.onrender.com
📂 GitHub Repo: https://github.com/naznin21/finsight-finance-tracker

I’d love to hear your thoughts, feedback, and suggestions in the comments!

#Java #SpringBoot #ReactJS #FullStackDevelopment #Fintech #WebDevelopment #SoftwareEngineering #OpenSource #PortfolioProject
```

---

## 📜 License
This project is open-source under the MIT License.
