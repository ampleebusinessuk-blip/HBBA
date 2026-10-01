-- Contacts created before pictures were handled properly carry a generated URL
-- pointing at a stock-photo service. Those are not pictures of the contact:
-- they are pictures of a stranger, and rendering one sends that contact's email
-- hash to a third party on every page view.
--
-- Only the generated URLs are cleared. A picture somebody actually supplied is
-- left exactly as it is.
UPDATE contacts
   SET avatar = NULL
 WHERE avatar LIKE '%pravatar.cc%'
    OR avatar LIKE '%images.unsplash.com%';
