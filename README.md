# 💰 LeadInfo Financial Tracker

A financial tracking web app to manage income, expenses, and retirement records using Supabase.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Poorvikab/leadinfo-financial-tracker.git
cd leadinfo-financial-tracker
```

---

### 2. Install dependencies

```bash
npm install
```

---

## 🔐 Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings.

---

## 🗄️ Database Setup (Supabase)

### 1. Create a Supabase Project

* Go to https://supabase.com
* Create a new project

---

### 2. Install Supabase CLI (Windows)

Open PowerShell and run:

```bash
iwr -useb get.scoop.sh | iex
scoop install supabase
```

Restart your terminal and verify:

```bash
supabase --version
```

---

### 3. Login to Supabase

```bash
supabase login
```

This will open your browser — allow access.

---

### 4. Link your project

Go to your Supabase dashboard URL:

```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

Copy the project ID and run:

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

---

### 5. Apply database schema

```bash
supabase db push
```

✅ This will automatically create all required tables.

---

## ▶️ Run the App

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

## 📁 Project Structure

```bash
supabase/        # Database migrations
src/             # Application source code
public/          # Static assets
```

---

## ⚠️ Important Notes

* Do NOT commit your `.env` file
* Always use `.env.example` as reference
* Supabase migrations are included in this repo

---

## ✅ Features

* Track income & expenses
* Categorize financial records
* Manage 401k contributions
* Activity logs

---

## 🛠️ Tech Stack

* React + Vite + TypeScript
* Supabase (Database + Backend)
* PostgreSQL

---
