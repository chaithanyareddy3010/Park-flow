# 🚗 ParkFlow — Premium Parking Management System

Welcome to the **ParkFlow** codebase repository! 

This repository contains the complete Next.js 14 and Supabase application for **ParkFlow**, a premium, production-grade parking slot booking and operations management panel.

---

## 📂 Repository Structure

* 📁 **[supabase-app](file:///c:/Users/user/OneDrive/Desktop/Dbmsclaude/supabase-app)**: The main Next.js App Router codebase, containing the styling, visual slot map, analytics pages, server actions, and Supabase client-side interfaces.
  * 📄 **[README.md](file:///c:/Users/user/OneDrive/Desktop/Dbmsclaude/supabase-app/README.md)**: Detailed step-by-step setup guides, demographic demo credentials, tech stacks, and deep-dives into database architecture.
  * 📄 **[supabase_seed.sql](file:///c:/Users/user/OneDrive/Desktop/Dbmsclaude/supabase-app/supabase_seed.sql)**: Database SQL seed data script with mock users, active bookings, lots, and vehicles.
* 📄 **[supabase_schema.sql](file:///C:/Users/user/.gemini/antigravity/brain/4c3c6e1d-f80a-4dd7-a311-d5ba30a96bc2/supabase_schema.sql)**: (Located in the system workspace folder) The core Postgres relational database schema definition comprising custom enums, views, functions, triggers, and Row Level Security (RLS) policies.

---

## 🚀 Quick Start Guide

To get the application up and running:

1. Navigate into the application directory:
   ```bash
   cd supabase-app
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up your Supabase project using the schema and seed scripts:
   * First, apply the schema located in [supabase_schema.sql](file:///C:/Users/user/.gemini/antigravity/brain/4c3c6e1d-f80a-4dd7-a311-d5ba30a96bc2/supabase_schema.sql) through your Supabase SQL editor.
   * Next, populate your tables with the mock seed records from [supabase_seed.sql](file:///c:/Users/user/OneDrive/Desktop/Dbmsclaude/supabase-app/supabase_seed.sql).
4. Configure your `.env.local` inside the `supabase-app` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Start your dev server:
   ```bash
   npm run dev
   ```

For full details on default login credentials, tech stacks, real-time database replication setup, and custom PostgreSQL triggers/functions, please read the main application documentation inside the **[supabase-app/README.md](file:///c:/Users/user/OneDrive/Desktop/Dbmsclaude/supabase-app/README.md)**.
