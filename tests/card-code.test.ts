import { describe, it, expect } from 'vitest';
import { parseCardCode } from '../lib/card-code';

describe('parseCardCode', () => {
  it('accepts a full uuid, lowercased', () => {
    expect(parseCardCode('E5D14AB5-7495-49C1-B1AC-731DDDB0501E')).toEqual({
      kind: 'full',
      code: 'e5d14ab5-7495-49c1-b1ac-731dddb0501e',
    });
  });

  it('trims whitespace and a leading # from ticket short codes', () => {
    expect(parseCardCode(' #E5D14A ')).toEqual({
      kind: 'prefix',
      lo: 'e5d14a00-0000-0000-0000-000000000000',
      hi: 'e5d14aff-ffff-ffff-ffff-ffffffffffff',
    });
  });

  it('accepts 6 to 8 hex chars as a prefix', () => {
    expect(parseCardCode('e5d14ab5').kind).toBe('prefix');
    expect(parseCardCode('e5d14a').kind).toBe('prefix');
  });

  it('rejects prefixes that are too short, too long, or non-hex', () => {
    expect(parseCardCode('e5d14').kind).toBe('invalid');
    expect(parseCardCode('e5d14ab5x').kind).toBe('invalid');
    expect(parseCardCode('coffee').kind).toBe('invalid'); // f,e,c are hex but o is not
    expect(parseCardCode('').kind).toBe('invalid');
  });

  it('rejects malformed uuids', () => {
    expect(parseCardCode('e5d14ab5-7495-49c1-b1ac-731dddb0501').kind).toBe('invalid');
  });
});
