import { faker } from '@faker-js/faker';

import { longerThanOrEquals } from 'longerThanOrEquals';

describe('Tests longerThanOrEquals rule', () => {
  const length = 10;
  const word = faker.lorem.word();
  const boolean = faker.datatype.boolean();

  describe('First argument is array or string', () => {
    describe('When first argument is longer', () => {
      it('Should return true for an array longer than length', () => {
        expect(longerThanOrEquals(new Array(length), length - 1)).toBe(true);
      });

      it('Should return true for a string longer than word length', () => {
        expect(longerThanOrEquals(word, word.length - 1)).toBe(true);
      });
    });

    describe('When first argument is equal to a given value', () => {
      it('Should return true for an array equal to length', () => {
        expect(longerThanOrEquals(new Array(length), length)).toBe(true);
      });

      it('Should return true for a string equal to word length', () => {
        expect(longerThanOrEquals(word, word.length)).toBe(true);
      });
    });

    describe('When first argument is shorter', () => {
      it('Should return false for an array shorter than length', () => {
        expect(longerThanOrEquals(new Array(length), length + 1)).toBe(false);
      });

      it('Should return false for a string shorter than word length', () => {
        expect(longerThanOrEquals(word, word.length + 1)).toBe(false);
      });
    });
  });

  describe("First argument isn't array or string", () => {
    it('Should throw error', () => {
      // @ts-expect-error - testing invalid input
      expect(() => longerThanOrEquals(undefined, 0)).toThrow(TypeError);
    });

    it('Should return false for number argument', () => {
      // @ts-expect-error - testing invalid input
      expect(longerThanOrEquals(length, 0)).toBe(false);
    });

    it('Should return false for boolean argument', () => {
      // @ts-expect-error - testing invalid input
      expect(longerThanOrEquals(boolean, 0)).toBe(false);
    });
  });
});
