import 'dotenv/config';
import { query, closePool } from '../server/db.js';
import { bootstrapAdmin } from '../server/admin-bootstrap.js';

async function main() {
  const result = await bootstrapAdmin({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullName: process.env.ADMIN_FULL_NAME,
    org: process.env.ADMIN_ORG
  }, { query });

  console.log(`${result.created ? 'created' : 'updated'} admin ${result.email}`);
}

main()
  .then(closePool)
  .catch(async (err) => {
    await closePool();
    console.error(err.message);
    process.exit(1);
  });
