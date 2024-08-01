import { faker } from '@faker-js/faker';
import { ErrorStrings } from 'ErrorStrings';
import { noop } from 'lodash';
import { describe, it, expect, vi } from 'vitest';

import { dummyTest } from '../../testUtils/testDummy';
import { TestPromise } from '../../testUtils/testPromise';

import { create } from 'vest';

describe('Test createSuite module', () => {
  describe('Test suite Arguments', () => {
    it('allows omitting suite name', () => {
      expect(typeof create(vi.fn())).toBe('function');
      expect(typeof create(vi.fn()).get).toBe('function');
      expect(typeof create(vi.fn()).reset).toBe('function');
      expect(typeof create(vi.fn()).remove).toBe('function');
      expect(create(vi.fn()).get()).toMatchSnapshot();
    });

    it.each([faker.lorem.word(), null, undefined, 0, 1, true, false, NaN, ''])(
      'Throws an error when `tests` callback is not a function',
      value => {
        // @ts-expect-error - testing invalid input
        expect(() => create(value)).toThrow(
          ErrorStrings.SUITE_MUST_BE_INITIALIZED_WITH_FUNCTION,
        );
      },
    );

    describe('When suite name is provided', () => {
      it('Should add suite name to suite result', () => {
        const res = create('form_name', () => {})();

        expect(res.suiteName).toBe('form_name');
      });
    });
  });

  describe('Return value', () => {
    it('should be a function', () => {
      expect(typeof create(noop)).toBe('function');
    });
  });

  describe('When returned function is invoked', () => {
    it('Calls `tests` argument', () =>
      TestPromise(done => {
        const validate = create(() => {
          done();
        });
        validate();
      }));

    it('Passes all arguments over to tests callback', () => {
      const testsCallback = vi.fn();
      const params = [
        1,
        2,
        3,
        { [faker.lorem.word()]: [1, 2, 3] },
        false,
        [faker.lorem.word()],
      ];
      const validate = create(testsCallback);
      validate(...params);
      expect(testsCallback).toHaveBeenCalledWith(...params);
    });
  });

  describe('Initial run', () => {
    const testsCb = vi.fn();
    const genValidate = () => create(testsCb);

    it('Should initialize with an empty result object', () => {
      const validate = genValidate();
      expect(Object.keys(validate.get().tests)).toHaveLength(0);
      expect(Object.keys(validate.get().groups)).toHaveLength(0);

      expect(validate.get().errorCount).toBe(0);
      expect(validate.get().warnCount).toBe(0);
      expect(validate.get().testCount).toBe(0);

      expect(validate.get()).toMatchSnapshot();
    });

    it('Should be able to get the suite from the result of createSuite', () => {
      const testsCb = vi.fn();
      expect(create(testsCb).get()).toMatchSnapshot();
    });

    it('Should be able to reset the suite from the result of createSuite', () => {
      const testSuite = create(() => {
        dummyTest.failing('f1', 'm1');
      });
      testSuite();
      expect(testSuite.get().hasErrors()).toBe(true);
      expect(testSuite.get().testCount).toBe(1);
      testSuite.reset();
      expect(testSuite.get().hasErrors()).toBe(false);
      expect(testSuite.get().testCount).toBe(0);
    });

    it('Should return without calling tests callback', () => {
      const validate = create(testsCb);
      expect(testsCb).not.toHaveBeenCalled();
      validate();
      expect(testsCb).toHaveBeenCalled();
    });
  });
});
