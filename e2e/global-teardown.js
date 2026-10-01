// Playwright runs every spec in one worker process, so they share one module
// instance and one connection pool. A spec that closes the pool in its own
// teardown breaks whichever spec runs next; closing it once, here, does not.
import { closePool } from '../server/db.js';

export default async function globalTeardown() {
  await closePool();
}
