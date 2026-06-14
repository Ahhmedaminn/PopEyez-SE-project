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

module.exports = {
  isValidId,
  organizerOwnsEvent,
  staffWorksOnEvent,
  requireEventAccess,
};
