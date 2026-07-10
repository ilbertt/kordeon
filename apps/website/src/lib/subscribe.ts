import { env } from 'cloudflare:workers';
import { createServerFn } from '@tanstack/react-start';
import { type Generated, Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

// Deliberately lenient — a stricter regex rejects valid addresses more often than it
// catches typos. The real gate against junk is D1's primary key plus Cloudflare's edge.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_EMAIL_LENGTH = 254;

// The waitlist schema, typed for Kysely. `created_at` has a SQL default so it's Generated
// (never set on insert). Keep in sync with migrations/.
interface WaitlistDatabase {
  subscribers: {
    email: string;
    created_at: Generated<string>;
  };
}

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
    const db = new Kysely<WaitlistDatabase>({ dialect: new D1Dialect({ database: env.DB }) });
    await db
      .insertInto('subscribers')
      .values({ email })
      .onConflict((oc) => oc.column('email').doNothing())
      .execute();
  });
