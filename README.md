# Halleyx Workflow Engine - Full Stack Challenge I 2026

A powerful, visual workflow automation system that allows users to design complex processes, define dynamic business rules, and track executions with high-fidelity visuals.

## 🚀 Key Features

### 1. Visual Workflow Designer
- **Visual Input Schema Builder**: Define your process payload requirements with a drag-and-drop interface.
- **Flexible Step Management**: Support for **Task**, **Approval**, and **Notification** steps.
- **Interactive Flow Diagram**: Real-time SVG visualization of the workflow logic and transitions.

### 2. Advanced Rule Engine
- **Visual & Manual Rule Builders**: Create complex logic using a friendly UI or raw condition strings.
- **Priority-Based Evaluation**: Rules are evaluated in precise order with `DEFAULT` fallback support.
- **Complex Expressions**: Supports comparison (`==`, `!=`, `<`, `>`), logical (`&&`, `||`), and string functions (`contains`, `startsWith`, `endsWith`).
- **Infinite Loop Protection**: Configurable max iterations for safety.

### 3. Execution & Monitoring
- **Live Animated Execution**: Track progress with pulsing status bars, animated logs, and success celebrations (Confetti!).
- **Approval Actions**: Pause execution for manual intervention; approve or reject to branch the logic.
- **Retry & Cancel**: Recover from failed steps or terminate active processes.
- **Email Notifications**: Integrated `nodemailer` with Gmail SMTP for professional HTML notifications.

### 4. Operational Visibility
- **Analytics Dashboard**: High-level metrics on success rates, durations, and system load.
- **Audit Timeline**: Sleek slide-in log drawer showing every rule evaluated, transition chosen, and step duration.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, PostgreSQL (via Supabase)
- **Frontend**: React, Tailwind CSS, Framer Motion, Lucide React, Recharts, @dnd-kit
- **Communication**: Axios, Nodemailer

---
## Demo
[Watch Demo Video](https://youtu.be/QHHrihLKotg)
## 🏃 Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Connection string required)
- Gmail App Password (for notifications)

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` with:
```env
PORT=5000
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=WF Engine <your_gmail@gmail.com>
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

### 3. Initialize Database
```bash
cd backend
node seed.js
```

### 4. Run Application
**Backend:**
```bash
cd backend
npm run dev
```
**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🧪 Sample Workflows

The system includes two pre-configured sample workflows:

1. **Expense Approval**: 
   - **Path**: Manager Approval → (Rules) → Finance Notification → CEO Approval → Success.
   - **Logic**: If amount > 100, US-based, and High priority, it triggers a Finance team email.
   - **Test Code**: `node backend/test_expense.js`

2. **Employee Onboarding**:
   - **Path**: Welcome Email → IT Setup → Manager Introduction.

---

## 📝 Design Decisions
- **Rule Evaluation**: Built a custom non-eval parser for conditions to ensure security while maintaining flexibility.
- **Visual Builders**: Focused on "Zero-Code" philosophy by providing visual abstractions for JSON schemas and Logical rules.
- **UI/UX**: Prioritized premium feel with micro-animations via `framer-motion` and clear operational feedback.

---
*Created by Antigravity for the Halleyx Full Stack Engineer Challenge.*
