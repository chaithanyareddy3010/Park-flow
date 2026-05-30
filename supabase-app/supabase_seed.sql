-- ========================================================
-- Supabase SQL Seeding File
-- ========================================================

-- Disable triggers temporarily during direct inserts to prevent conflicts (optional)
-- ALTER TABLE public.profiles DISABLE TRIGGER on_auth_user_created;

-- 1. Seed auth.users
-- Password hash generated using crypt('Password123', gen_salt('bf'))
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin
) VALUES 
-- Admin
('e0d778fb-97bd-4be2-8b63-ee6587c6b901', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@parkflow.com', '$2a$10$vN03/t1/JpG6tEw735lR7e1mRsz2dM/jFpW1mG0Fm8811e5h23pQG', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"System Admin","phone":"+15559990001"}', now(), now(), false),
-- User 1
('e0d778fb-97bd-4be2-8b63-ee6587c6b902', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'john@example.com', '$2a$10$vN03/t1/JpG6tEw735lR7e1mRsz2dM/jFpW1mG0Fm8811e5h23pQG', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Doe","phone":"+15551110001"}', now(), now(), false),
-- User 2
('e0d778fb-97bd-4be2-8b63-ee6587c6b903', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@example.com', '$2a$10$vN03/t1/JpG6tEw735lR7e1mRsz2dM/jFpW1mG0Fm8811e5h23pQG', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Jenkins","phone":"+15551110002"}', now(), now(), false),
-- User 3
('e0d778fb-97bd-4be2-8b63-ee6587c6b904', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'michael@example.com', '$2a$10$vN03/t1/JpG6tEw735lR7e1mRsz2dM/jFpW1mG0Fm8811e5h23pQG', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Michael Smith","phone":"+15551110003"}', now(), now(), false),
-- User 4
('e0d778fb-97bd-4be2-8b63-ee6587c6b905', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emily@example.com', '$2a$10$vN03/t1/JpG6tEw735lR7e1mRsz2dM/jFpW1mG0Fm8811e5h23pQG', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emily Watson","phone":"+15551110004"}', now(), now(), false),
-- User 5
('e0d778fb-97bd-4be2-8b63-ee6587c6b906', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david@example.com', '$2a$10$vN03/t1/JpG6tEw735lR7e1mRsz2dM/jFpW1mG0Fm8811e5h23pQG', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Miller","phone":"+15551110005"}', now(), now(), false);

-- Note: The trigger public.on_auth_user_created automatically created profile rows
-- but defaulted their roles to 'user'. We must upgrade the admin profile to 'admin'.
UPDATE public.profiles SET role = 'admin' WHERE id = 'e0d778fb-97bd-4be2-8b63-ee6587c6b901';

-- 2. Seed parking_lots
INSERT INTO public.parking_lots (id, name, location, total_slots, hourly_rate_car, hourly_rate_bike, hourly_rate_truck)
VALUES 
('d1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Downtown Central Parking', '742 Evergreen Terrace', 20, 30.00, 20.00, 50.00),
('d2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', 'Airport Terminal Shuttle Lot', '100 Flight Path Way', 20, 30.00, 20.00, 50.00);

-- 3. Seed parking_slots (20 slots for Lot 1, 20 slots for Lot 2)
-- Lot 1 slots: 1 to 20 (Mix of regular, EV, handicapped)
-- Lot 1: Slots 1-15 regular, 16-18 EV, 19-20 handicapped
INSERT INTO public.parking_slots (id, lot_id, slot_number, slot_type, status) VALUES
('s101', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '1', 'regular', 'available'),
('s102', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '2', 'regular', 'available'),
('s103', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '3', 'regular', 'available'),
('s104', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '4', 'regular', 'available'),
('s105', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '5', 'regular', 'available'),
('s106', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '6', 'regular', 'available'),
('s107', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '7', 'regular', 'available'),
('s108', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '8', 'regular', 'available'),
('s109', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '9', 'regular', 'available'),
('s110', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '10', 'regular', 'available'),
('s111', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '11', 'regular', 'available'),
('s112', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '12', 'regular', 'available'),
('s113', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '13', 'regular', 'available'),
('s114', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '14', 'regular', 'available'),
('s115', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '15', 'regular', 'available'),
('s116', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '16', 'EV', 'available'),
('s117', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '17', 'EV', 'available'),
('s118', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '18', 'EV', 'available'),
('s119', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '19', 'handicapped', 'available'),
('s120', 'd1a2b3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '20', 'handicapped', 'available');

-- Lot 2 slots: 1 to 20 (Mix of regular, EV, handicapped)
-- Lot 2: Slots 1-15 regular, 16-18 EV, 19-20 handicapped
INSERT INTO public.parking_slots (id, lot_id, slot_number, slot_type, status) VALUES
('s201', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '1', 'regular', 'available'),
('s202', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '2', 'regular', 'available'),
('s203', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '3', 'regular', 'available'),
('s204', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '4', 'regular', 'available'),
('s205', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '5', 'regular', 'available'),
('s206', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '6', 'regular', 'available'),
('s207', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '7', 'regular', 'available'),
('s208', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '8', 'regular', 'available'),
('s209', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '9', 'regular', 'available'),
('s210', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '10', 'regular', 'available'),
('s211', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '11', 'regular', 'available'),
('s212', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '12', 'regular', 'available'),
('s213', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '13', 'regular', 'available'),
('s214', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '14', 'regular', 'available'),
('s215', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '15', 'regular', 'available'),
('s216', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '16', 'EV', 'available'),
('s217', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '17', 'EV', 'available'),
('s218', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '18', 'EV', 'available'),
('s219', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '19', 'handicapped', 'available'),
('s220', 'd2a3b4c5-e6f7-8a9b-0c1d-2e3f4a5b6c7d', '20', 'handicapped', 'available');

-- 4. Seed vehicles for standard users
INSERT INTO public.vehicles (id, user_id, owner_name, vehicle_number, vehicle_type, phone)
VALUES 
('v301', 'e0d778fb-97bd-4be2-8b63-ee6587c6b902', 'John Doe', 'NY-K311A', 'car', '+15551110001'),
('v302', 'e0d778fb-97bd-4be2-8b63-ee6587c6b902', 'John Doe', 'NY-MOTO9', 'bike', '+15551110001'),
('v303', 'e0d778fb-97bd-4be2-8b63-ee6587c6b903', 'Sarah Jenkins', 'CA-ELECTR', 'car', '+15551110002'),
('v304', 'e0d778fb-97bd-4be2-8b63-ee6587c6b904', 'Michael Smith', 'TX-TRK99', 'truck', '+15551110003'),
('v305', 'e0d778fb-97bd-4be2-8b63-ee6587c6b905', 'Emily Watson', 'FL-WATS0N', 'car', '+15551110004'),
('v306', 'e0d778fb-97bd-4be2-8b63-ee6587c6b906', 'David Miller', 'IL-MLLER2', 'car', '+15551110005');

-- 5. Seed 10 sample bookings in various statuses (active, completed, cancelled)
-- Realistic entry/exit times and correct hourly rate computations

-- Booking 1: User 1 - Lot 1 Spot 1 - Completed (Car, 3 hours -> ₹90.00)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b401', 's101', 'v301', 'e0d778fb-97bd-4be2-8b63-ee6587c6b902', now() - interval '2 days 5 hours', now() - interval '2 days 2 hours', 'completed', 90.00, 'approved');

-- Booking 2: User 1 - Lot 1 Spot 2 - Completed (Bike, 2 hours -> ₹40.00)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b402', 's102', 'v302', 'e0d778fb-97bd-4be2-8b63-ee6587c6b902', now() - interval '1 day 4 hours', now() - interval '1 day 2 hours', 'completed', 40.00, 'approved');

-- Booking 3: User 2 - Lot 2 Spot 16 (EV) - Completed (Car, 4 hours -> ₹120.00)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b403', 's216', 'v303', 'e0d778fb-97bd-4be2-8b63-ee6587c6b903', now() - interval '3 days 6 hours', now() - interval '3 days 2 hours', 'completed', 120.00, 'approved');

-- Booking 4: User 3 - Lot 2 Spot 1 - Completed (Truck, 5 hours -> ₹250.00)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b404', 's201', 'v304', 'e0d778fb-97bd-4be2-8b63-ee6587c6b904', now() - interval '12 hours', now() - interval '7 hours', 'completed', 250.00, 'approved');

-- Booking 5: User 4 - Lot 1 Spot 3 - Completed (Car, 1 hour -> ₹30.00)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b405', 's103', 'v305', 'e0d778fb-97bd-4be2-8b63-ee6587c6b905', now() - interval '8 hours', now() - interval '7 hours', 'completed', 30.00, 'approved');

-- Booking 6: User 5 - Lot 1 Spot 4 - Cancelled (Car, No fee)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b406', 's104', 'v306', 'e0d778fb-97bd-4be2-8b63-ee6587c6b906', now() - interval '4 days 2 hours', now() - interval '4 days 1 hour', 'cancelled', 0.00, 'approved');

-- Booking 7: User 1 - Lot 1 Spot 5 - Completed (Car, 8 hours -> ₹240.00)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b407', 's105', 'v301', 'e0d778fb-97bd-4be2-8b63-ee6587c6b902', now() - interval '18 hours', now() - interval '10 hours', 'completed', 240.00, 'approved');

-- Booking 8: User 2 - Lot 2 Spot 17 (EV) - Cancelled (Car, No fee)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b408', 's217', 'v303', 'e0d778fb-97bd-4be2-8b63-ee6587c6b903', now() - interval '5 days', now() - interval '5 days', 'cancelled', 0.00, 'approved');

-- Booking 9: User 4 - Lot 1 Spot 16 (EV) - Active (Car, Occupied)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b409', 's116', 'v305', 'e0d778fb-97bd-4be2-8b63-ee6587c6b905', now() - interval '2 hours', null, 'active', null, 'none');
-- Set slot to occupied
UPDATE public.parking_slots SET status = 'occupied' WHERE id = 's116';

-- Booking 10: User 5 - Lot 2 Spot 2 - Active (Car, Occupied)
INSERT INTO public.bookings (id, slot_id, vehicle_id, user_id, entry_time, exit_time, status, fee_amount, checkout_status)
VALUES ('b410', 's202', 'v306', 'e0d778fb-97bd-4be2-8b63-ee6587c6b906', now() - interval '4 hours', null, 'active', null, 'none');
-- Set slot to occupied
UPDATE public.parking_slots SET status = 'occupied' WHERE id = 's202';

-- 6. Seed payments for completed bookings
INSERT INTO public.payments (booking_id, amount, payment_method, paid_at, status)
VALUES 
('b401', 90.00, 'card', now() - interval '2 days 2 hours', 'completed'),
('b402', 40.00, 'card', now() - interval '1 day 2 hours', 'completed'),
('b403', 120.00, 'card', now() - interval '3 days 2 hours', 'completed'),
('b404', 250.00, 'cash', now() - interval '7 hours', 'completed'),
('b405', 30.00, 'card', now() - interval '7 hours', 'completed'),
('b407', 240.00, 'card', now() - interval '10 hours', 'completed');

-- Re-enable triggers (optional)
-- ALTER TABLE public.profiles ENABLE TRIGGER on_auth_user_created;
