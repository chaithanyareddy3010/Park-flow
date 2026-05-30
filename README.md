# 🚗 ParkFlow — Premium Parking Management System

**ParkFlow** is a modern, production-grade, and visually stunning web application designed to simplify parking management for both drivers and administrators. Powered by a real-time visual slots grid, advanced multi-vehicle fee calculations, interactive analytics, and robust role-based security, ParkFlow is engineered to deliver a seamless, state-of-the-art parking control experience.

---

## 🎨 System Previews & Screenshots

### 🖥️ Driver Dashboard & Visual Slot Selector
> Frosted glassmorphism, responsive navigation controls, live session timers, and real-time interactive slot wizard.
![Driver Dashboard Mockup](https://raw.githubusercontent.com/chaithanyareddy3010/Park-flow/main/screenshots/driver_dashboard.png)

### 📊 Admin Operations Center & Analytics Reports
> Live occupancy tracking, recent activity feed, colored slots grid manager, and beautiful dark-mode synchronized data charts.
![Admin Analytics Mockup](https://raw.githubusercontent.com/chaithanyareddy3010/Park-flow/main/screenshots/admin_dashboard.png)

---

## 🛠️ Technology Stack

* **Frontend Framework:** Next.js 14 (React, App Router, Server Actions)
* **Backend Platform:** Supabase (Auth, PostgreSQL DB, Realtime Publication Engine)
* **Styling & Themes:** Tailwind CSS (Harmonious Slate palette, full localStorage-synced Light/Dark Mode)
* **Programming Language:** TypeScript (Strict compliance, type-safe operations)
* **Analytics Charts:** Recharts (Theme-synchronized SVG Cartesian coordinates)
* **Alert Notifications:** React Hot Toast (Floating operations alert cards)
* **Vector Icons:** Lucide React

---

## ⚡ Core Features

### 👤 User Mode (Driver Control Cabin)
* **Live Booking Monitor:** Track active parking sessions in real-time with automatic elapsed timers.
* **Slot Booking Wizard:** Browse parking lots, check live spot counts, register new vehicles, and claim available parking slots.
* **My Bookings Log:** Search, browse, and track all past visits, active sessions, and payment records.
* **Instant Checkout Request:** Drivers can request check-out directly from their dashboard. The request is submitted to the Admin terminal for approval while the vehicle remains safely parked.

### 🛡️ Admin Mode (Operations Terminal)
* **Real-time Occupancy Feed:** Subscription to live database updates to count total slots, available slots, and occupied slots without page refresh.
* **Interactive Slots Grid Map:** Colored visual cards representing slot statuses (Green = Available, Red = Occupied, Yellow = Reserved, Gray = Maintenance). Clicking any card allows admins to manually override slot status.
* **Manage Lots (CRUD):** Add, edit, or delete parking lots, adjust overall capacity sizes, and customize hourly pricing rates per vehicle type.
* **Checkout Approval:** Approve pending check-out requests with automatic fee calculation based on elapsed hours, vehicle type rates, and active payments.
* **Business Intelligence Reports:**
  * Interactive **Bar Chart** showing revenue trends over the last 7 days.
  * **Pie Chart** demonstrating vehicle type distributions (Cars vs. Bikes vs. Trucks).
  * Table of peak operational check-in hours sorted by traffic load factor.

---

## 🚀 Local Installation & Setup

Follow these steps to run ParkFlow locally on your system:

### 1. Clone the Codebase & Install Dependencies
Navigate into the application folder and install all required npm packages:
```bash
cd supabase-app
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` inside the `supabase-app` directory and populate it with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-project-anonymous-api-key
```

### 3. Initialize the Database Schema
1. Open your **Supabase Project Dashboard**.
2. Go to the **SQL Editor** in the left sidebar.
3. Open the `supabase_schema.sql` file from this repository, copy its contents, and execute the script. This creates:
   * Six core tables (`profiles`, `parking_lots`, `parking_slots`, `vehicles`, `bookings`, `payments`).
   * Customized Postgres enums (`slot_type`, `slot_status`, `booking_status`).
   * Row Level Security (RLS) security policies.
   * Special database triggers and fee-calculating functions.

### 4. Seed the Database
Copy the contents of `supabase_seed.sql` and run it inside your Supabase SQL editor to populate the tables with:
* 1 Admin Account (`admin@parkflow.com` / `Password123`).
* 5 Driver Accounts (`john@example.com`, `sarah@example.com`, `michael@example.com`, `emily@example.com`, `david@example.com`).
* 2 active parking lots (*Downtown Central Parking* and *Airport Terminal Shuttle Lot*) with 20 visual spots each.
* 10 realistic sample bookings with calculated fee amounts and payment records.

### 5. Enable Realtime Publications
To power the live slot occupancy counts and stats feeds, you must enable replication for the `bookings` and `parking_slots` tables:
1. Go to your Supabase **Database Settings** -> **Replication**.
2. Edit the `supabase_realtime` publication to include the `bookings` and `parking_slots` tables.
   *(Alternatively, run the following SQL command in your Supabase SQL Editor)*:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings, public.parking_slots;
   ```

### 6. Run the Application
Start the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🏗️ Advanced Database Engineering

ParkFlow leverages advanced relational database features to maintain atomic data integrity and blazing-fast retrieval speeds:

### 1. PostgreSQL Custom Functions
* **`calculate_fee(p_booking_id)`**: The core multi-vehicle pricing engine. Automatically retrieves a booking's elapsed duration in hours (rounded up using `CEIL`), maps the vehicle type (Car: ₹30/hr, Bike: ₹20/hr, Truck: ₹50/hr) to the respective lot's hourly rates, guarantees a minimum 1-hour charge, and computes the absolute fee amount.

### 2. Database Triggers
* **`on_auth_user_created`**: Executes `AFTER INSERT` on Supabase's `auth.users` to automatically initialize a matching user row inside `public.profiles`.
* **`trigger_release_parking_slot`**: Executes `AFTER UPDATE OF status` on `bookings` to automatically transition the associated slot's status back to `'available'` when a booking changes to `completed` or `cancelled`.

### 3. Database Views
* **`active_bookings_view`**: Performs high-performance joins across `bookings`, `vehicles`, `parking_slots`, `parking_lots`, and `profiles` to expose ongoing active booking details. Enforces RLS, meaning standard drivers only see their own active sessions, while administrators can see all sessions globally.

### 4. Row Level Security (RLS) & Policies
All 6 tables have RLS enabled. Security policies are structured as follows:
* **`is_admin()` helper function**: A database function that checks if `auth.uid()` has an `'admin'` role inside `public.profiles`.
* **Public Reads, Protected Mutations**: `parking_lots` and `parking_slots` tables grant select permissions to all authenticated users for booking, but restrict additions or edits exclusively to verified admins.
* **Driver Isolation**: Enforces standard users to select, insert, or update bookings, vehicles, and payments that correspond strictly to their own `auth.uid()`, preventing cross-tenant access.

### 5. High-Performance Indexes
* **`idx_vehicles_vehicle_number`**: Optimizes admin queries filtering by vehicle plate numbers.
* **`idx_bookings_entry_time`**: Speeds up reports compiling revenue trends over time-series intervals.
* **`idx_parking_slots_status`**: Maximizes retrieval speeds when rendering available slots.

### 6. Realtime Replication
Directly subscribes to table updates via `@supabase/supabase-js`. When slot occupancy states are overridden by admins, visual colors transform instantly on all active driver wizards.
