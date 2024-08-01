import { Maybe, invariant, isPromise, optionalFunctionValue } from 'vest-utils';
import { IsolateMutator, IsolateSelectors, TIsolate } from 'vestjs-runtime';

import { ErrorStrings } from 'ErrorStrings';
import type { TIsolateTest } from 'IsolateTest';
import {
  IsolateTestStateMachine,
  TestAction,
  TestStatus,
} from 'IsolateTestStateMachine';
import { TestSeverity } from 'Severity';
import { TFieldName, TGroupName } from 'SuiteResultTypes';
import { VestIsolate } from 'VestIsolate';
import { VestIsolateType } from 'VestIsolateType';

export class VestTest extends VestIsolate {
  static stateMachine = IsolateTestStateMachine;

  // Read

  static getData<
    F extends TFieldName = TFieldName,
    G extends TGroupName = TGroupName,
  >(test: TIsolateTest<F, G>) {
    invariant(test.data);
    return test.data;
  }

  static is(isolate?: Maybe<TIsolate>): isolate is TIsolateTest {
    return IsolateSelectors.isIsolateType<TIsolateTest>(
      isolate,
      VestIsolateType.Test,
    );
  }

  static isX(isolate?: Maybe<TIsolate>): asserts isolate is TIsolateTest {
    invariant(VestTest.is(isolate), ErrorStrings.EXPECTED_VEST_TEST);
  }

  static cast<F extends TFieldName = string, G extends TGroupName = string>(
    isolate?: Maybe<TIsolate>,
  ): TIsolateTest<F, G> {
    VestTest.isX(isolate);
    return isolate as TIsolateTest<F, G>;
  }

  static warns(test: TIsolateTest): boolean {
    return VestTest.getData(test).severity === TestSeverity.Warning;
  }

  static isOmitted(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.OMITTED);
  }

  static isUntested(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.UNTESTED);
  }

  static isFailing(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.FAILED);
  }

  static isCanceled(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.CANCELED);
  }

  static isSkipped(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.SKIPPED);
  }

  static isPassing(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.PASSING);
  }

  static isWarning(test: TIsolateTest): boolean {
    return VestTest.statusEquals(test, TestStatus.WARNING);
  }

  static hasFailures(test: TIsolateTest): boolean {
    return VestTest.isFailing(test) || VestTest.isWarning(test);
  }

  static isNonActionable(test: TIsolateTest): boolean {
    return (
      VestTest.isSkipped(test) ||
      VestTest.isOmitted(test) ||
      VestTest.isCanceled(test)
    );
  }

  static isTested(test: TIsolateTest): boolean {
    return VestTest.hasFailures(test) || VestTest.isPassing(test);
  }

  static awaitsResolution(test: TIsolateTest): boolean {
    // Is the test in a state where it can still be run, or complete running
    // and its final status is indeterminate?
    return (
      VestTest.isSkipped(test) ||
      VestTest.isUntested(test) ||
      VestTest.isPending(test)
    );
  }

  static isAsyncTest(test: TIsolateTest): boolean {
    return isPromise(VestTest.getData(test).asyncTest);
  }

  // Mutate

  // static setPending(test: TIsolateTest) {
  //   this.setStatus(test, TestStatus.PENDING);
  // }

  static fail(test: TIsolateTest): void {
    VestTest.setStatus(
      test,
      VestTest.warns(test) ? TestStatus.WARNING : TestStatus.FAILED,
    );
  }

  static pass(test: TIsolateTest): void {
    VestTest.setStatus(test, TestStatus.PASSING);
  }

  static warn(test: TIsolateTest): void {
    VestTest.setData(test, current => ({
      ...current,
      severity: TestSeverity.Warning,
    }));
  }

  static setData(
    test: TIsolateTest,
    setter:
      | ((current: TIsolateTest['data']) => TIsolateTest['data'])
      | TIsolateTest['data'],
  ): void {
    test.data = optionalFunctionValue(setter, VestTest.getData(test));
  }

  static skip(test: TIsolateTest, force?: boolean): void {
    // Without this force flag, the test will be marked as skipped even if it is pending.
    // This means that it will not be counted in "allIncomplete" and its done callbacks
    // will not be called, or will be called prematurely.
    // What this mostly say is that when we have a pending test for one field, and we then
    // start typing in a different field - the pending test will be canceled, which
    // is usually an unwanted behavior.
    // The only scenario in which we DO want to cancel the async test regardless
    // is when we specifically skip a test with `skipWhen`, which is handled by the
    // "force" boolean flag.
    // I am not a fan of this flag, but it gets the job done.
    VestTest.setStatus(test, TestStatus.SKIPPED, force);
  }

  static cancel(test: TIsolateTest): void {
    VestTest.setStatus(test, TestStatus.CANCELED);
    IsolateMutator.abort(test, TestStatus.CANCELED);
  }

  static omit(test: TIsolateTest): void {
    VestTest.setStatus(test, TestStatus.OMITTED);
  }

  static reset(test: TIsolateTest): void {
    VestTest.setStatus(test, TestAction.RESET);
  }
}
