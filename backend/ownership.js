function isValidId(value) {
  return /^\d+$/.test(String(value || ""));
}

async function organizerOwnsEvent(pool, eventId, organizerId) {
  if (!isValidId(eventId) || !isValidId(organizerId)) {
    return false;
  }

  const result = await pool.query(
    "SELECT 1 FROM events WHERE id = $1 AND organizer_id = $2",
    [eventId, organizerId]
  );
  return result.rows.length > 0;
}

async function staffWorksOnEvent(pool, eventId, staffId) {
  if (!isValidId(eventId) || !isValidId(staffId)) {
    return false;
  }

  const result = await pool.query(
    `SELECT 1
    FROM tasks
    WHERE event_id = $1
      AND assigned_to = $2
      AND status <> 'Not Assigned'
    LIMIT 1`,
    [eventId, staffId]
  );
  return result.rows.length > 0;
}

async function requireEventAccess(pool, eventId, organizerId, staffId) {
  if (organizerId) {
    return organizerOwnsEvent(pool, eventId, organizerId);
  }

  if (staffId) {
    return staffWorksOnEvent(pool, eventId, staffId);
  }

  return false;
}

async function venueOwnerOwnsVenue(pool, venueId, ownerId) {
  if (!isValidId(venueId) || !isValidId(ownerId)) {
    return false;
  }

  const result = await pool.query(
    "SELECT 1 FROM venues WHERE id = $1 AND owner_id = $2",
    [venueId, ownerId]
  );
  return result.rows.length > 0;
}

async function venueOwnerOwnsBookingRequest(pool, requestId, ownerId) {
  if (!isValidId(requestId) || !isValidId(ownerId)) {
    return false;
  }

  const result = await pool.query(
    `SELECT 1
    FROM booking_requests
    JOIN venues ON venues.id = booking_requests.venue_id
    WHERE booking_requests.id = $1
      AND venues.owner_id = $2`,
    [requestId, ownerId]
  );
  return result.rows.length > 0;
}

module.exports = {
  isValidId,
  organizerOwnsEvent,
  staffWorksOnEvent,
  requireEventAccess,
  venueOwnerOwnsVenue,
  venueOwnerOwnsBookingRequest,
};
