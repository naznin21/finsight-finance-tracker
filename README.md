# 🛡️ FinSight — Personal Financial Intelligence & Decision Platform

**FinSight** is a recruiter-ready Personal Financial Intelligence & Decision Platform that transforms traditional expense tracking into real-time financial decision science. Built with **Spring Boot 3.2 (Java 17/21)** and **React 18 (Vite + Tailwind CSS)**, FinSight answers the four fundamental financial questions:

1. **UNDERSTAND**: *What happened to my money?* (Real-time pulse, multi-account liquidity, category breakdown)
2. **EXPLAIN**: *Why did my financial situation change?* (Natural language story generation, $z$-score anomaly detection, variance analysis)
3. **PREDICT**: *What will happen if I continue on this path?* (4-input weighted forecasting engine, category budget risk radar)
4. **DECIDE**: *What happens if I make a different decision?* ("Can I Afford It?" purchase evaluator, What-If simulator, Digital Twin trajectories)

---

## ✨ Key Platform Features

### 1. 🛡️ Statistical Financial Health Engine 2.0
- Multi-pillar scoring model evaluating **Savings Rate (25%)**, **Budget Discipline (25%)**, **Expense Volatility (20%)**, **Goal Pace (15%)**, and **Recurring Ratio (15%)**.
- Calculates mathematical Mean ($\mu$), Standard Deviation ($\sigma$), and Coefficient of Variation ($CV$).
- Maintains a 4-month historical health trend timeline.

### 2. 📖 Natural Language Story Generation (NLG)
- Synthesizes monthly income, expense deltas, and category shifts into plain-English financial stories without external LLM dependencies.
- Generates headlines, narrative breakdowns, and key takeaways grounded in actual database figures.

### 3. ⚖️ Signature Feature: Financial Decision Center ("Can I Afford It?")
- Purchase affordability calculator that evaluates:
  - Immediate balance impact
  - Cash-flow buffer safety
  - Goal delay calculation (in months)
  - Health score impact (delta points)
  - Actionable recommendation (`SAFE_TO_BUY`, `PROCEED_WITH_CAUTION`, `NOT_RECOMMENDED`).

### 4. 🔮 4-Factor Weighted Forecasting Engine
- Blends **Daily Run Rate (40%)**, **3-Month Historical Average (30%)**, **Velocity Trend (20%)**, and **Normalized Recurring Commitments (10%)**.
- Dynamically assigns confidence levels (`Low`, `Medium`, `High`) and produces a Category Budget Risk Radar (`SAFE`, `WATCH`, `AT_RISK`, `EXCEEDED`).

### 5. 🎛️ What-If Scenario Simulator & Digital Twin
- **Scenario Simulator**: Live parameter sliders for salary adjustments, rent changes, monthly savings boosts, and category spending cuts with side-by-side baseline comparison.
- **Financial Digital Twin**: Projects 1, 3, 6, and 12-month wealth paths comparing **Current Trajectory** vs. **Optimized Trajectory**.

### 6. 🏆 Behavioral Experiments & Challenges
- 30-day financial experiments (e.g., *No-Takeout Month*, *Zero Impulse Buying*, *50/30/20 Rule Challenge*).
- Real-time progress tracking grounded in actual category spending from the database.

### 7. 🏦 Multi-Account & Real-Time Balance Sync
- Supports **Checking**, **Savings**, **Credit Card**, **Investment**, **Cash**, and **Wallet** accounts.
- Automatically recalculates account balances upon transaction creation, edit, and deletion.

### 8. 🤖 Fact-Grounded Financial Copilot
- Tool-grounded AI drawer assistant executing strict database tools (`FinancialTools.java`) with zero AI hallucinations.

### 9. 📁 Dynamic Category Management & Data Seeder
- Auto-seeds 12 standard financial categories with emoji icons and `ESSENTIAL` vs. `DISCRETIONARY` classifications on startup.
- Supports custom user-created categories directly from the Transactions interface.

### 10. 📑 Reports, Exports & Imports
- **Export**: PDF statement generation (iText) and Excel export (Apache POI).
- **Import**: Batch CSV and Excel transaction file parsing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 17 / 21, Spring Boot 3.2, Spring Security (JWT), Spring Data JPA, Hibernate, Quartz Scheduler |
| **Database** | MySQL 8.0+ |
| **Document/Export** | Apache POI (Excel), iText 5 (PDF), OpenCSV |
| **Frontend** | React 18, Vite 8, Tailwind CSS, Recharts, Lucide Icons, Axios, React Hot Toast |
| **Architecture** | RESTful API, Controller-Service-Repository Pattern, JWT Stateless Authentication |

---

## 📁 Project Directory Structure

```text
finance-tracker/
├── backend/                       # Spring Boot 3.2 Java Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/finance/
│   │   │   │   ├── account/       # Account management & balance sync
│   │   │   │   ├── analytics/     # Health engine, forecasting, simulator, twin
│   │   │   │   ├── auth/          # JWT authentication, login, registration, OTP
│   │   │   │   ├── budget/        # Category budget limits & risk radar
│   │   │   │   ├── category/      # Category management & auto-seeder
│   │   │   │   ├── config/        # Security, JWT filter, CORS configuration
│   │   │   │   ├── copilot/       # Fact-grounded tool execution assistant
│   │   │   │   ├── experiment/    # 30-day behavioral savings challenges
│   │   │   │   ├── goal/          # Savings goals & pace predictions
│   │   │   │   ├── insights/      # Z-score anomaly detection engine
│   │   │   │   ├── recurring/     # Frequency-normalized obligations
│   │   │   │   ├── report/        # PDF & Excel export services
│   │   │   │   ├── transaction/   # Search, multi-filter, pagination, import
│   │   │   │   └── user/          # User entity & repositories
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/                  # Unit tests (RecurringCostNormalizerTest)
│   └── pom.xml
│
└── frontend/                      # React 18 + Vite Frontend
    ├── src/
    │   ├── components/            # Layout, Navigation, CopilotWidget
    │   ├── context/               # AuthContext (JWT & user state)
    │   ├── pages/                 # Dashboard, Accounts, CashFlow, DecisionCenter, etc.
    │   ├── services/              # Axios API client (/api/*)
    │   ├── App.jsx                # React Router DOM sitemap
    │   ├── main.jsx               # React DOM entry point
    │   └── index.css              # Tailwind CSS directives
    ├── index.html
    ├── vite.config.js             # Vite proxy to http://localhost:8082
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18.0 or higher
- **MySQL**: 8.0 or higher
- **Maven**: 3.8+ (or use wrapper)

---

### Step 1: Database Setup
1. Start your local MySQL server on port `3306`.
2. Create the database:
   ```sql
   CREATE DATABASE finance_tracker;
   ```
3. Update `D:\finance-tracker\backend\src\main\resources\application.properties` with your MySQL credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/finance_tracker
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```
   *(Hibernate will automatically create and update all tables upon startup).*

---

### Step 2: Start the Backend Server
```bash
cd backend
mvn spring-boot:run
```
The backend API will start on **`http://localhost:8082`**.

---

### Step 3: Start the Frontend Application
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5055`** (or `http://localhost:5056`) in your browser to access **FinSight**.

---

## 🌐 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User registration & OTP dispatch |
| `POST` | `/api/auth/login` | JWT Authentication |
| `GET` | `/api/accounts` | Fetch user accounts & balances |
| `GET` | `/api/transactions` | Search, filter & paginate transactions |
| `GET` | `/api/categories` | Fetch system & user categories |
| `GET` | `/api/analytics/pulse` | Retrieve Financial Pulse score & highlights |
| `GET` | `/api/analytics/story` | Natural Language Story generation |
| `GET` | `/api/analytics/health` | 5-pillar health score breakdown |
| `POST` | `/api/analytics/decision` | Evaluate purchase affordability |
| `POST` | `/api/analytics/simulate` | What-If scenario simulation |
| `GET` | `/api/analytics/digital-twin` | 1, 3, 6, 12-month wealth path projection |
| `POST` | `/api/copilot/ask` | Grounded tool execution assistant |

---

## 📦 How to Push to Git

To push this repository to GitHub/GitLab:

```bash
# 1. Initialize Git repository
git init

# 2. Add all files (respecting .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete renovation of FinSight Personal Financial Intelligence Platform"

# 4. Link your remote repository
git remote add origin https://github.com/YOUR_USERNAME/finsight-finance-tracker.git

# 5. Push to main branch
git branch -M main
git push -u origin main
```

---

## 📜 License
This project is open-source under the MIT License.
