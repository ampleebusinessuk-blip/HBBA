-- Remove the records created while verifying the ticketing, support and
-- networking flows on production. Every delete names the exact artefact, so
-- real activity is untouched -- notably the "account help" support thread,
-- which was raised by a person and stays.

-- Event ticketing proof: the event and, by cascade, its refunded booking.
DELETE FROM events WHERE title LIKE 'Autumn Leaders Breakfast %';

-- Support ticketing proof: the thread and, by cascade, its messages.
DELETE FROM support_tickets WHERE subject LIKE 'Booking question %';

-- Networking proof.
DELETE FROM intro_requests
 WHERE from_name = 'Member Account' AND to_name = 'Sponsor Account';

-- The feed entries those actions produced, including the member's own
-- notifications. Matched on the artefact names rather than on a time window so
-- nothing else can be caught by accident.
DELETE FROM activity_log
 WHERE body LIKE '%Autumn Leaders Breakfast %'
    OR body LIKE '%Booking question %'
    OR body LIKE '%Member Account → Sponsor Account%'
    OR title = 'Attendee checked in'
    OR title = 'Your introduction is confirmed';
