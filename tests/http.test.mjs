import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from '../scripts/env.mjs';

test('sanitize masks sensitive credentials and authorization tokens', () => {
  const sample = {
    apiKey: 'IVY26-TESTKEY12345',
    password: 'secret_password_123',
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.sig',
    nested: {
      password: 'inner_secret'
    }
  };

  const sanitized = sanitize(sample);
  assert.equal(sanitized.apiKey, '[REDACTED]');
  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.nested.password, '[REDACTED]');
});

test('sanitize string redacts Bearer tokens', () => {
  const input = 'Request header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig sent to server';
  const sanitized = sanitize(input);
  assert.match(sanitized, /Bearer \[REDACTED_TOKEN\]/);
});
