# 🚗 ParkFlow — Premium Parking Management System

**ParkFlow** is a modern, production-grade, and visually stunning web application designed to simplify parking management for both administrators and everyday drivers. Featuring custom real-time visual maps, advanced multi-vehicle fee calculations, interactive analytics dashboards, and robust role-based security, ParkFlow is engineered to deliver a seamless, high-end user experience.

---

## ✨ Features At A Glance

### 👤 Driver Dashboard
* **Live Booking Visualizer:** Track active bookings in real-time with automatic counters.
* **Intelligent Slot Booking Wizard:** Book spots on a visual grid showing real-time slot availability.
* **Detailed Bookings Log:** Search, browse, and track all past and current bookings.
* **Instant Checkout:** Check out of active bookings with automatic fee calculation based on elapsed time and vehicle type rates.
* **Profile Management:** Manage and update profile name and contact information easily.

### 🛡️ Admin Management Operations Panel
* **Live Stats Command Center:** Real-time occupancy charts, revenue tallies, and recent activity feed.
* **Interactive Slot Map Grid:** Visual grid of all parking slots. Update slot statuses manually in real-time (Available, Occupied, Reserved, Maintenance) with live state persistence.
* **Lot Configuration (CRUD):** Add, update, and manage parking lots, custom capacity sizes, and tailored rates per vehicle type (Car, Bike, Truck).
* **Searchable Log Audits:** View full booking history, search by vehicle plate number, filter by booking status, and view exact user profiles.
* **Graphical Business Analytics:** Interactive bar charts showing revenue trends over the last 7 days, pie charts demonstrating vehicle type distributions, and comprehensive revenue metrics.

---

## 🛠️ Technology Stack

* **Frontend Framework:** Next.js 14 (React, App Router, Server Actions)
* **Programming Language:** TypeScript (Strict compliance, type-safe operations)
* **Database & Auth Backend:** Supabase (PostgreSQL, Auth, Realtime Engine, RLS)
* **Styling & Theme:** Tailwind CSS (Harmonious Slate palette, dynamic responsive grids, localStorage-synced Light/Dark Mode)
* **Interactive Charts:** Recharts (Dark mode synchronized canvas rendering)
* **Notifications:** React Hot Toast (Elegant floating state change updates)
* **Icons:** Lucide React

---

## 🚀 Local Setup & Installation

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### 2. Install Dependencies
Navigate into the `supabase-app` directory and install the required npm packages:
```bash
npm install
```

### 3. Database Schema Setup
1. Create a new project in your [Supabase Dashboard](https://supabase.com/).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Copy the contents of the database schema file (`supabase_schema.sql`) and run it to create tables, custom types, functions, triggers, and RLS policies.
4. Copy the contents of the database seed file (`supabase_seed.sql`) and execute it to populate the database with mock administrators, standard users, 2 parking lots with 20 slots each, vehicles, sample bookings, and payments.

### 4. Enable Realtime Replication
To enable live updates on the Admin Dashboard and User Booking Wizard, you must enable Postgres replication on the `bookings` and `parking_slots` tables:
1. Go to your Supabase project's **Database** settings.
2. Select **Replication** under the database menu.
3. Edit the `supabase_realtime` publication to include the `bookings` and `parking_slots` tables.
   *(Alternatively, run the following SQL command in your Supabase SQL Editor)*:
   ```sql
   alter publication supabase_realtime add table public.bookings, public.parking_slots;
   ```

### 5. Configure Environment Variables
Create a file named `.env.local` in the root of the `supabase-app` directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anonymous-api-key
```

### 6. Start the Development Server
Run the local dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Demo Credentials (Seed Accounts)

All seed accounts share the same password: **`Password123`**

| Email | Role | Full Name | Purpose |
| :--- | :--- | :--- | :--- |
| **`admin@parkflow.com`** | **Admin** | System Admin | Access Slot Maps, CRUD lots, views, analytics. |
| **`john@example.com`** | **User** | John Doe | Drivers' dashboard, active booking, vehicles. |
| **`sarah@example.com`** | **User** | Sarah Jenkins | Drivers' dashboard, active booking, vehicles. |
| **`michael@example.com`**| **User** | Michael Smith | Drivers' dashboard, active booking, vehicles. |
| **`emily@example.com`**  | **User** | Emily Watson | Drivers' dashboard, active booking, vehicles. |
| **`david@example.com`**  | **User** | David Miller | Drivers' dashboard, active booking, vehicles. |

---

## 🏗️ Database Engineering & Features

ParkFlow leverages advanced PostgreSQL features to ensure relational integrity, blazing-fast queries, and atomic real-time updates.

### 1. PostgreSQL Functions
* **`calculate_fee(p_booking_id UUID)`**: The core pricing engine. It retrieves elapsed booking duration in hours (rounded up using `CEIL`), maps the vehicle type (Car, Bike, Truck) to the respective lot's hourly rates, guarantees a minimum 1-hour charge, and computes the absolute fee amount atomically.
* **`handle_new_user()`**: Maintains absolute parity between Supabase Auth and application profiles. When a new user registers in `auth.users`, it automatically initializes their corresponding profile row.
* **`release_parking_slot()`**: Automatically frees up resources. When a booking status transitions to `completed` or `cancelled`, this function sets the associated slot's status back to `available`.

### 2. Database Triggers
* **`on_auth_user_created`**: Runs `AFTER INSERT` on `auth.users` to invoke user profile synchronization.
* **`trigger_release_parking_slot`**: Runs `AFTER UPDATE OF status` on the `bookings` table to automatically free up slots.

### 3. Database Views
* **`active_bookings_view`**: Performs high-performance joins across 5 tables (`bookings`, `vehicles`, `parking_slots`, `parking_lots`, and `profiles`) to return a comprehensive view of all active bookings. It enforces client-side isolation under RLS (users only see their own active bookings; admins see all).

### 4. Row Level Security (RLS) & Security Policies
ParkFlow is designed with security-first architecture. All 6 tables have RLS enabled:
* **Admin Helper (`is_admin()`)**: A database function that checks the calling user's UUID in the profile table. Used to bypass standard restrictions.
* **Public Reads, Protected Writes**: Tables like `parking_lots` and `parking_slots` permit public viewing for bookings, but restrict mutations exclusively to admins.
* **User Isolation**: Standard users can only view or manage profiles, vehicles, bookings, and payments that correspond directly to their `auth.uid()`. Admins have global select and modify privileges across all rows.

### 5. High-Performance Indexes
* **`idx_vehicles_vehicle_number`**: B-tree index on plate numbers to speed up admin search queries.
* **`idx_bookings_entry_time`**: Speed up analytical time-series filters and sorting on admin reports.
* **`idx_parking_slots_status`**: Optimizes live queries of empty/occupied parking spaces.

### 6. Supabase Realtime
Connected directly using client-side subscriptions. Any Postgres changes to `parking_slots` or `bookings` automatically trigger local component state refreshes, allowing slot updates to reflect instantly on the UI without reloading the page.

---

## 🎨 Design Theme & Aesthetics

ParkFlow incorporates modern design paradigms to deliver a breathtaking interface:
* **Glassmorphism:** Elegant frosted glass panels utilizing CSS backdrop blurs and subtle white borders.
* **Fluid Transitions:** Smooth animations for hover, dropdowns, page navigations, and theme changes.
* **Tailwind Light/Dark Mode:** Completely stylized layouts supporting standard Slate colors for perfect readability in both day and night settings.
* **Dynamic Skeletons:** Softly pulsing skeleton components keep the dashboard visually stable while background API calls load.
