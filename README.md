# 🛡️ Cloud IAM Security Lab

> **An Educational Cloud IAM Auditing, Permission Simulation, and Security Monitoring Platform**

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Project Overview

**Cloud IAM Security Lab** is a full-stack, educational cybersecurity auditing and simulation environment built to demonstrate core cloud identity concepts: **Authentication vs. Authorization**, **Role-Based Access Control (RBAC)**, the **Principle of Least Privilege (PoLP)**, **Excessive Permission Analysis**, and **Automated Security Remediation**.

The platform simulates a cloud identity infrastructure (Users, Groups, Policies, Permissions, and Resources) entirely locally using simulated datasets—without requiring connection to or modification of a live cloud account (AWS/GCP/Azure).

---

## 🌟 Key Features

1. **IAM Security Analysis Engine**: Backend policy engine that scans IAM policies for insecure configurations (wildcards `*:*`, excessive object deletion permissions, unconstrained sensitive resource access) and dynamically computes a Security Posture Score (0–100).
2. **IAM Permission Simulator Workbench**: Functional authorization engine evaluating effective permissions for any `Identity + Action + Resource` combination, returning `ALLOWED` or `DENIED` alongside matching policy traces.
3. **Automated Remediation Engine**: Interactive workflow allowing security auditors to click "Mark as Remediated", automatically updating offending policies to enforce Least Privilege, recalculating the security score, and logging audit events.
4. **Permission Flow Visualizer**: Interactive graphical representation tracing relationship dependencies: `User` ➔ `Group` ➔ `Policy` ➔ `Target Resource`.
5. **Multi-Criteria Audit Trail**: Structured event logging capturing logins, policy changes, simulator evaluations, and remediation actions with real-time filtering by actor, action, result, and risk level.
6. **Enterprise Stitch Dark Interface**: Sleek cybersecurity aesthetic built with high-contrast dark panels, glowing status badges, severity alerts, and real-time metric cards.

---

## 🏗️ Architecture & Technology Stack

### System Architecture
```
+-------------------------------------------------------------------------+
|                          REACT VITE FRONTEND                            |
|  Dark Cybersecurity Stitch Design System (Cyan / Emerald Glow Theme)     |
|                                                                         |
|  Dashboard | Identities | Groups | Policies | Findings | Simulator      |
+-------------------------------------------------------------------------+
                                    | REST API (JSON)
                                    v
+-------------------------------------------------------------------------+
|                          FASTAPI BACKEND                                |
|  Routers: /api/dashboard, /api/users, /api/policies, /api/simulator     |
|  Services: Security Engine, IAM Permission Evaluator                    |
+-------------------------------------------------------------------------+
                                    | SQLAlchemy ORM
                                    v
+-------------------------------------------------------------------------+
|                          SQLITE DATABASE                                |
|  Tables: users, groups, policies, resources, findings, audit_logs       |
+-------------------------------------------------------------------------+
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v6
- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn
- **Database**: SQLite3 (`iam_lab.db`)
- **Testing**: `pytest` for security engine, simulator evaluation, and remediation testing

---

## 🔒 Security Detection & Scoring Algorithm

The Security Analysis Engine evaluates all active policies against security rules:

| Finding Rule | Trigger Pattern | Severity | Score Impact |
| :--- | :--- | :---: | :---: |
| **Wildcard Administrator** | `Effect: ALLOW`, `Action: *`, `Resource: *` | `CRITICAL` | **-25 pts** |
| **Excessive Developer Rights** | Non-Admin Group assigned `storage:DeleteObject` | `HIGH` | **-15 pts** |
| **Inappropriate Group Assignment** | Auditor assigned `AdministratorAccess` | `HIGH` | **-15 pts** |
| **Sensitive Resource Exposure** | Confidential/Restricted resource targeted by `*` | `HIGH` | **-15 pts** |
| **Direct User Policy Attachment** | Policy attached directly bypassing RBAC | `MEDIUM` | **-8 pts** |

### Dynamic Security Score Calculation
$$ \text{Security Score} = \max\left(0, 100 - \sum \text{Deductions for OPEN Findings}\right) $$

---

## 🚀 Quickstart - Running Locally

### Prerequisites
- **Python**: `3.11` or higher
- **Node.js**: `v18` or higher
- **npm**: `v9` or higher

### 1. Clone & Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI backend server (runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Set Up Frontend

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite React development server (runs on http://localhost:5173)
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the backend pytest test suite to verify security detection and simulation logic:

```bash
# From project root directory
python -m pytest -o pythonpath=backend tests/
```

---

## 📖 Educational IAM Scenario Walkthrough

### Scenario: Overprivileged Developer Access
1. **Initial State**: Pre-populated user `alice-dev` belongs to `Developers` group with `DeveloperAccess` policy granting `storage:DeleteObject`.
2. **Detection**: Security Analysis Engine flags `HIGH` finding: *"Developer group has unnecessary object deletion permission."*
3. **Simulation**: Go to `/simulator`, set Identity `alice-dev`, Action `storage:DeleteObject`, Resource `production-bucket`. Click **Evaluate**. Decision returns **ALLOWED**.
4. **Remediation**: Go to `/findings`, click **Mark as Remediated**. Policy is automatically stripped of `storage:DeleteObject`, Security Score increases.
5. **Re-Test**: Re-running the simulator for `alice-dev` now returns **DENIED** (*Implicit Deny: No attached policy grants action*).

---

## 📂 Project Structure

```
.
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docs/
│   ├── architecture.md
│   └── iam_scenarios.md
├── tests/
│   ├── test_security_engine.py
│   └── test_simulator.py
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── seed_data.py
│       ├── services/
│       │   ├── security_engine.py
│       │   └── simulator.py
│       └── routers/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── api/
        ├── components/
        └── pages/
```

---

## ⚠️ Educational Disclaimer

> **IMPORTANT**: This application is an **educational IAM simulation environment** designed for learning, auditing practice, and interview demonstrations. It does **NOT** connect to, manage, or modify live production cloud infrastructure (AWS, GCP, or Azure).
