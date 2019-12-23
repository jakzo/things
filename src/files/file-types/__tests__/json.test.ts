import { patch } from '../json';

describe('patch()', () => {
  it('should modify a property without modifying formatting', () => {
    expect(patch('{ "a" :123,"b":456}', { a: 123, b: 457 })).toBe('{ "a" :123,"b":457}');
  });
});
