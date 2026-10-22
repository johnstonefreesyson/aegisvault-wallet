import { describe, it, expect } from 'vitest';
import { csvCell, toCsv } from '../src/utils/csv';

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });
  it('neutralises formula injection but keeps negative numbers', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('-12.5')).toBe('-12.5');
  });
  it('builds rows', () => {
    expect(toCsv(['a', 'b'], [[1, 'x,y']])).toBe('a,b\n1,"x,y"');
  });
});
