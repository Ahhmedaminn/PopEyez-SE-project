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
(10, 'Mona Kamal', 'mona.guest@popeyez.demo', 'demo_hash_guest', 'guest', 'Deactivated', '+20 100 999 0002', 26, NULL, NULL, NULL, 1, '2026-05-04 12:00:00');

INSERT INTO venues (id, owner_id, name, description, location, city, capacity, dimensions_sqm, amenities, daily_price, photo_url, floor_plan_url, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 8, 'Nile Loft Garden', 'Rooftop pop-up venue with garden seating and Nile views.', 'Zamalek, Cairo', 'Cairo', 120, 260.00, 'Wi-Fi, catering prep area, outdoor lighting, parking nearby', 18000.00, '/demo/venues/nile-loft.jpg', '/demo/floorplans/nile-loft.pdf', 'Active', '2026-05-05 09:00:00'),
(2, 8, 'Downtown Warehouse Hall', 'Industrial indoor hall suitable for product launches and creative markets.', 'Downtown Cairo', 'Cairo', 220, 420.00, 'Loading dock, stage power, restrooms, security desk', 26000.00, '/demo/venues/warehouse-hall.jpg', '/demo/floorplans/warehouse-hall.pdf', 'Active', '2026-05-05 09:30:00'),
(3, 8, 'Garden Gallery Studio', 'Small gallery-style pop-up space for previews and private showcases.', 'New Cairo', 'Cairo', 60, 140.00, 'Gallery lighting, storage room, restroom, street parking', 12000.00, '/demo/venues/gallery-studio.jpg', '/demo/floorplans/gallery-studio.pdf', 'Inactive', '2026-05-05 10:00:00'),
(4, 8, 'Palm Courtyard', 'Open-air courtyard suitable for dinners, workshops, and brand activations.', 'Maadi, Cairo', 'Cairo', 90, 210.00, 'Outdoor lighting, preparation room, Wi-Fi, valet area', 14500.00, '/demo/venues/palm-courtyard.jpg', '/demo/floorplans/palm-courtyard.pdf', 'Active', '2026-05-05 10:15:00'),
(5, 8, 'Riverside Conference Deck', 'Large covered event deck for conferences, exhibitions, and launch events.', 'Manial, Cairo', 'Cairo', 300, 560.00, 'Stage, projector, sound system, parking, loading access', 32000.00, '/demo/venues/riverside-deck.jpg', '/demo/floorplans/riverside-deck.pdf', 'Active', '2026-05-05 10:30:00');

INSERT INTO vendors (id, user_id, company_name, supplies_offered, main_location, pricing_list, contact_email, contact_phone, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 4, 'Cairo Bites Catering', 'Canapes, buffet stations, drinks, dessert table', 'Maadi, Cairo', 'Canape package: 180 EGP/person; buffet package: 350 EGP/person', 'karim.vendor@popeyez.demo', '+20 100 444 5555', 'Active', '2026-05-06 10:00:00'),
(2, 5, 'Glow Audio Visuals', 'Speakers, microphones, uplighting, projector screens', 'Heliopolis, Cairo', 'Basic sound: 7500 EGP; lighting package: 9500 EGP', 'laila.vendor@popeyez.demo', '+20 100 555 6666', 'Active', '2026-05-06 10:30:00'),
(3, NULL, 'Bloom Booth Decor', 'Floral arches, booth styling, signage, table decor', 'Nasr City, Cairo', 'Booth styling: 4500 EGP; floral arch: 6500 EGP', 'decor@popeyez.demo', '+20 100 999 0003', 'Inactive', '2026-05-06 11:00:00');

INSERT INTO events (id, organizer_id, venue_id, name, event_type, description, event_date, start_time, end_time, expected_attendees, dress_code, agenda, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 'Summer Pop-Up Launch', 'Product Launch', 'Evening launch event for a local fashion brand.', '2026-06-20', '18:00:00', '22:00:00', 85, 'Smart casual', 'Welcome drinks, brand reveal, networking, closing remarks', 'Planned', '2026-05-07 09:00:00'),
(2, 1, 2, 'Creators Weekend Market', 'Market', 'Weekend marketplace for local creators and food vendors.', '2026-06-28', '12:00:00', '20:00:00', 180, 'Casual', 'Vendor setup, public opening, live demo, closing cleanup', 'Planned', '2026-05-08 09:00:00'),
(3, 1, 1, 'Today Setup Drill', 'Operations Test', 'Same-day dry run used to test dashboards, check-ins, and delivery updates.', '2026-06-14', '10:00:00', '16:00:00', 40, 'Team uniform', 'Morning setup, vendor arrival, guest desk simulation, wrap-up', 'Ongoing', '2026-06-01 09:00:00'),
(4, 1, 3, 'Past Feedback Review', 'Private Preview', 'Completed small preview used to test post-event feedback and reports.', '2026-06-10', '17:00:00', '20:00:00', 35, 'Casual', 'Preview, guest survey, teardown', 'Completed', '2026-05-30 09:00:00');

INSERT INTO venue_availability (id, venue_id, available_date, is_available, price_override, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, '2026-06-20', TRUE, 18000.00, 'Available for evening booking.', '2026-05-08 10:00:00'),
(2, 1, '2026-06-21', FALSE, NULL, 'Private event already confirmed.', '2026-05-08 10:05:00'),
(3, 2, '2026-06-28', TRUE, 25000.00, 'Discounted weekend package.', '2026-05-08 10:10:00'),
(4, 2, '2026-06-29', TRUE, 26000.00, 'Available for follow-up day.', '2026-05-08 10:15:00'),
(5, 1, '2026-06-14', TRUE, 15000.00, 'Available for same-day operations drill.', '2026-06-01 10:00:00'),
(6, 3, '2026-06-30', FALSE, NULL, 'Inactive venue; not accepting bookings.', '2026-06-01 10:05:00'),
(7, 2, '2026-06-20', FALSE, NULL, 'Already reserved for a private conference.', '2026-06-01 10:10:00'),
(8, 4, '2026-06-20', TRUE, 14000.00, 'Available with discounted weekday setup package.', '2026-06-01 10:15:00'),
(9, 5, '2026-06-20', TRUE, 32000.00, 'Available with full conference equipment.', '2026-06-01 10:20:00'),
(10, 1, '2026-06-28', FALSE, NULL, 'Unavailable due to maintenance.', '2026-06-01 10:25:00'),
(11, 4, '2026-06-28', TRUE, 14500.00, 'Available for an afternoon or evening booking.', '2026-06-01 10:30:00'),
(12, 5, '2026-06-28', FALSE, NULL, 'Reserved for an exhibition.', '2026-06-01 10:35:00'),
(13, 1, '2026-06-30', TRUE, 18000.00, 'Available for evening events.', '2026-06-01 10:40:00'),
(14, 2, '2026-06-30', TRUE, 25500.00, 'Available with discounted setup support.', '2026-06-01 10:45:00'),
(15, 4, '2026-06-30', FALSE, NULL, 'Unavailable for private maintenance.', '2026-06-01 10:50:00'),
(16, 5, '2026-06-30', TRUE, 30000.00, 'Available with reduced weekday rate.', '2026-06-01 10:55:00');

INSERT INTO booking_requests (id, event_id, venue_id, organizer_id, requested_date, expected_attendees, special_requirements, proposed_price, counter_proposal, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, '2026-06-20', 85, 'Need outdoor lights, welcome table, and one catering prep corner.', 17500.00, NULL, 'Approved', '2026-05-09 12:00:00'),
(2, 2, 2, 1, '2026-06-28', 180, 'Need loading access for vendor booths from 8 AM.', 24000.00, 'Venue owner offered 25000 EGP including security desk support.', 'Counter Proposal', '2026-05-10 12:00:00'),
(3, 3, 1, 1, '2026-06-14', 40, 'Need early access for staff training.', 14500.00, NULL, 'Pending', '2026-06-01 12:00:00'),
(4, 4, 3, 1, '2026-06-10', 35, 'Small preview request for inactive gallery.', 9000.00, NULL, 'Declined', '2026-05-31 12:00:00');

INSERT INTO layouts (id, event_id, venue_id, created_by, name, layout_data, shared_with_team, export_url, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Launch Night Garden Layout', '{"zones":[{"name":"Reception","x":10,"y":15},{"name":"Stage","x":60,"y":20},{"name":"Catering","x":25,"y":70}],"capacity":85}'::jsonb, TRUE, '/demo/layouts/launch-night.pdf', '2026-05-11 14:00:00', '2026-05-12 16:30:00'),
(2, 2, 2, 1, 'Market Booth Layout', '{"zones":[{"name":"Vendor Booths","x":15,"y":20},{"name":"Demo Stage","x":70,"y":30},{"name":"Food Corner","x":20,"y":75}],"booths":24}'::jsonb, FALSE, NULL, '2026-05-12 14:00:00', NULL),
(3, 3, 1, 1, 'Operations Drill Layout', '{"zones":[{"name":"Check-in Desk","x":8,"y":12},{"name":"Vendor Drop","x":45,"y":18},{"name":"Staff Briefing","x":70,"y":60}],"notes":"Shared with team for same-day testing."}'::jsonb, TRUE, '/demo/layouts/operations-drill.pdf', '2026-06-01 14:00:00', NULL);

INSERT INTO tasks (id, event_id, assigned_to, created_by, title, description, category, due_date, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 2, 1, 'Confirm lighting setup', 'Coordinate with venue owner and AV vendor for rooftop lighting.', 'Logistics', '2026-06-16', 'In Progress', '2026-05-13 09:00:00'),
(2, 1, 3, 1, 'Prepare guest check-in list', 'Print QR backup list and organize guest arrival desk.', 'Guest Check-In', '2026-06-19', 'Pending', '2026-05-13 09:10:00'),
(3, 2, NULL, 1, 'Assign vendor booth numbers', 'Match confirmed vendors to booth positions in the warehouse layout.', 'Setup', '2026-06-24', 'Not Assigned', '2026-05-13 09:20:00'),
(4, 1, 2, 1, 'Share final floor plan with setup team', 'Send exported layout to staff before setup day.', 'Layout', '2026-06-18', 'Done', '2026-05-13 09:30:00'),
(5, 3, 2, 1, 'Run vendor arrival checklist', 'Use the operations drill to confirm vendor arrival process.', 'Operations', '2026-06-13', 'Overdue', '2026-06-01 09:00:00'),
(6, 3, 3, 1, 'Simulate QR guest check-in', 'Practice guest check-in flow with the sample guest list.', 'Guest Check-In', '2026-06-15', 'Pending', '2026-06-01 09:10:00'),
(7, 4, 2, 1, 'Archive completed preview notes', 'Save feedback notes from the completed private preview.', 'Reporting', '2026-06-11', 'Done', '2026-06-11 09:00:00');

INSERT INTO budgets (id, event_id, category, planned_amount, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Venue', 18000.00, 'Approved rooftop venue booking.', '2026-05-14 10:00:00'),
(2, 1, 'Catering', 16000.00, 'Canapes and drinks for 85 guests.', '2026-05-14 10:05:00'),
(3, 1, 'Audio Visual', 9000.00, 'Speakers, microphone, and uplighting.', '2026-05-14 10:10:00'),
(4, 2, 'Venue', 25000.00, 'Warehouse hall weekend package.', '2026-05-14 10:15:00'),
(5, 3, 'Staff Training', 4500.00, 'Dry-run supplies and staff meals.', '2026-06-01 10:00:00'),
(6, 4, 'Guest Gifts', 3000.00, 'Small preview takeaway bags.', '2026-06-01 10:15:00');

INSERT INTO expenses (id, event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, NULL, 'Venue booking deposit', 'Venue', 9000.00, '2026-05-15', 'Bank transfer', '50 percent deposit paid to Nile Spaces.', '2026-05-15 11:00:00'),
(2, 1, 2, 1, 'Catering advance payment', 'Catering', 6000.00, '2026-05-16', 'Card', 'Advance payment for canape package.', '2026-05-16 11:00:00'),
(3, 1, 3, 2, 'AV reservation fee', 'Audio Visual', 3000.00, '2026-05-17', 'Bank transfer', 'Reservation fee for sound and lights.', '2026-05-17 11:00:00'),
(4, 3, 5, NULL, 'Staff meal boxes', 'Staff Training', 1800.00, '2026-06-14', 'Cash', 'Lunch boxes for operations drill team.', '2026-06-14 11:00:00'),
(5, 4, 6, 3, 'Preview signage trial', 'Guest Gifts', 1200.00, '2026-06-10', 'Card', 'Small signage test for completed preview.', '2026-06-10 11:00:00');

INSERT INTO sourcing_requests (id, event_id, vendor_id, organizer_id, requested_items, quantity, delivery_date, event_location, notes, clarification_note, status, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Canapes, welcome drinks, dessert bites', '85 guest package', '2026-06-20', 'Nile Loft Garden, Zamalek', 'Vegetarian options required.', 'Vendor confirmed two vegetarian trays and one gluten-free dessert option.', 'Accepted', '2026-05-18 13:00:00'),
(2, 1, 2, 1, 'Speakers, wireless microphone, warm uplighting', '1 complete AV setup', '2026-06-20', 'Nile Loft Garden, Zamalek', 'Setup must finish before 5 PM.', NULL, 'Accepted', '2026-05-18 13:20:00'),
(3, 2, 2, 1, 'Projector screen and two speakers', '1 market demo setup', '2026-06-28', 'Downtown Warehouse Hall', 'Needed for live creator demos.', NULL, 'Pending', '2026-05-19 13:00:00'),
(4, 3, 1, 1, 'Coffee station and snack table', '40 staff package', '2026-06-14', 'Nile Loft Garden, Zamalek', 'Needed for training day.', NULL, 'Declined', '2026-06-01 13:00:00'),
(5, 3, 2, 1, 'Portable speaker and check-in microphone', '1 drill setup', '2026-06-14', 'Nile Loft Garden, Zamalek', 'Arrival before 9 AM.', 'Vendor confirmed backup microphone.', 'Accepted', '2026-06-01 13:20:00');

INSERT INTO deliveries (id, sourcing_request_id, event_id, vendor_id, status, scheduled_arrival, arrived_at, confirmation_notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Preparing', '2026-06-20 15:30:00', NULL, 'Menu locked; kitchen team assigned.', '2026-05-20 09:00:00'),
(2, 2, 1, 2, 'Out for Delivery', '2026-06-20 14:00:00', NULL, 'Driver will call Omar on arrival.', '2026-05-20 09:10:00'),
(3, 3, 2, 2, 'Delayed', '2026-06-28 09:00:00', NULL, 'Vendor warned that setup may arrive one hour late.', '2026-05-20 09:20:00'),
(4, 5, 3, 2, 'Arrived', '2026-06-14 09:00:00', '2026-06-14 08:55:00', 'AV drill kit arrived early.', '2026-06-14 08:55:00');

INSERT INTO invoices (id, delivery_id, sourcing_request_id, event_id, vendor_id, invoice_number, amount, status, itemized_breakdown, supporting_document_url, submitted_at, reviewed_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 1, 'CB-2026-061', 15300.00, 'Pending Review', '85 guest canape package with drinks and dessert bites.', '/demo/invoices/cb-2026-061.pdf', '2026-06-20 23:00:00', NULL, '2026-06-20 23:00:00'),
(2, 2, 2, 1, 2, 'GAV-2026-044', 8500.00, 'Approved', 'Basic sound package, wireless microphone, and warm uplighting.', '/demo/invoices/gav-2026-044.pdf', '2026-06-20 22:30:00', '2026-06-21 10:00:00', '2026-06-20 22:30:00'),
(3, 4, 5, 3, 2, 'GAV-2026-050', 2500.00, 'Paid', 'Portable speaker and check-in microphone for operations drill.', '/demo/invoices/gav-2026-050.pdf', '2026-06-14 16:30:00', '2026-06-14 17:00:00', '2026-06-14 16:30:00'),
(4, NULL, 4, 3, 1, 'CB-2026-TEST', 3800.00, 'Rejected', 'Declined coffee station request should not be charged.', '/demo/invoices/cb-2026-test.pdf', '2026-06-14 18:00:00', '2026-06-14 18:30:00', '2026-06-14 18:00:00');

INSERT INTO guests (id, event_id, user_id, full_name, email, phone, dietary_preferences, special_requirements, notes, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 6, 'Youssef Nabil', 'youssef.guest@popeyez.demo', '+20 100 666 7777', 'No seafood', NULL, 'VIP guest from brand partner.', '2026-05-21 10:00:00'),
(2, 1, 7, 'Salma Riad', 'salma.guest@popeyez.demo', '+20 100 777 8888', 'Vegetarian', 'Aisle seat if seating is assigned.', 'Media contact.', '2026-05-21 10:05:00'),
(3, 1, NULL, 'Farah Amin', 'farah.amin@example.com', '+20 100 999 1111', 'Gluten-free', NULL, 'Invited by organizer.', '2026-05-21 10:10:00'),
(4, 2, NULL, 'Tarek Mostafa', 'tarek.mostafa@example.com', '+20 100 999 2222', NULL, NULL, 'Creator booth applicant.', '2026-05-21 10:15:00'),
(5, 3, NULL, 'Ahmed Amin', 'ahmed.amin@example.com', '+20 100 999 3333', 'Vegetarian', NULL, 'Demo guest for check-in status testing.', '2026-06-01 10:00:00'),
(6, 3, NULL, 'Leen Farouk', 'leen.farouk@example.com', '+20 100 999 4444', 'Nut allergy', 'Needs staff escort at entrance.', 'Demo guest for special requirement testing.', '2026-06-01 10:05:00'),
(7, 4, NULL, 'Mina Atef', 'mina.atef@example.com', '+20 100 999 5555', NULL, NULL, 'Completed preview feedback guest.', '2026-06-10 10:00:00');

INSERT INTO invitations (id, event_id, guest_id, sent_by, invitation_code, channel, status, sent_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'INV-LAUNCH-001', 'email', 'Opened', '2026-05-22 09:00:00', '2026-05-22 09:00:00'),
(2, 1, 2, 1, 'INV-LAUNCH-002', 'email', 'Opened', '2026-05-22 09:05:00', '2026-05-22 09:05:00'),
(3, 1, 3, 1, 'INV-LAUNCH-003', 'sms', 'Sent', '2026-05-22 09:10:00', '2026-05-22 09:10:00'),
(4, 2, 4, 1, 'INV-MARKET-001', 'platform', 'Sent', '2026-05-23 09:00:00', '2026-05-23 09:00:00'),
(5, 3, 5, 1, 'INV-DRILL-001', 'email', 'Draft', NULL, '2026-06-01 09:00:00'),
(6, 3, 6, 1, 'INV-DRILL-002', 'sms', 'Cancelled', '2026-06-01 09:05:00', '2026-06-01 09:05:00'),
(7, 4, 7, 1, 'INV-PAST-001', 'email', 'Opened', '2026-06-09 09:00:00', '2026-06-09 09:00:00');

INSERT INTO rsvps (id, invitation_id, event_id, guest_id, status, dietary_preferences, special_requirements, responded_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 1, 'Attending', 'No seafood', NULL, '2026-05-22 12:00:00', '2026-05-22 12:00:00'),
(2, 2, 1, 2, 'Maybe', 'Vegetarian', 'Aisle seat if seating is assigned.', '2026-05-22 12:20:00', '2026-05-22 12:20:00'),
(3, 3, 1, 3, 'No Response', 'Gluten-free', NULL, NULL, '2026-05-22 12:40:00'),
(4, 4, 2, 4, 'Attending', NULL, NULL, '2026-05-23 12:00:00', '2026-05-23 12:00:00'),
(5, 5, 3, 5, 'No Response', 'Vegetarian', NULL, NULL, '2026-06-01 12:00:00'),
(6, 6, 3, 6, 'Not Attending', 'Nut allergy', 'Cancelled because guest cannot attend drill.', '2026-06-01 12:10:00', '2026-06-01 12:10:00'),
(7, 7, 4, 7, 'Attending', NULL, NULL, '2026-06-09 12:00:00', '2026-06-09 12:00:00');

INSERT INTO messages (id, event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status, seen_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 6, 1, 'Arrival details', 'Doors open at 6 PM. Please use the rooftop entrance.', 'day-of', 'Seen', '2026-06-20 16:10:00', '2026-06-20 15:45:00'),
(2, 1, 1, 7, 2, 'Arrival details', 'Doors open at 6 PM. Please use the rooftop entrance.', 'day-of', 'Received', NULL, '2026-06-20 15:45:00'),
(3, 1, 1, NULL, 3, 'Reminder', 'We have not received your RSVP yet. Please confirm when possible.', 'follow-up', 'Sent', NULL, '2026-06-18 10:00:00'),
(4, 1, 4, 1, NULL, 'Catering clarification', 'We will bring extra vegetarian trays as requested.', 'clarification', 'Seen', '2026-05-19 09:30:00', '2026-05-19 09:00:00'),
(5, 3, 1, NULL, 5, 'Drill reminder', 'Please arrive at 10 AM for the operations drill.', 'notification', 'Sent', NULL, '2026-06-14 08:00:00'),
(6, 3, 1, NULL, 6, 'Entrance changed', 'Use the side entrance for the drill check-in desk.', 'day-of', 'Received', NULL, '2026-06-14 09:00:00');

INSERT INTO checkins (id, event_id, guest_id, checked_in_by, status, checkin_method, checked_in_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 3, 'Arrived', 'qr_code', '2026-06-20 18:05:00', '2026-06-20 18:05:00'),
(2, 1, 2, 3, 'Not Arrived', NULL, NULL, '2026-06-20 18:10:00'),
(3, 1, 3, 3, 'Not Arrived', NULL, NULL, '2026-06-20 18:10:00'),
(4, 2, 4, NULL, 'Not Arrived', NULL, NULL, '2026-05-23 12:10:00'),
(5, 3, 5, 2, 'Arrived', 'name_confirmation', '2026-06-14 10:05:00', '2026-06-14 10:05:00'),
(6, 3, 6, NULL, 'Not Arrived', NULL, NULL, '2026-06-14 10:10:00'),
(7, 4, 7, 3, 'Arrived', 'qr_code', '2026-06-10 17:05:00', '2026-06-10 17:05:00');

INSERT INTO feedback (id, event_id, guest_id, overall_rating, food_rating, venue_rating, organization_rating, sentiment, comments, submitted_at, created_at) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 1, 5, 4, 5, 5, 'Positive', 'Beautiful venue and smooth check-in. Food was very good.', '2026-06-21 11:00:00', '2026-06-21 11:00:00'),
(2, 1, 2, 4, 5, 4, 4, 'Positive', 'Great atmosphere and helpful staff. More signage near the entrance would help.', '2026-06-21 11:30:00', '2026-06-21 11:30:00'),
(3, 1, 3, 3, NULL, 4, 3, 'Neutral', 'Could not attend the full event but the invitation flow was clear.', '2026-06-21 12:00:00', '2026-06-21 12:00:00'),
(4, 4, 7, 2, 2, 3, 2, 'Negative', 'The preview was useful, but signage was confusing and check-in was slow.', '2026-06-11 10:00:00', '2026-06-11 10:00:00'),
(5, 3, 5, 4, NULL, 4, 5, 'Positive', 'Staff drill felt organized and the check-in flow was clear.', '2026-06-14 17:00:00', '2026-06-14 17:00:00');

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
