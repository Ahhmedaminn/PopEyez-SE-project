DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS checkins;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS guests;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS sourcing_requests;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS layouts;
DROP TABLE IF EXISTS booking_requests;
DROP TABLE IF EXISTS venue_availability;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('organizer', 'staff', 'vendor', 'guest', 'venueOwner')),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Deactivated')),
    phone VARCHAR(40),
    age INTEGER CHECK (age IS NULL OR age >= 0),
    speciality VARCHAR(100),
    employment_type VARCHAR(30) CHECK (employment_type IS NULL OR employment_type IN ('part-time', 'full-time')),
    company_name VARCHAR(160),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE venues (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(140) NOT NULL,
    description TEXT,
    location VARCHAR(180) NOT NULL,
    city VARCHAR(80),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    dimensions_sqm NUMERIC(8,2) CHECK (dimensions_sqm IS NULL OR dimensions_sqm > 0),
    amenities TEXT,
    daily_price NUMERIC(10,2) CHECK (daily_price IS NULL OR daily_price >= 0),
    photo_url TEXT,
    floor_plan_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    company_name VARCHAR(160) NOT NULL,
    supplies_offered TEXT NOT NULL,
    main_location VARCHAR(160),
    pricing_list TEXT,
    contact_email VARCHAR(160),
    contact_phone VARCHAR(40),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    event_type VARCHAR(80),
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    expected_attendees INTEGER CHECK (expected_attendees IS NULL OR expected_attendees >= 0),
    dress_code VARCHAR(120),
    agenda TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Ongoing', 'Completed', 'Cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE venue_availability (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    price_override NUMERIC(10,2) CHECK (price_override IS NULL OR price_override >= 0),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (venue_id, available_date)
);

CREATE TABLE booking_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_date DATE NOT NULL,
    expected_attendees INTEGER CHECK (expected_attendees IS NULL OR expected_attendees >= 0),
    special_requirements TEXT,
    proposed_price NUMERIC(10,2) CHECK (proposed_price IS NULL OR proposed_price >= 0),
    counter_proposal TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Declined', 'Counter Proposal')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE layouts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(140) NOT NULL,
    layout_data JSONB,
    shared_with_team BOOLEAN NOT NULL DEFAULT FALSE,
    export_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    category VARCHAR(80),
    due_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Not Assigned', 'Pending', 'In Progress', 'Done', 'Overdue')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    planned_amount NUMERIC(12,2) NOT NULL CHECK (planned_amount >= 0),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    budget_id INTEGER REFERENCES budgets(id) ON DELETE SET NULL,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    spent_at DATE,
    payment_method VARCHAR(60),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sourcing_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_items TEXT NOT NULL,
    quantity VARCHAR(80),
    delivery_date DATE,
    event_location VARCHAR(180),
    notes TEXT,
    clarification_note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deliveries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sourcing_request_id INTEGER NOT NULL REFERENCES sourcing_requests(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'Preparing' CHECK (status IN ('Preparing', 'Out for Delivery', 'Delivered', 'Delayed','Arrived')),
    scheduled_arrival TIMESTAMP,
    arrived_at TIMESTAMP,
    confirmation_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    delivery_id INTEGER REFERENCES deliveries(id) ON DELETE SET NULL,
    sourcing_request_id INTEGER NOT NULL REFERENCES sourcing_requests(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    invoice_number VARCHAR(80),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Paid', 'Rejected')),
    itemized_breakdown TEXT,
    supporting_document_url TEXT,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guests (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160),
    phone VARCHAR(40),
    dietary_preferences TEXT,
    special_requirements TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invitations (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invitation_code VARCHAR(80) UNIQUE,
    channel VARCHAR(30) CHECK (channel IS NULL OR channel IN ('email', 'platform')),
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Opened', 'Cancelled')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, guest_id)
);

CREATE TABLE rsvps (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invitation_id INTEGER NOT NULL UNIQUE REFERENCES invitations(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'No Response' CHECK (status IN ('Attending', 'Not Attending', 'Maybe', 'No Response')),
    dietary_preferences TEXT,
    special_requirements TEXT,
    responded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, guest_id)
);

CREATE TABLE messages (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
    subject VARCHAR(160),
    body TEXT NOT NULL,
    message_type VARCHAR(30) NOT NULL DEFAULT 'day-of' CHECK (message_type IN ('day-of', 'clarification', 'notification', 'follow-up')),
    status VARCHAR(20) NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Received', 'Seen')),
    seen_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checkins (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    checked_in_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Not Arrived' CHECK (status IN ('Not Arrived', 'Arrived')),
    checkin_method VARCHAR(30) CHECK (checkin_method IS NULL OR checkin_method IN ('qr_code', 'name_confirmation')),
    checked_in_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, guest_id)
);

CREATE TABLE feedback (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    food_rating INTEGER CHECK (food_rating IS NULL OR food_rating BETWEEN 1 AND 5),
    venue_rating INTEGER CHECK (venue_rating IS NULL OR venue_rating BETWEEN 1 AND 5),
    organization_rating INTEGER CHECK (organization_rating IS NULL OR organization_rating BETWEEN 1 AND 5),
    sentiment VARCHAR(20) CHECK (sentiment IS NULL OR sentiment IN ('Positive', 'Neutral', 'Negative')),
    comments TEXT,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
