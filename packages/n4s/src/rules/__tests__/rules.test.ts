import rules from 'rules';
import { describe, it, expect } from 'vitest';

describe('Tests enforce rules API', () => {
  it('Should expose all enforce rules', () => {
    Object.keys(rules()).forEach(rule => {
      // @ts-ignore - dynamically checking all built-in rules
      expect(rules()[rule]).toBeInstanceOf(Function);
    });
  });
});
