import { SuiteSerializer } from 'SuiteSerializer';
import { VestIsolateType } from 'VestIsolateType';
import { describe, it, expect } from 'vitest';
import wait from 'wait';

import * as vest from 'vest';
import { staticSuite } from 'vest';

describe('staticSuite', () => {
  it('Should return a function', () => {
    expect(typeof staticSuite(() => {})).toBe('function');
  });

  it('Should return a "suite instance"', () => {
    const suite = staticSuite(() => {});
    const result = suite();
    expect(typeof result).toBe('object');
    expect(typeof result.tests).toBe('object');
    expect(typeof result.groups).toBe('object');
    expect(typeof result.warnCount).toBe('number');
    expect(typeof result.errorCount).toBe('number');
    expect(typeof result.testCount).toBe('number');
    expect(typeof result.getWarning).toBe('function');
    expect(typeof result.getError).toBe('function');
    expect(typeof result.getErrors).toBe('function');
    expect(typeof result.getErrors).toBe('function');
    expect(typeof result.getWarnings).toBe('function');
    expect(typeof result.getWarnings).toBe('function');
    expect(typeof result.getErrorsByGroup).toBe('function');
    expect(typeof result.getErrorsByGroup).toBe('function');
    expect(typeof result.getWarningsByGroup).toBe('function');
    expect(typeof result.getWarningsByGroup).toBe('function');
    expect(typeof result.hasErrors).toBe('function');
    expect(typeof result.hasWarnings).toBe('function');
    expect(typeof result.hasErrorsByGroup).toBe('function');
    expect(typeof result.hasWarningsByGroup).toBe('function');
    expect(typeof result.isValid).toBe('function');
    expect(typeof result.isValidByGroup).toBe('function');
    expect(typeof result.done).toBe('function');
  });

  it('On consecutive calls, should return a new "suite instance"', () => {
    const suite = staticSuite(only => {
      vest.only(only);
      vest.test('t1', () => false);
      vest.test('t2', () => false);
    });

    const res1 = suite('t1');
    const res2 = suite('t2');

    expect(res1).not.toBe(res2);
    expect(res1.hasErrors('t1')).toBe(true);
    expect(res1.hasErrors('t2')).toBe(false);
    expect(res2.hasErrors('t1')).toBe(false);
    expect(res2.hasErrors('t2')).toBe(true);
  });

  it('Should run async tests normally', () => {
    const suite = staticSuite(() => {
      vest.test('t1', async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        throw new Error();
      });
    });
    return new Promise<void>(resolve => {
      const res = suite();

      expect(res.hasErrors('t1')).toBe(false);

      res.done(() => {
        resolve();
      });
    });
  });

  describe('dump', () => {
    it('should output a dump of the suite', () => {
      const suite = staticSuite(() => {
        vest.test('t1', () => false);
        vest.test('t2', () => false);

        vest.group('g1', () => {
          vest.test('t1', () => false);
          vest.test('t3', () => false);
        });
      });

      const res = suite();

      expect(res.dump()).toHaveProperty('$type', VestIsolateType.Suite);
      expect(res.dump()).toHaveProperty('children');
      expect(res.dump().children).toHaveLength(3);
      expect(res.dump().children?.[0]).toHaveProperty(
        '$type',
        VestIsolateType.Test,
      );
      expect(res.dump().children?.[1]).toHaveProperty(
        '$type',
        VestIsolateType.Test,
      );
      expect(res.dump().children?.[2]).toHaveProperty(
        '$type',
        VestIsolateType.Group,
      );

      expect(res.dump()).toMatchSnapshot();
    });
  });
});

describe('runStatic', () => {
  it('Should run a static suite', () => {
    const suite = vest.create(() => {
      vest.test('t1', () => false);
      vest.test('t2', () => false);
    });

    const res = suite.runStatic();
    expect(suite.runStatic()).not.toBe(suite.runStatic());

    expect(res.hasErrors('t1')).toBe(true);
    expect(res.hasErrors('t2')).toBe(true);
  });

  it('Should serialize and resume a static suite', () => {
    const suite = vest.create(() => {
      vest.test('t1', () => false);
      vest.test('t2', () => false);
    });

    const serialized = SuiteSerializer.serialize(suite.runStatic());
    const suite2 = vest.create(() => {
      vest.test('t3', () => false);
      vest.test('t4', () => false);
    });

    SuiteSerializer.resume(suite2, serialized);

    expect(suite2.hasErrors('t1')).toBe(true);
    expect(suite2.hasErrors('t2')).toBe(true);
    expect(suite2.hasErrors('t3')).toBe(false);
    expect(suite2.hasErrors('t4')).toBe(false);
  });

  describe('runStatic (promise)', () => {
    it("Should resolve with the suite's result", async () => {
      const suite = vest.create(() => {
        vest.test('t1', async () => {
          await wait(100);
          throw new Error();
        });
      });

      const res = suite.runStatic();
      expect(res.errorCount).toBe(0);
      const result = await res;
      expect(result.errorCount).toBe(1);
    });

    it("Should have a dump method on the resolved suite's result", async () => {
      const suite = vest.create(() => {
        vest.test('t1', async () => {
          await wait(100);
          throw new Error();
        });
      });

      const res = suite.runStatic();
      const result = await res;
      expect(result).toHaveProperty('dump');
      expect(result.dump()).toHaveProperty('$type', VestIsolateType.Suite);
    });
  });
});
