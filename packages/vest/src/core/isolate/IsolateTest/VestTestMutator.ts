import { IsolateTest } from 'IsolateTest';
import {
  TestAction,
  TestStateMachineAction,
  TestStatus,
  createTestStateMachine,
} from 'IsolateTestStateMachine';
import { TestSeverity } from 'Severity';
import { VestTestInspector } from 'VestTestInspector';

const TestStateMachine = createTestStateMachine();

export class VestTestMutator {
  static setPending(test: IsolateTest) {
    VestTestMutator.setStatus(test, TestStatus.PENDING);
  }

  static fail(test: IsolateTest): void {
    VestTestMutator.setStatus(
      test,
      VestTestInspector.warns(test) ? TestStatus.WARNING : TestStatus.FAILED
    );
  }

  static pass(test: IsolateTest): void {
    VestTestMutator.setStatus(test, TestStatus.PASSING);
  }

  static warn(test: IsolateTest): void {
    test.severity = TestSeverity.Warning;
  }

  static skip(test: IsolateTest, force?: boolean): void {
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
    VestTestMutator.setStatus(test, TestStatus.SKIPPED, force);
  }

  static cancel(test: IsolateTest): void {
    VestTestMutator.setStatus(test, TestStatus.CANCELED);
  }

  static omit(test: IsolateTest): void {
    VestTestMutator.setStatus(test, TestStatus.OMITTED);
  }

  static reset(test: IsolateTest): void {
    VestTestMutator.setStatus(test, TestAction.RESET);
  }

  static setStatus(
    test: IsolateTest,
    status: TestStateMachineAction,
    payload?: any
  ): void {
    test.status = TestStateMachine.transitionFrom(test.status, status, payload);
  }
}
