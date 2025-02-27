import itWithContext from '../../../../../testUtils/itWithContext';
import { dummyTest } from '../../../../../testUtils/testDummy';
import { setTestObjects } from '../../../../../testUtils/testObjects';

import { produceSuiteResult } from 'produceSuiteResult';
import { produceFullResult } from 'produceSuiteRunResult';

const methods = {
  produceSuiteResult,
  produceFullResult,
};

describe.each(Object.keys(methods))('produce method: %s', methodName => {
  const produceMethod = methods[methodName];
  describe('Base structure', () => {
    itWithContext('Should match snapshot', () => {
      expect(produceMethod()).toMatchObject({
        errorCount: 0,
        groups: {},
        testCount: 0,
        tests: {},
        warnCount: 0,
      });
    });

    itWithContext('Its methods should reflect the correct test data', () => {
      setTestObjects(
        dummyTest.passing('field_1'),
        dummyTest.failing('field_1', 'message'),
        dummyTest.failing('field_1', 'failure_message'),
        dummyTest.failing('field_1', 'failure_message with group', 'group_1'),
        dummyTest.failingWarning('field_2', 'warning test'),
        dummyTest.failingWarning('field_2', 'another warning test'),
        dummyTest.passing('field_2'),
        dummyTest.passing('field_3', '', 'group_1'),
        dummyTest.failing('field_3', 'msg'),
        dummyTest.passing('field_4'),
        dummyTest.passing('field_5', '', 'group_2'),
        dummyTest.failingWarning('field_5', 'warning message', 'group_2')
      );

      expect(produceMethod().hasErrors()).toBe(true);
      expect(produceMethod().hasErrors('field_1')).toBe(true);
      expect(produceMethod().hasErrors('field_2')).toBe(false);
      expect(produceMethod().hasErrors('field_3')).toBe(true);
      expect(produceMethod().hasErrors('field_4')).toBe(false);
      expect(produceMethod().hasErrors('field_5')).toBe(false);
      expect(produceMethod().hasWarnings('field_1')).toBe(false);
      expect(produceMethod().hasWarnings('field_2')).toBe(true);
      expect(produceMethod().hasWarnings('field_3')).toBe(false);
      expect(produceMethod().hasWarnings('field_4')).toBe(false);
      expect(produceMethod().hasWarnings('field_5')).toBe(true);
      expect(produceMethod().getErrors()).toEqual({
        field_1: ['message', 'failure_message', 'failure_message with group'],
        field_2: [],
        field_3: ['msg'],
        field_4: [],
        field_5: [],
      });
      expect(produceMethod().getWarnings()).toEqual({
        field_1: [],
        field_2: ['warning test', 'another warning test'],
        field_3: [],
        field_4: [],
        field_5: ['warning message'],
      });
      expect(produceMethod().getErrors()).toEqual({
        field_1: ['message', 'failure_message', 'failure_message with group'],
        field_2: [],
        field_3: ['msg'],
        field_4: [],
        field_5: [],
      });
      expect(produceMethod().hasErrorsByGroup('group_1')).toBe(true);
      expect(produceMethod().hasErrorsByGroup('group_1', 'field_1')).toBe(true);
      expect(produceMethod().hasErrorsByGroup('group_2')).toBe(false);
      expect(produceMethod().hasErrorsByGroup('group_1', 'field_2')).toBe(
        false
      );
      expect(produceMethod().hasErrorsByGroup('group_3')).toBe(false);
      expect(produceMethod().hasWarningsByGroup('group_1')).toBe(false);
      expect(produceMethod().hasWarningsByGroup('group_1', 'field_1')).toBe(
        false
      );
      expect(produceMethod().hasWarningsByGroup('group_2')).toBe(true);
      expect(produceMethod().hasWarningsByGroup('group_1', 'field_2')).toBe(
        false
      );
      expect(produceMethod().hasWarningsByGroup('group_2', 'field_5')).toBe(
        true
      );
    });
  });

  describe('Value memoization', () => {
    itWithContext('When unchanged, should produce a memoized result', () => {
      const prev = { ...produceMethod() };
      expect(prev).toMatchObject(produceMethod());
      expect(produceMethod()).toBe(produceMethod());
    });

    itWithContext('When changed, should produce a new result object', () => {
      let current = produceMethod();
      setTestObjects(dummyTest.passing());
      expect(current).not.toMatchObject(produceMethod());
      expect(current).not.toBe(produceMethod());
      current = produceMethod();
      setTestObjects(dummyTest.failing());
      expect(current).not.toMatchObject(produceMethod());
      expect(current).not.toBe(produceMethod());
    });
  });
});

describe('produceSuiteResult', () => {
  describe('exposed methods', () => {
    itWithContext('Should have all exposed methods', () => {
      expect(produceSuiteResult()).toMatchInlineSnapshot(`
        Object {
          "errorCount": 0,
          "getErrors": [Function],
          "getErrorsByGroup": [Function],
          "getWarnings": [Function],
          "getWarningsByGroup": [Function],
          "groups": Object {},
          "hasErrors": [Function],
          "hasErrorsByGroup": [Function],
          "hasWarnings": [Function],
          "hasWarningsByGroup": [Function],
          "isValid": [Function],
          "suiteName": undefined,
          "testCount": 0,
          "tests": Object {},
          "valid": false,
          "warnCount": 0,
        }
      `);
    });
  });
});

describe('produceFullResult', () => {
  describe('exposed methods', () => {
    itWithContext('Should have all exposed methods', () => {
      expect(produceFullResult()).toMatchInlineSnapshot(`
        Object {
          "done": [Function],
          "errorCount": 0,
          "getErrors": [Function],
          "getErrorsByGroup": [Function],
          "getWarnings": [Function],
          "getWarningsByGroup": [Function],
          "groups": Object {},
          "hasErrors": [Function],
          "hasErrorsByGroup": [Function],
          "hasWarnings": [Function],
          "hasWarningsByGroup": [Function],
          "isValid": [Function],
          "suiteName": undefined,
          "testCount": 0,
          "tests": Object {},
          "valid": false,
          "warnCount": 0,
        }
      `);
    });
  });
});
