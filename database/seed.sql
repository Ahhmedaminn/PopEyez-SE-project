-- PopEyez meaningful demo data
-- The records below are designed as connected test scenarios for every main user journey.

INSERT INTO users (id, full_name, email, password_hash, role, status, phone, age, speciality, employment_type, company_name, created_by, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 'Mariam Hassan', 'mariam.organizer@popeyez.demo', 'demo_hash_organizer', 'organizer', 'Active', '+20 100 111 2222', 32, NULL, NULL, 'PopEyez Events', NULL, '2026-05-01 09:00:00'),
(2, 'Omar Saleh', 'omar.staff@popeyez.demo', 'demo_hash_staff', 'staff', 'Active', '+20 100 222 3333', 27, 'Logistics', 'full-time', NULL, 1, '2026-05-02 09:00:00'),
(3, 'Nour Adel', 'nour.staff@popeyez.demo', 'demo_hash_staff', 'staff', 'Active', '+20 100 333 4444', 24, 'Guest Check-In', 'part-time', NULL, 1, '2026-05-02 09:15:00'),
(4, 'Karim Fouad', 'karim.vendor@popeyez.demo', 'demo_hash_vendor', 'vendor', 'Active', '+20 100 444 5555', 38, NULL, NULL, 'Cairo Bites Catering', 1, '2026-05-03 10:00:00'),
(5, 'Laila Youssef', 'laila.vendor@popeyez.demo', 'demo_hash_vendor', 'vendor', 'Active', '+20 100 555 6666', 35, NULL, NULL, 'Glow Audio Visuals', 1, '2026-05-03 10:20:00'),
(6, 'Youssef Nabil', 'youssef.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Active', '+20 100 666 7777', 29, NULL, NULL, NULL, 1, '2026-05-04 11:00:00'),
(7, 'Salma Riad', 'salma.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Active', '+20 100 777 8888', 28, NULL, NULL, NULL, 1, '2026-05-04 11:05:00'),
(8, 'Hany Mansour', 'hany.venue@popeyez.demo', 'demo_hash_owner', 'venueOwner', 'Active', '+20 100 888 9999', 45, NULL, NULL, 'Nile Spaces', NULL, '2026-05-01 12:00:00'),
(9, 'Dina Samir', 'dina.staff@popeyez.demo', 'demo_hash_staff', 'staff', 'Deactivated', '+20 100 999 0001', 31, 'Seating', 'part-time', NULL, 1, '2026-05-02 10:00:00'),
(10, 'Mona Kamal', 'mona.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Deactivated', '+20 100 999 0002', 26, NULL, NULL, NULL, 1, '2026-05-04 12:00:00'),
(11, 'Farida Osman', 'farida.organizer@popeyez.demo', 'demo_hash_organizer2', 'organizer', 'Active', '+20 101 111 2222', 36, NULL, NULL, 'Farida Creative Studio', NULL, '2026-05-04 12:30:00'),
(12, 'Tamer Galal', 'tamer.venue@popeyez.demo', 'demo_hash_owner2', 'venueOwner', 'Active', '+20 101 222 3333', 42, NULL, NULL, 'CityBox Venues', NULL, '2026-05-05 08:00:00'),
(13, 'Heba Mostafa', 'heba.staff@popeyez.demo', 'demo_hash_staff', 'staff', 'Active', '+20 101 333 4444', 30, 'Catering', 'full-time', NULL, 1, '2026-05-05 09:00:00'),
(14, 'Yara Naguib', 'yara.vendor@popeyez.demo', 'demo_hash_vendor', 'vendor', 'Active', '+20 101 444 5555', 34, NULL, NULL, 'Bloom Booth Decor', 1, '2026-05-05 10:00:00'),
(15, 'Mina Atef', 'mina.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Active', '+20 101 555 6666', 33, NULL, NULL, NULL, 1, '2026-05-05 11:00:00'),
(16, 'Leen Farouk', 'leen.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Active', '+20 101 666 7777', 25, NULL, NULL, NULL, 1, '2026-05-05 11:10:00'),
(17, 'Bassel Karim', 'bassel.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Active', '+20 101 777 8888', 31, NULL, NULL, NULL, 1, '2026-05-05 11:20:00'),
(18, 'Rana Fekry', 'rana.staff@popeyez.demo', 'demo_hash_staff', 'staff', 'Active', '+20 101 888 9999', 29, 'Logistics', 'part-time', NULL, 11, '2026-05-06 09:00:00');

INSERT INTO venues (id, owner_id, name, description, location, city, capacity, dimensions_sqm, amenities, daily_price, photo_url, floor_plan_url, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 8, 'Nile Loft Garden', 'Rooftop pop-up venue with garden seating and Nile views.', 'Zamalek, Cairo', 'Cairo', 120, 260.00, 'Wi-Fi, catering prep area, outdoor lighting, parking nearby', 18000.00, '/demo/venues/nile-loft.jpg', '/demo/floorplans/nile-loft.pdf', 'Active', '2026-05-05 09:00:00'),
(2, 8, 'Downtown Warehouse Hall', 'Industrial indoor hall suitable for product launches and creative markets.', 'Downtown Cairo', 'Cairo', 220, 420.00, 'Loading dock, stage power, restrooms, security desk', 26000.00, '/demo/venues/warehouse-hall.jpg', '/demo/floorplans/warehouse-hall.pdf', 'Active', '2026-05-05 09:30:00'),
(3, 8, 'Garden Gallery Studio', 'Small gallery-style pop-up space kept inactive to test deactivated listing behavior.', 'New Cairo', 'Cairo', 60, 140.00, 'Gallery lighting, storage room, restroom, street parking', 12000.00, '/demo/venues/gallery-studio.jpg', '/demo/floorplans/gallery-studio.pdf', 'Inactive', '2026-05-05 10:00:00'),
(4, 8, 'Palm Courtyard', 'Open-air courtyard suitable for dinners, workshops, and brand activations.', 'Maadi, Cairo', 'Cairo', 90, 210.00, 'Outdoor lighting, preparation room, Wi-Fi, valet area', 14500.00, '/demo/venues/palm-courtyard.jpg', '/demo/floorplans/palm-courtyard.pdf', 'Active', '2026-05-05 10:15:00'),
(5, 8, 'Riverside Conference Deck', 'Large covered event deck for conferences, exhibitions, and launch events.', 'Manial, Cairo', 'Cairo', 300, 560.00, 'Stage, projector, sound system, parking, loading access', 32000.00, '/demo/venues/riverside-deck.jpg', '/demo/floorplans/riverside-deck.pdf', 'Active', '2026-05-05 10:30:00'),
(6, 12, 'CityBox Black Box', 'Flexible black-box event room owned by a different venue owner for ownership-isolation testing.', 'Sheraton, Cairo', 'Cairo', 150, 310.00, 'Blackout curtains, projector, back-of-house storage, freight elevator', 21000.00, '/demo/venues/citybox-black-box.jpg', '/demo/floorplans/citybox-black-box.pdf', 'Active', '2026-05-07 09:00:00'),
(7, 12, 'Alexandria Seaside Terrace', 'Outdoor terrace in Alexandria used to test city filters and second-owner booking data.', 'Stanley, Alexandria', 'Alexandria', 110, 240.00, 'Sea view, outdoor lighting, valet, catering prep area', 19000.00, '/demo/venues/seaside-terrace.jpg', '/demo/floorplans/seaside-terrace.pdf', 'Active', '2026-05-07 09:30:00');

INSERT INTO vendors (id, user_id, company_name, supplies_offered, main_location, pricing_list, contact_email, contact_phone, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 4, 'Cairo Bites Catering', 'Canapes, buffet stations, drinks, dessert table', 'Maadi, Cairo', 'Canape package: 180 EGP/person; buffet package: 350 EGP/person', 'karim.vendor@popeyez.demo', '+20 100 444 5555', 'Active', '2026-05-06 10:00:00'),
(2, 5, 'Glow Audio Visuals', 'Speakers, microphones, uplighting, projector screens', 'Heliopolis, Cairo', 'Basic sound: 7500 EGP; lighting package: 9500 EGP', 'laila.vendor@popeyez.demo', '+20 100 555 6666', 'Active', '2026-05-06 10:30:00'),
(3, 14, 'Bloom Booth Decor', 'Floral arches, booth styling, signage, table decor', 'Nasr City, Cairo', 'Booth styling: 4500 EGP; floral arch: 6500 EGP', 'yara.vendor@popeyez.demo', '+20 101 444 5555', 'Active', '2026-05-06 11:00:00'),
(4, NULL, 'Legacy Print Shop', 'Flyers, badges, vinyl backdrops', 'Downtown Cairo', 'Badge print run: 1500 EGP; vinyl backdrop: 3200 EGP', 'print@popeyez.demo', '+20 101 999 0000', 'Inactive', '2026-05-06 11:30:00');

INSERT INTO events (id, organizer_id, venue_id, name, event_type, description, event_date, start_time, end_time, expected_attendees, dress_code, agenda, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'Summer Pop-Up Launch', 'Product Launch', 'Approved upcoming launch event for a local fashion brand.', '2026-06-20', '18:00:00', '22:00:00', 85, 'Smart casual', 'Welcome drinks, brand reveal, networking, closing remarks', 'Planned', '2026-05-07 09:00:00'),
(2, 1, NULL, 'Creators Weekend Market', 'Market', 'Market with a venue counter-proposal waiting for organizer review.', '2026-06-28', '12:00:00', '20:00:00', 180, 'Casual', 'Vendor setup, public opening, live demo, closing cleanup', 'Planned', '2026-05-08 09:00:00'),
(3, 1, 1, 'Today Setup Drill', 'Operations Test', 'Ongoing dry run used to test dashboards, check-ins, messages, and delivery updates.', '2026-06-18', '10:00:00', '16:00:00', 40, 'Team uniform', 'Morning setup, vendor arrival, guest desk simulation, wrap-up', 'Ongoing', '2026-06-01 09:00:00'),
(4, 1, 3, 'Past Feedback Review', 'Private Preview', 'Completed small preview used to test post-event feedback and reports.', '2026-06-10', '17:00:00', '20:00:00', 35, 'Casual', 'Preview, guest survey, teardown', 'Completed', '2026-05-30 09:00:00'),
(5, 1, NULL, 'Wellness Morning Workshop', 'Workshop', 'Pending venue-owner approval case for a small courtyard workshop.', '2026-07-03', '09:00:00', '13:00:00', 55, 'Comfortable', 'Check-in, guided session, brunch, feedback', 'Planned', '2026-06-08 09:00:00'),
(6, 1, 5, 'Cancelled Tech Demo', 'Demo', 'Cancelled event kept for status filtering and archived task examples.', '2026-07-12', '15:00:00', '18:00:00', 70, 'Business casual', 'Demo, Q&A, networking', 'Cancelled', '2026-06-09 09:00:00'),
(7, 11, 6, 'Farida Brand Salon', 'Brand Salon', 'Second organizer event at a second-owner venue for ownership isolation tests.', '2026-07-05', '17:00:00', '21:00:00', 95, 'Semi-formal', 'Panel, showcase, reception', 'Planned', '2026-06-10 09:00:00'),
(8, 1, 4, 'Community Dinner Night', 'Dinner', 'Approved future dinner used for confirmed booking and revenue reporting.', '2026-07-08', '19:00:00', '23:00:00', 88, 'Smart casual', 'Arrival, dinner, live performance, closing', 'Planned', '2026-06-11 09:00:00');

INSERT INTO venue_availability (id, venue_id, available_date, is_available, price_override, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, '2026-06-20', FALSE, 18000.00, 'Confirmed approved booking for Summer Pop-Up Launch.', '2026-05-08 10:00:00'),
(2, 1, '2026-06-21', FALSE, NULL, 'Private event already confirmed.', '2026-05-08 10:05:00'),
(3, 2, '2026-06-28', TRUE, 25000.00, 'Available, but venue owner sent a counter-proposal.', '2026-05-08 10:10:00'),
(4, 2, '2026-06-29', TRUE, 26000.00, 'Available for follow-up day.', '2026-05-08 10:15:00'),
(5, 1, '2026-06-18', FALSE, 15000.00, 'Used by Today Setup Drill.', '2026-06-01 10:00:00'),
(6, 3, '2026-06-30', FALSE, NULL, 'Inactive venue; not accepting bookings.', '2026-06-01 10:05:00'),
(7, 2, '2026-06-20', FALSE, NULL, 'Already reserved for a private conference.', '2026-06-01 10:10:00'),
(8, 4, '2026-07-03', TRUE, 14000.00, 'Available for Wellness Morning Workshop.', '2026-06-01 10:15:00'),
(9, 5, '2026-06-20', TRUE, 32000.00, 'Available with full conference equipment.', '2026-06-01 10:20:00'),
(10, 1, '2026-06-28', FALSE, NULL, 'Unavailable due to maintenance.', '2026-06-01 10:25:00'),
(11, 4, '2026-06-28', TRUE, 14500.00, 'Available for an afternoon or evening booking.', '2026-06-01 10:30:00'),
(12, 5, '2026-06-28', FALSE, NULL, 'Reserved for an exhibition.', '2026-06-01 10:35:00'),
(13, 1, '2026-06-30', TRUE, 18000.00, 'Available for evening events.', '2026-06-01 10:40:00'),
(14, 2, '2026-06-30', TRUE, 25500.00, 'Available with discounted setup support.', '2026-06-01 10:45:00'),
(15, 4, '2026-07-08', FALSE, 14500.00, 'Confirmed approved booking for Community Dinner Night.', '2026-06-01 10:50:00'),
(16, 5, '2026-07-12', TRUE, 30000.00, 'Available, but related event was cancelled.', '2026-06-01 10:55:00'),
(17, 6, '2026-07-05', FALSE, 21000.00, 'Confirmed booking owned by CityBox Venues.', '2026-06-02 10:00:00'),
(18, 7, '2026-07-06', TRUE, 19000.00, 'Second owner venue available in Alexandria.', '2026-06-02 10:05:00'),
(19, 6, '2026-07-09', TRUE, 20500.00, 'Available second-owner venue date.', '2026-06-02 10:10:00'),
(20, 4, '2026-07-09', FALSE, NULL, 'Temporarily blocked for maintenance.', '2026-06-02 10:15:00');

INSERT INTO booking_requests (id, event_id, venue_id, organizer_id, requested_date, expected_attendees, special_requirements, proposed_price, counter_proposal, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, '2026-06-20', 85, 'Need outdoor lights, welcome table, and one catering prep corner.', 17500.00, NULL, 'Approved', '2026-05-09 12:00:00'),
(2, 2, 2, 1, '2026-06-28', 180, 'Need loading access for vendor booths from 8 AM.', 24000.00, '25000 EGP including security desk support and one extra setup hour.', 'Counter Proposal', '2026-05-10 12:00:00'),
(3, 3, 1, 1, '2026-06-18', 40, 'Need early access for staff training.', 14500.00, NULL, 'Pending', '2026-06-01 12:00:00'),
(4, 4, 3, 1, '2026-06-10', 35, 'Small preview request for inactive gallery.', 9000.00, NULL, 'Declined', '2026-05-31 12:00:00'),
(5, 5, 4, 1, '2026-07-03', 55, 'Quiet setup, wellness mats, and brunch table near shade.', 13500.00, NULL, 'Pending', '2026-06-08 12:00:00'),
(6, 8, 4, 1, '2026-07-08', 88, 'Dinner seating, small live music corner, and valet support.', 14500.00, NULL, 'Approved', '2026-06-11 12:00:00'),
(7, 2, 4, 1, '2026-06-28', 180, 'Backup courtyard request if warehouse counter-proposal is rejected.', 13000.00, NULL, 'Pending', '2026-06-12 12:00:00'),
(8, 6, 5, 1, '2026-07-12', 70, 'Cancelled event request kept for history.', 30000.00, 'Cannot proceed because organizer cancelled the event.', 'Declined', '2026-06-09 12:00:00'),
(9, 7, 6, 11, '2026-07-05', 95, 'Panel seating, projector, reception table, and freight elevator access.', 20500.00, NULL, 'Approved', '2026-06-10 12:00:00'),
(10, 7, 7, 11, '2026-07-06', 95, 'Backup Alexandria terrace request for second organizer.', 18000.00, '19000 EGP with sea-view catering prep included.', 'Counter Proposal', '2026-06-10 12:30:00');

INSERT INTO layouts (id, event_id, venue_id, created_by, name, layout_data, shared_with_team, export_url, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Launch Night Garden Layout', '{"zones":[{"name":"Reception","x":10,"y":15},{"name":"Stage","x":60,"y":20},{"name":"Catering","x":25,"y":70}],"capacity":85}'::jsonb, TRUE, '/demo/layouts/launch-night.pdf', '2026-05-11 14:00:00', '2026-05-12 16:30:00'),
(2, 2, 2, 1, 'Market Booth Layout', '{"zones":[{"name":"Vendor Booths","x":15,"y":20},{"name":"Demo Stage","x":70,"y":30},{"name":"Food Corner","x":20,"y":75}],"booths":24}'::jsonb, FALSE, NULL, '2026-05-12 14:00:00', NULL),
(3, 3, 1, 1, 'Operations Drill Layout', '{"zones":[{"name":"Check-in Desk","x":8,"y":12},{"name":"Vendor Drop","x":45,"y":18},{"name":"Staff Briefing","x":70,"y":60}],"notes":"Shared with team for same-day testing."}'::jsonb, TRUE, '/demo/layouts/operations-drill.pdf', '2026-06-01 14:00:00', NULL),
(4, 8, 4, 1, 'Dinner Night Courtyard Layout', '{"zones":[{"name":"Dinner Tables","x":20,"y":25},{"name":"Music Corner","x":70,"y":30},{"name":"Valet Desk","x":8,"y":8}],"tables":12}'::jsonb, TRUE, '/demo/layouts/dinner-night.pdf', '2026-06-12 14:00:00', '2026-06-13 11:00:00'),
(5, 7, 6, 11, 'Brand Salon Black Box Layout', '{"zones":[{"name":"Panel Stage","x":65,"y":20},{"name":"Reception","x":10,"y":15},{"name":"Showcase Wall","x":30,"y":65}],"owner":"CityBox"}'::jsonb, TRUE, '/demo/layouts/brand-salon.pdf', '2026-06-13 14:00:00', NULL);

INSERT INTO tasks (id, event_id, assigned_to, created_by, title, description, category, due_date, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 2, 1, 'Confirm lighting setup', 'Coordinate with venue owner and AV vendor for rooftop lighting.', 'Logistics', '2026-06-16', 'In Progress', '2026-05-13 09:00:00'),
(2, 1, 3, 1, 'Prepare guest check-in list', 'Print QR backup list and organize guest arrival desk.', 'Guest Check-In', '2026-06-19', 'Pending', '2026-05-13 09:10:00'),
(3, 2, NULL, 1, 'Assign vendor booth numbers', 'Match confirmed vendors to booth positions in the warehouse layout.', 'Setup', '2026-06-24', 'Not Assigned', '2026-05-13 09:20:00'),
(4, 1, 2, 1, 'Share final floor plan with setup team', 'Send exported layout to staff before setup day.', 'Layout', '2026-06-18', 'Done', '2026-05-13 09:30:00'),
(5, 3, 2, 1, 'Run vendor arrival checklist', 'Use the operations drill to confirm vendor arrival process.', 'Operations', '2026-06-17', 'Overdue', '2026-06-01 09:00:00'),
(6, 3, 3, 1, 'Simulate QR guest check-in', 'Practice guest check-in flow with the sample guest list.', 'Guest Check-In', '2026-06-18', 'Pending', '2026-06-01 09:10:00'),
(7, 4, 2, 1, 'Archive completed preview notes', 'Save feedback notes from the completed private preview.', 'Reporting', '2026-06-11', 'Done', '2026-06-11 09:00:00'),
(8, 5, 13, 1, 'Confirm brunch supplier', 'Confirm wellness brunch table quantities and dietary labels.', 'Catering', '2026-06-27', 'Pending', '2026-06-08 09:00:00'),
(9, 8, 3, 1, 'Prepare dinner check-in desk', 'Create QR and name-confirmation desk for Community Dinner Night.', 'Guest Check-In', '2026-07-07', 'In Progress', '2026-06-12 09:00:00'),
(10, 8, NULL, 1, 'Assign live music setup owner', 'Assign a staff member to coordinate the music corner.', 'Logistics', '2026-07-05', 'Not Assigned', '2026-06-12 09:10:00'),
(11, 6, 2, 1, 'Cancel tech demo vendor holds', 'Notify vendors that the cancelled demo should not receive deliveries.', 'Operations', '2026-06-20', 'Done', '2026-06-12 09:20:00'),
(12, 7, 18, 11, 'Farida salon reception plan', 'Second organizer task used to prove staff and organizer isolation.', 'Logistics', '2026-07-03', 'In Progress', '2026-06-13 09:00:00');

INSERT INTO budgets (id, event_id, category, planned_amount, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Venue', 18000.00, 'Approved rooftop venue booking.', '2026-05-14 10:00:00'),
(2, 1, 'Catering', 16000.00, 'Canapes and drinks for 85 guests.', '2026-05-14 10:05:00'),
(3, 1, 'Audio Visual', 9000.00, 'Speakers, microphone, and uplighting.', '2026-05-14 10:10:00'),
(4, 2, 'Venue', 25000.00, 'Warehouse hall counter-proposal amount.', '2026-05-14 10:15:00'),
(5, 3, 'Staff Training', 4500.00, 'Dry-run supplies and staff meals.', '2026-06-01 10:00:00'),
(6, 4, 'Guest Gifts', 3000.00, 'Small preview takeaway bags.', '2026-06-01 10:15:00'),
(7, 5, 'Wellness Catering', 7500.00, 'Healthy brunch station and drinks.', '2026-06-08 10:00:00'),
(8, 8, 'Venue', 14500.00, 'Approved Palm Courtyard booking.', '2026-06-12 10:00:00'),
(9, 8, 'Entertainment', 6000.00, 'Live music setup and performer fee.', '2026-06-12 10:05:00'),
(10, 7, 'Venue', 21000.00, 'Second organizer approved CityBox venue booking.', '2026-06-13 10:00:00');

INSERT INTO expenses (id, event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, NULL, 'Venue booking deposit', 'Venue', 9000.00, '2026-05-15', 'Bank transfer', '50 percent deposit paid to Nile Spaces.', '2026-05-15 11:00:00'),
(2, 1, 2, 1, 'Catering advance payment', 'Catering', 6000.00, '2026-05-16', 'Card', 'Advance payment for canape package.', '2026-05-16 11:00:00'),
(3, 1, 3, 2, 'AV reservation fee', 'Audio Visual', 3000.00, '2026-05-17', 'Bank transfer', 'Reservation fee for sound and lights.', '2026-05-17 11:00:00'),
(4, 3, 5, NULL, 'Staff meal boxes', 'Staff Training', 1800.00, '2026-06-18', 'Cash', 'Lunch boxes for operations drill team.', '2026-06-18 11:00:00'),
(5, 4, 6, 3, 'Preview signage trial', 'Guest Gifts', 1200.00, '2026-06-10', 'Card', 'Small signage test for completed preview.', '2026-06-10 11:00:00'),
(6, 8, 8, NULL, 'Palm Courtyard deposit', 'Venue', 7250.00, '2026-06-13', 'Bank transfer', 'Deposit for Community Dinner Night.', '2026-06-13 11:00:00'),
(7, 8, 9, 2, 'Music corner sound deposit', 'Entertainment', 2500.00, '2026-06-14', 'Card', 'Deposit for compact sound system.', '2026-06-14 11:00:00'),
(8, 5, 7, 1, 'Wellness brunch tasting', 'Wellness Catering', 1500.00, '2026-06-15', 'Cash', 'Small tasting before final approval.', '2026-06-15 11:00:00');

INSERT INTO sourcing_requests (id, event_id, vendor_id, organizer_id, requested_items, quantity, delivery_date, event_location, notes, clarification_note, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Canapes, welcome drinks, dessert bites', '85 guest package', '2026-06-20', 'Nile Loft Garden, Zamalek', 'Vegetarian options required.', 'Vendor confirmed two vegetarian trays and one gluten-free dessert option.', 'Accepted', '2026-05-18 13:00:00'),
(2, 1, 2, 1, 'Speakers, wireless microphone, warm uplighting', '1 complete AV setup', '2026-06-20', 'Nile Loft Garden, Zamalek', 'Setup must finish before 5 PM.', NULL, 'Accepted', '2026-05-18 13:20:00'),
(3, 2, 2, 1, 'Projector screen and two speakers', '1 market demo setup', '2026-06-28', 'Downtown Warehouse Hall', 'Needed for live creator demos.', 'Vendor confirmed projector screen dimensions.', 'Accepted', '2026-05-19 13:00:00'),
(4, 3, 1, 1, 'Coffee station and snack table', '40 staff package', '2026-06-18', 'Nile Loft Garden, Zamalek', 'Needed for training day.', NULL, 'Declined', '2026-06-01 13:00:00'),
(5, 3, 2, 1, 'Portable speaker and check-in microphone', '1 drill setup', '2026-06-18', 'Nile Loft Garden, Zamalek', 'Arrival before 9 AM.', 'Vendor confirmed backup microphone.', 'Accepted', '2026-06-01 13:20:00'),
(6, 8, 3, 1, 'Dinner table florals and entrance signage', '12 table arrangements and 1 welcome sign', '2026-07-08', 'Palm Courtyard, Maadi', 'Use warm colors and low-height arrangements.', NULL, 'Pending', '2026-06-12 13:00:00'),
(7, 8, 2, 1, 'Small sound system for live music', '1 compact sound setup', '2026-07-08', 'Palm Courtyard, Maadi', 'Outdoor sound must be soft enough for dinner.', 'Vendor recommends two compact speakers instead of four.', 'Accepted', '2026-06-12 13:20:00'),
(8, 7, 2, 11, 'Panel microphones and projector', '4 microphones and 1 projector', '2026-07-05', 'CityBox Black Box, Sheraton', 'Second organizer request for isolation testing.', NULL, 'Accepted', '2026-06-13 13:00:00'),
(9, 4, 1, 1, 'Preview tasting table and mocktails', '35 guest tasting package', '2026-06-10', 'Garden Gallery Studio, New Cairo', 'Completed preview catering ready for invoice upload testing.', 'Vendor delivered final tasting table.', 'Accepted', '2026-06-04 13:00:00'),
(10, 4, 3, 1, 'Gallery floral corner and welcome sign', '1 floral corner and 1 sign', '2026-06-10', 'Garden Gallery Studio, New Cairo', 'Completed decor setup ready for invoice upload testing.', 'Vendor used reusable white florals.', 'Accepted', '2026-06-04 13:20:00'),
(11, 3, 1, 1, 'Staff breakfast trays', '40 boxed breakfasts', '2026-06-18', 'Nile Loft Garden, Zamalek', 'Same-day completed catering delivery for invoice testing.', 'Delivered before staff briefing.', 'Accepted', '2026-06-16 13:00:00'),
(12, 3, 3, 1, 'Check-in desk flowers', '2 small desk arrangements', '2026-06-18', 'Nile Loft Garden, Zamalek', 'Same-day completed decor delivery for invoice testing.', 'Placed at guest desk.', 'Accepted', '2026-06-16 13:20:00'),
(13, 4, 2, 1, 'Small speaker and handheld microphone', '1 compact AV kit', '2026-06-10', 'Garden Gallery Studio, New Cairo', 'Completed AV setup ready for a new invoice.', 'Packed down after preview.', 'Accepted', '2026-06-04 13:40:00'),
(14, 1, 3, 1, 'Launch photo booth backdrop', '1 branded floral photo corner', '2026-06-20', 'Nile Loft Garden, Zamalek', 'Future accepted request that should not be invoice-ready yet.', NULL, 'Accepted', '2026-06-14 13:00:00'),
(15, 8, 1, 1, 'Dinner dessert tasting', '12 tasting portions', '2026-07-08', 'Palm Courtyard, Maadi', 'Future accepted request that stays preparing.', NULL, 'Accepted', '2026-06-14 13:20:00');

INSERT INTO deliveries (id, sourcing_request_id, event_id, vendor_id, status, scheduled_arrival, arrived_at, confirmation_notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Delivered', '2026-06-20 15:30:00', '2026-06-20 15:20:00', 'Menu locked; catering delivered for launch invoice history.', '2026-05-20 09:00:00'),
(2, 2, 1, 2, 'Delivered', '2026-06-20 14:00:00', '2026-06-20 13:50:00', 'AV setup delivered for launch invoice history.', '2026-05-20 09:10:00'),
(3, 3, 2, 2, 'Delayed', '2026-06-28 09:00:00', NULL, 'Vendor warned that setup may arrive one hour late.', '2026-05-20 09:20:00'),
(4, 5, 3, 2, 'Delivered', '2026-06-18 09:00:00', '2026-06-18 08:55:00', 'AV drill kit delivered early.', '2026-06-18 08:55:00'),
(5, 7, 8, 2, 'Preparing', '2026-07-08 16:30:00', NULL, 'Sound equipment reserved for dinner event.', '2026-06-13 09:00:00'),
(6, 8, 7, 2, 'Delivered', '2026-07-05 12:00:00', '2026-07-05 11:50:00', 'Second organizer panel equipment delivered early.', '2026-06-13 09:10:00'),
(7, 9, 4, 1, 'Delivered', '2026-06-10 14:30:00', '2026-06-10 14:20:00', 'Preview tasting table delivered and signed off.', '2026-06-10 14:20:00'),
(8, 10, 4, 3, 'Delivered', '2026-06-10 15:00:00', '2026-06-10 14:50:00', 'Gallery floral corner delivered and photographed.', '2026-06-10 14:50:00'),
(9, 11, 3, 1, 'Delivered', '2026-06-18 08:00:00', '2026-06-18 07:50:00', 'Staff breakfast trays delivered before briefing.', '2026-06-18 07:50:00'),
(10, 12, 3, 3, 'Delivered', '2026-06-18 08:30:00', '2026-06-18 08:25:00', 'Check-in desk flowers delivered for operations drill.', '2026-06-18 08:25:00'),
(11, 13, 4, 2, 'Delivered', '2026-06-10 15:30:00', '2026-06-10 15:15:00', 'Compact AV kit delivered for preview event.', '2026-06-10 15:15:00'),
(12, 14, 1, 3, 'Preparing', '2026-06-20 13:00:00', NULL, 'Backdrop is still being prepared for launch day.', '2026-06-14 09:00:00'),
(13, 15, 8, 1, 'Preparing', '2026-07-08 15:00:00', NULL, 'Dessert tasting not delivered yet.', '2026-06-14 09:20:00');

INSERT INTO invoices (id, delivery_id, sourcing_request_id, event_id, vendor_id, invoice_number, amount, status, itemized_breakdown, supporting_document_url, submitted_at, reviewed_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 1, 'CB-2026-061', 15300.00, 'Pending Review', '85 guest canape package with drinks and dessert bites.', '/demo/invoices/cb-2026-061.pdf', '2026-06-20 23:00:00', NULL, '2026-06-20 23:00:00'),
(2, 2, 2, 1, 2, 'GAV-2026-044', 8500.00, 'Approved', 'Basic sound package, wireless microphone, and warm uplighting.', '/demo/invoices/gav-2026-044.pdf', '2026-06-20 22:30:00', '2026-06-21 10:00:00', '2026-06-20 22:30:00'),
(3, 4, 5, 3, 2, 'GAV-2026-050', 2500.00, 'Paid', 'Portable speaker and check-in microphone for operations drill.', '/demo/invoices/gav-2026-050.pdf', '2026-06-18 16:30:00', '2026-06-18 17:00:00', '2026-06-18 16:30:00'),
(4, NULL, 4, 3, 1, 'CB-2026-TEST', 3800.00, 'Rejected', 'Declined coffee station request should not be charged.', '/demo/invoices/cb-2026-test.pdf', '2026-06-18 18:00:00', '2026-06-18 18:30:00', '2026-06-18 18:00:00'),
(5, 5, 7, 8, 2, 'GAV-2026-071', 6200.00, 'Pending Review', 'Compact outdoor sound system for Community Dinner Night.', '/demo/invoices/gav-2026-071.pdf', '2026-07-08 23:20:00', NULL, '2026-07-08 23:20:00'),
(6, 6, 8, 7, 2, 'GAV-2026-072', 7200.00, 'Approved', 'Panel microphones and projector for Farida Brand Salon.', '/demo/invoices/gav-2026-072.pdf', '2026-07-05 22:00:00', '2026-07-06 10:00:00', '2026-07-05 22:00:00');

INSERT INTO guests (id, event_id, user_id, full_name, email, phone, dietary_preferences, special_requirements, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 6, 'Youssef Nabil', 'youssef.guest@popeyez.demo', '+20 100 666 7777', 'No seafood', NULL, 'VIP guest from brand partner.', '2026-05-21 10:00:00'),
(2, 1, 7, 'Salma Riad', 'salma.guest@popeyez.demo', '+20 100 777 8888', 'Vegetarian', 'Aisle seat if seating is assigned.', 'Media contact.', '2026-05-21 10:05:00'),
(3, 1, NULL, 'Farah Amin', 'farah.amin@example.com', '+20 100 999 1111', 'Gluten-free', NULL, 'Invited by organizer.', '2026-05-21 10:10:00'),
(4, 2, NULL, 'Tarek Mostafa', 'tarek.mostafa@example.com', '+20 100 999 2222', NULL, NULL, 'Creator booth applicant.', '2026-05-21 10:15:00'),
(5, 3, NULL, 'Ahmed Amin', 'ahmed.amin@example.com', '+20 100 999 3333', 'Vegetarian', NULL, 'Demo guest for check-in status testing.', '2026-06-01 10:00:00'),
(6, 3, 16, 'Leen Farouk', 'leen.guest@popeyez.demo', '+20 101 666 7777', 'Nut allergy', 'Needs staff escort at entrance.', 'Demo guest for special requirement testing.', '2026-06-01 10:05:00'),
(7, 4, 15, 'Mina Atef', 'mina.guest@popeyez.demo', '+20 101 555 6666', NULL, NULL, 'Completed preview feedback guest.', '2026-06-10 10:00:00'),
(8, 8, 17, 'Bassel Karim', 'bassel.guest@popeyez.demo', '+20 101 777 8888', 'Halal', NULL, 'Dinner guest who has opened invitation but not checked in yet.', '2026-06-12 10:00:00'),
(9, 8, NULL, 'Dalia Nour', 'dalia.nour@example.com', '+20 101 999 1111', 'Vegan', 'Near stage if possible.', 'Dinner guest with special seating note.', '2026-06-12 10:05:00'),
(10, 8, NULL, 'Omar El Daly', 'omar.daly@example.com', '+20 101 999 2222', NULL, NULL, 'Dinner guest who declined RSVP.', '2026-06-12 10:10:00'),
(11, 7, NULL, 'Nadine Shaker', 'nadine.shaker@example.com', '+20 101 999 3333', 'No dairy', NULL, 'Second organizer guest for isolation testing.', '2026-06-13 10:00:00'),
(12, 4, 17, 'Bassel Karim', 'bassel.guest@popeyez.demo', '+20 101 777 8888', 'Halal', NULL, 'Completed preview attendee with a pending feedback request.', '2026-06-10 10:10:00');

INSERT INTO invitations (id, event_id, guest_id, sent_by, invitation_code, channel, status, sent_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'INV-LAUNCH-001', 'email', 'Opened', '2026-05-22 09:00:00', '2026-05-22 09:00:00'),
(2, 1, 2, 1, 'INV-LAUNCH-002', 'email', 'Opened', '2026-05-22 09:05:00', '2026-05-22 09:05:00'),
(3, 1, 3, 1, 'INV-LAUNCH-003', 'email', 'Sent', '2026-05-22 09:10:00', '2026-05-22 09:10:00'),
(4, 2, 4, 1, 'INV-MARKET-001', 'platform', 'Sent', '2026-05-23 09:00:00', '2026-05-23 09:00:00'),
(5, 3, 5, 1, 'INV-DRILL-001', 'email', 'Draft', NULL, '2026-06-01 09:00:00'),
(6, 3, 6, 1, 'INV-DRILL-002', 'email', 'Cancelled', '2026-06-01 09:05:00', '2026-06-01 09:05:00'),
(7, 4, 7, 1, 'INV-PAST-001', 'email', 'Opened', '2026-06-09 09:00:00', '2026-06-09 09:00:00'),
(8, 8, 8, 1, 'INV-DINNER-001', 'email', 'Opened', '2026-06-12 09:00:00', '2026-06-12 09:00:00'),
(9, 8, 9, 1, 'INV-DINNER-002', 'email', 'Sent', '2026-06-12 09:05:00', '2026-06-12 09:05:00'),
(10, 8, 10, 1, 'INV-DINNER-003', 'platform', 'Opened', '2026-06-12 09:10:00', '2026-06-12 09:10:00'),
(11, 7, 11, 11, 'INV-SALON-001', 'email', 'Opened', '2026-06-13 09:00:00', '2026-06-13 09:00:00'),
(12, 4, 12, 1, 'INV-PAST-002', 'email', 'Opened', '2026-06-09 09:10:00', '2026-06-09 09:10:00');

INSERT INTO rsvps (id, invitation_id, event_id, guest_id, status, dietary_preferences, special_requirements, responded_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Attending', 'No seafood', NULL, '2026-05-22 12:00:00', '2026-05-22 12:00:00'),
(2, 2, 1, 2, 'Maybe', 'Vegetarian', 'Aisle seat if seating is assigned.', '2026-05-22 12:20:00', '2026-05-22 12:20:00'),
(3, 3, 1, 3, 'No Response', 'Gluten-free', NULL, NULL, '2026-05-22 12:40:00'),
(4, 4, 2, 4, 'Attending', NULL, NULL, '2026-05-23 12:00:00', '2026-05-23 12:00:00'),
(5, 5, 3, 5, 'No Response', 'Vegetarian', NULL, NULL, '2026-06-01 12:00:00'),
(6, 6, 3, 6, 'Not Attending', 'Nut allergy', 'Cancelled because guest cannot attend drill.', '2026-06-01 12:10:00', '2026-06-01 12:10:00'),
(7, 7, 4, 7, 'Attending', NULL, NULL, '2026-06-09 12:00:00', '2026-06-09 12:00:00'),
(8, 8, 8, 8, 'Attending', 'Halal', NULL, '2026-06-12 12:00:00', '2026-06-12 12:00:00'),
(9, 9, 8, 9, 'Maybe', 'Vegan', 'Near stage if possible.', '2026-06-12 12:10:00', '2026-06-12 12:10:00'),
(10, 10, 8, 10, 'Not Attending', NULL, 'Travel conflict.', '2026-06-12 12:20:00', '2026-06-12 12:20:00'),
(11, 11, 7, 11, 'Attending', 'No dairy', NULL, '2026-06-13 12:00:00', '2026-06-13 12:00:00'),
(12, 12, 4, 12, 'Attending', 'Halal', NULL, '2026-06-09 12:10:00', '2026-06-09 12:10:00');

INSERT INTO messages (id, event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status, seen_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 6, 1, 'Arrival details', 'Doors open at 6 PM. Please use the rooftop entrance.', 'day-of', 'Seen', '2026-06-20 16:10:00', '2026-06-20 15:45:00'),
(2, 1, 1, 7, 2, 'Arrival details', 'Doors open at 6 PM. Please use the rooftop entrance.', 'day-of', 'Received', NULL, '2026-06-20 15:45:00'),
(3, 1, 1, NULL, 3, 'Reminder', 'We have not received your RSVP yet. Please confirm when possible.', 'follow-up', 'Sent', NULL, '2026-06-18 10:00:00'),
(4, 1, 4, 1, NULL, 'Catering clarification', 'We will bring extra vegetarian trays as requested.', 'clarification', 'Seen', '2026-05-19 09:30:00', '2026-05-19 09:00:00'),
(5, 3, 1, NULL, 5, 'Drill reminder', 'Please arrive at 10 AM for the operations drill.', 'notification', 'Sent', NULL, '2026-06-18 08:00:00'),
(6, 3, 1, 16, 6, 'Entrance changed', 'Use the side entrance for the drill check-in desk.', 'day-of', 'Received', NULL, '2026-06-18 09:00:00'),
(7, 8, 1, 17, 8, 'Dinner arrival', 'Dinner starts at 7 PM. Valet is available at the courtyard entrance.', 'day-of', 'Seen', '2026-07-08 16:00:00', '2026-07-08 15:30:00'),
(8, 8, 1, NULL, 9, 'Dinner reminder', 'Please confirm your final RSVP before tomorrow.', 'follow-up', 'Sent', NULL, '2026-07-06 10:00:00'),
(9, 8, 1, NULL, 10, 'Thank you', 'Thank you for letting us know you cannot attend.', 'notification', 'Received', NULL, '2026-06-12 13:00:00'),
(10, 7, 11, NULL, 11, 'Salon arrival', 'Please arrive through the freight elevator lobby for check-in.', 'day-of', 'Received', NULL, '2026-07-05 14:00:00'),
(11, 4, 1, 17, 12, 'Feedback request', 'Thanks for attending Past Feedback Review. Please submit your post-event feedback in the guest workspace.', 'notification', 'Received', NULL, '2026-06-11 09:00:00');

INSERT INTO checkins (id, event_id, guest_id, checked_in_by, status, checkin_method, checked_in_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 3, 'Arrived', 'qr_code', '2026-06-20 18:05:00', '2026-06-20 18:05:00'),
(2, 1, 2, 3, 'Not Arrived', NULL, NULL, '2026-06-20 18:10:00'),
(3, 1, 3, 3, 'Not Arrived', NULL, NULL, '2026-06-20 18:10:00'),
(4, 2, 4, NULL, 'Not Arrived', NULL, NULL, '2026-05-23 12:10:00'),
(5, 3, 5, 2, 'Arrived', 'name_confirmation', '2026-06-18 10:05:00', '2026-06-18 10:05:00'),
(6, 3, 6, NULL, 'Not Arrived', NULL, NULL, '2026-06-18 10:10:00'),
(7, 4, 7, 3, 'Arrived', 'qr_code', '2026-06-10 17:05:00', '2026-06-10 17:05:00'),
(8, 8, 8, NULL, 'Not Arrived', NULL, NULL, '2026-07-08 18:00:00'),
(9, 8, 9, NULL, 'Not Arrived', NULL, NULL, '2026-07-08 18:05:00'),
(10, 8, 10, NULL, 'Not Arrived', NULL, NULL, '2026-07-08 18:10:00'),
(11, 7, 11, 18, 'Arrived', 'qr_code', '2026-07-05 17:02:00', '2026-07-05 17:02:00'),
(12, 4, 12, 3, 'Arrived', 'qr_code', '2026-06-10 17:08:00', '2026-06-10 17:08:00');

INSERT INTO feedback (id, event_id, guest_id, overall_rating, food_rating, venue_rating, organization_rating, sentiment, comments, submitted_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 4, 7, 2, 2, 3, 2, 'Negative', 'The preview was useful, but signage was confusing and check-in was slow.', '2026-06-11 10:00:00', '2026-06-11 10:00:00');

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('venues', 'id'), COALESCE((SELECT MAX(id) FROM venues), 1));
SELECT setval(pg_get_serial_sequence('vendors', 'id'), COALESCE((SELECT MAX(id) FROM vendors), 1));
SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE((SELECT MAX(id) FROM events), 1));
SELECT setval(pg_get_serial_sequence('venue_availability', 'id'), COALESCE((SELECT MAX(id) FROM venue_availability), 1));
SELECT setval(pg_get_serial_sequence('booking_requests', 'id'), COALESCE((SELECT MAX(id) FROM booking_requests), 1));
SELECT setval(pg_get_serial_sequence('layouts', 'id'), COALESCE((SELECT MAX(id) FROM layouts), 1));
SELECT setval(pg_get_serial_sequence('tasks', 'id'), COALESCE((SELECT MAX(id) FROM tasks), 1));
SELECT setval(pg_get_serial_sequence('budgets', 'id'), COALESCE((SELECT MAX(id) FROM budgets), 1));
SELECT setval(pg_get_serial_sequence('expenses', 'id'), COALESCE((SELECT MAX(id) FROM expenses), 1));
SELECT setval(pg_get_serial_sequence('sourcing_requests', 'id'), COALESCE((SELECT MAX(id) FROM sourcing_requests), 1));
SELECT setval(pg_get_serial_sequence('deliveries', 'id'), COALESCE((SELECT MAX(id) FROM deliveries), 1));
SELECT setval(pg_get_serial_sequence('invoices', 'id'), COALESCE((SELECT MAX(id) FROM invoices), 1));
SELECT setval(pg_get_serial_sequence('guests', 'id'), COALESCE((SELECT MAX(id) FROM guests), 1));
SELECT setval(pg_get_serial_sequence('invitations', 'id'), COALESCE((SELECT MAX(id) FROM invitations), 1));
SELECT setval(pg_get_serial_sequence('rsvps', 'id'), COALESCE((SELECT MAX(id) FROM rsvps), 1));
SELECT setval(pg_get_serial_sequence('messages', 'id'), COALESCE((SELECT MAX(id) FROM messages), 1));
SELECT setval(pg_get_serial_sequence('checkins', 'id'), COALESCE((SELECT MAX(id) FROM checkins), 1));
SELECT setval(pg_get_serial_sequence('feedback', 'id'), COALESCE((SELECT MAX(id) FROM feedback), 1));
