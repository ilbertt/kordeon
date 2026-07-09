import { env } from 'cloudflare:workers';
import { createServerFn } from '@tanstack/react-start';

// Deliberately lenient — a stricter regex rejects valid addresses more often than it
// catches typos. The real gate against junk is D1's primary key plus Cloudflare's edge.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_EMAIL_LENGTH = 254;

// Waitlist signup. The validator runs on the server (the client passes a raw string) and
// throws a user-facing message for a bad address; the email primary key dedupes repeats.
export const subscribe = createServerFn({ method: 'POST' })
  .validator((email: unknown): string => {
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (normalized.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(normalized)) {
      throw new Error('Enter a valid email address.');
    }
    return normalized;
  })
  .handler(async ({ data: email }) => {
    await env.DB.prepare('INSERT INTO subscribers (email) VALUES (?) ON CONFLICT(email) DO NOTHING')
      .bind(email)
      .run();
  });
