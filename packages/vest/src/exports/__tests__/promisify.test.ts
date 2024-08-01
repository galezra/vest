import { faker } from '@faker-js/faker';
import { TFieldName } from 'SuiteResultTypes';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { dummyTest } from '../../testUtils/testDummy';
import { TestPromise } from '../../testUtils/testPromise';
import promisify from '../promisify';

import * as vest from 'vest';

describe('Utility: promisify', () => {
  let validatorFn: vi.Mock<vest.SuiteRunResult<string, TFieldName>, any>;
  let validateAsync: (
    ...args: any[]
  ) => Promise<vest.SuiteResult<string, TFieldName>>;

  beforeEach(() => {
    validatorFn = vi.fn(
      vest.create(
        vi.fn(() => {
          dummyTest.failing('field_0');
        }),
      ),
    );
    validateAsync = promisify(validatorFn);
  });

  describe('Test arguments', () => {
    it('Should throw an error', () => {
      // @ts-expect-error - testing invalid input
      const invalidValidateAsync = promisify('invalid');
      expect(() => invalidValidateAsync()).toThrow();
    });
  });

  describe('Return value', () => {
    it('should be a function', () => {
      expect(typeof promisify(vi.fn())).toBe('function');
    });

    it('should be a promise', () =>
      TestPromise(done => {
        const res = validateAsync();
        expect(typeof res?.then).toBe('function');
        res.then(() => done());
      }));
  });

  describe('When returned function is invoked', () => {
    it('Calls `validatorFn` argument', () =>
      TestPromise(done => {
        const validateAsync = promisify(
          vest.create(() => {
            dummyTest.failing('field_0');
            done();
          }),
        );
        validateAsync();
      }));

    it('Passes all arguments over to tests callback', async () => {
      const params = [
        1,
        { [faker.lorem.word()]: [1, 2, 3] },
        false,
        [faker.lorem.word()],
      ];

      await validateAsync(...params);
      expect(validatorFn).toHaveBeenCalledWith(...params);
    });
  });

  describe('Initial run', () => {
    it('Produces correct validation', () =>
      TestPromise(done => {
        const validate = vest.create(() => {
          dummyTest.failing('field_0');
          dummyTest.failingAsync('field_1');
        });

        const validatorAsync = promisify(validate);
        const p = validatorAsync('me');

        p.then(result => {
          expect(result.hasErrors('field_0')).toBe(true);
          expect(result.hasErrors('field_1')).toBe(true);
          done();
        });
      }));
  });
});
