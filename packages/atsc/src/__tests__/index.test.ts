import * as atsc from '..';

describe('atsc', () => {
  test('compilation', () => {
    expect(atsc.compileCode('alert(2 + 3);')).toBe('alert(5);');
  });
});
