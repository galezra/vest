import { describe, it, expect, vi } from 'vitest';
import wait from 'wait';

import { TestFnPayload } from 'TestTypes';
import debounce from 'debounce';
import * as vest from 'vest';

describe('debounce', () => {
  describe('Sync test', () => {
    describe('Returning false', () => {
      it('Should debounce test function calls when used', () => {
        const test = vi.fn(() => {
          return false;
        });

        return new Promise<void>(done => {
          const suite = vest.create('suite', () => {
            vest.test('test', 'message', debounce(test, 1500));
          });

          suite();
          suite();
          suite();
          suite();
          suite();
          suite();
          suite().done(() => {
            expect(test).toHaveBeenCalledTimes(1);
            expect(suite.isValid()).toBe(false);
            done();
          });
        });
      });
    });

    describe('Throwing an error', () => {
      it('Should debounce test function calls when used', () => {
        const test = vi.fn(() => {
          throw new Error();
        });

        return new Promise<void>(done => {
          const suite = vest.create('suite', () => {
            vest.test('test', 'message', debounce(test, 1500));
          });

          suite();
          suite();
          suite();
          suite();
          suite();
          suite();
          suite().done(() => {
            expect(test).toHaveBeenCalledTimes(1);
            expect(suite.isValid()).toBe(false);
            done();
          });
        });
      });
    });
  });

  describe('Async test', () => {
    it('Should complete the async test after the delay', async () => {
      const t = vi.fn(async () => {
        await wait(1000);
        vest.enforce(1).equals(2);
      });

      const suite = vest.create('suite', () => {
        vest.test('test', 'message', debounce(t, 1500));
      });

      suite();
      expect(t).toHaveBeenCalledTimes(0);
      expect(suite.isPending()).toBe(true);
      await wait(2000);
      expect(t).toHaveBeenCalledTimes(1);
      expect(suite.get().hasErrors('test')).toBe(false);
      expect(suite.isPending()).toBe(true);
      await wait(1000);
      expect(suite.isPending()).toBe(false);
      expect(suite.get().hasErrors('test')).toBe(true);
    });
  });

  describe('When delay met multiple times', () => {
    it('Should call once per completed delay', async () => {
      const test = vi.fn(() => {
        return false;
      });

      const suite = vest.create('suite', () => {
        vest.test('test', 'message', debounce(test, 1000));
      });

      suite();
      await wait(1000);
      expect(suite.get().hasErrors('test')).toBe(true);
      expect(test).toHaveBeenCalledTimes(1);

      suite();
      suite();
      suite();
      expect(test).toHaveBeenCalledTimes(1);
      await wait(1000);
      expect(suite.get().hasErrors('test')).toBe(true);
      expect(test).toHaveBeenCalledTimes(2);

      suite();
      suite();
      suite();
      expect(test).toHaveBeenCalledTimes(2);
      await wait(1000);
    });
  });

  describe('Debounced tests with non-debounced tests', () => {
    it('Should complete non-debounced tests immediately', () => {
      const test = vi.fn(() => {
        return false;
      });

      const suite = vest.create('suite', () => {
        vest.test('test', 'message', debounce(test, 1000));
        vest.test('test2', 'message', test);
      });

      return new Promise<void>(done => {
        suite().done(() => {
          expect(test).toHaveBeenCalledTimes(2);
          expect(suite.get().hasErrors('test')).toBe(true);
          expect(suite.get().hasErrors('test2')).toBe(true);
          done();
        });
        expect(test).toHaveBeenCalledTimes(1);
        expect(suite.get().hasErrors('test')).toBe(false);
        expect(suite.get().hasErrors('test2')).toBe(true);
      });
    });
  });

  describe('Multiple debounced fields', () => {
    it('Should conclude them on their own time', () => {
      const t = vi.fn(() => {
        return false;
      });

      const suite = vest.create('suite', () => {
        vest.test('test', 'message', debounce(t, 1000));
        vest.test('test2', 'message', debounce(t, 1500));
        vest.test('test3', 'message', debounce(t, 2000));
      });

      const control = vi.fn();

      return new Promise<void>(done => {
        suite();
        suite();
        suite()
          .done('test', () => {
            expect(control).toHaveBeenCalledTimes(0);
            expect(t).toHaveBeenCalledTimes(1);
            expect(suite.get().hasErrors('test')).toBe(true);
            expect(suite.get().hasErrors('test2')).toBe(false);
            expect(suite.get().hasErrors('test3')).toBe(false);
            control();
          })
          .done('test2', () => {
            expect(control).toHaveBeenCalledTimes(1);
            expect(t).toHaveBeenCalledTimes(2);
            expect(suite.get().hasErrors('test')).toBe(true);
            expect(suite.get().hasErrors('test2')).toBe(true);
            expect(suite.get().hasErrors('test3')).toBe(false);
            control();
          })
          .done('test3', () => {
            expect(control).toHaveBeenCalledTimes(2);
            expect(t).toHaveBeenCalledTimes(3);
            expect(suite.get().hasErrors('test')).toBe(true);
            expect(suite.get().hasErrors('test2')).toBe(true);
            expect(suite.get().hasErrors('test3')).toBe(true);
            control();
          })
          .done(() => {
            expect(control).toHaveBeenCalledTimes(3);
            expect(t).toHaveBeenCalledTimes(3);
            expect(suite.get().hasErrors('test')).toBe(true);
            expect(suite.get().hasErrors('test2')).toBe(true);
            expect(suite.get().hasErrors('test3')).toBe(true);
            done();
          });
      });
    });
  });

  describe('Test payload', () => {
    describe('AbortSignal', () => {
      it('Should abort the test when signal is aborted', async () => {
        const control = vi.fn();

        let run = 0;
        const test = vi.fn(async (payload: TestFnPayload) => {
          expect(payload.signal.aborted).toBe(false);
          await wait(50);
          // We should only abort on the first run because
          // the second run is canceling the firt, but nothing
          // cancels the second.
          expect(payload.signal.aborted).toBe(run === 0);
          control();
          return true;
        });

        const suite = vest.create('suite', () => {
          vest.test('test', 'message', debounce(test, 200));
          run++;
        });

        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async done => {
          suite();
          await wait(200);
          // This cancels the first run
          suite().done(() => {
            expect(suite.hasErrors('test')).toBe(false);
            expect(test).toHaveBeenCalledTimes(2);
            expect(control).toHaveBeenCalledTimes(1);
            done();
          });
        });
      });
    });
  });
});
