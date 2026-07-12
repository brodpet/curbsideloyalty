export type ParsedCardCode =
  | { kind: 'full'; code: string }
  | { kind: 'prefix'; lo: string; hi: string }
  | { kind: 'invalid' };

const FULL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Short codes are the first 6-8 hex chars of the uuid, as shown on the ticket.
const SHORT_PREFIX = /^[0-9a-f]{6,8}$/;

export function parseCardCode(raw: string): ParsedCardCode {
  const code = raw.trim().replace(/^#/, '').toLowerCase();
  if (FULL_UUID.test(code)) return { kind: 'full', code };
  if (SHORT_PREFIX.test(code)) {
    return {
      kind: 'prefix',
      lo: `${code.padEnd(8, '0')}-0000-0000-0000-000000000000`,
      hi: `${code.padEnd(8, 'f')}-ffff-ffff-ffff-ffffffffffff`,
    };
  }
  return { kind: 'invalid' };
}
