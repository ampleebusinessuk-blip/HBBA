import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminInput } from '../server/admin-bootstrap.js';

test('validates and normalizes admin bootstrap input', () => {
  const input = validateAdminInput({
    email: ' OWNER@HBBA.CO.UK ',
    password: 'StrongPassword123',
    fullName: ' Owner User ',
    org: ' HBBA '
  });

  assert.deepEqual(input, {
    email: 'owner@hbba.co.uk',
    password: 'StrongPassword123',
    fullName: 'Owner User',
    org: 'HBBA'
  });
});

test('rejects invalid admin email', () => {
  assert.throws(
    () => validateAdminInput({ email: 'bad', password: 'StrongPassword123', fullName: 'Owner' }),
    /ADMIN_EMAIL must be a valid email/
  );
});

test('rejects weak admin password', () => {
  assert.throws(
    () => validateAdminInput({ email: 'owner@hbba.co.uk', password: 'short', fullName: 'Owner' }),
    /ADMIN_PASSWORD must be at least 12 characters/
  );
});

test('rejects demo password in production', () => {
  assert.throws(
    () => validateAdminInput(
      { email: 'owner@hbba.co.uk', password: 'hbbaglobal', fullName: 'Owner' },
      { NODE_ENV: 'production' }
    ),
    /ADMIN_PASSWORD must not use the demo password in production/
  );
});
