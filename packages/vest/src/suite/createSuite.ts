import { assign, CB } from 'vest-utils';
import { Bus, VestRuntime } from 'vestjs-runtime';

import { TTypedMethods, getTypedMethods } from './getTypedMethods';

import { IsolateSuite, TIsolateSuite } from 'IsolateSuite';
import { useCreateVestState, useLoadSuite } from 'Runtime';
import { SuiteContext } from 'SuiteContext';
import {
  SuiteName,
  SuiteResult,
  SuiteRunResult,
  TFieldName,
  TGroupName,
} from 'SuiteResultTypes';
import { Suite } from 'SuiteTypes';
import { useInitVestBus } from 'VestBus';
import { VestReconciler } from 'VestReconciler';
import { useCreateSuiteResult } from 'suiteResult';
import { useSuiteRunResult } from 'suiteRunResult';
import { bindSuiteSelectors } from 'suiteSelectors';
import { validateSuiteCallback } from 'validateSuiteParams';

function createSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
>(suiteName: SuiteName, suiteCallback: T): Suite<F, G, T>;
function createSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
>(suiteCallback: T): Suite<F, G, T>;
// @vx-allow use-use
// eslint-disable-next-line max-lines-per-function
function createSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
>(
  ...args: [suiteName: SuiteName, suiteCallback: T] | [suiteCallback: T]
): Suite<F, G, T> {
  const [suiteCallback, suiteName] = args.reverse() as [T, SuiteName];

  validateSuiteCallback(suiteCallback);

  // Create a stateRef for the suite
  // It holds the suite's persisted values that may remain between runs.
  const stateRef = useCreateVestState({ suiteName, VestReconciler });

  function suite(...args: Parameters<T>): SuiteRunResult<F, G> {
    return SuiteContext.run(
      {
        suiteParams: args,
      },
      () => {
        Bus.useEmit('SUITE_RUN_STARTED');

        return IsolateSuite(
          useRunSuiteCallback<T, F, G>(suiteCallback, ...args),
        );
      },
    ).output;
  }

  const mountedStatic = staticSuite<F, G, T>(...(args as [T]));

  // Assign methods to the suite
  // We do this within the VestRuntime so that the suite methods
  // will be bound to the suite's stateRef and be able to access it.
  return VestRuntime.Run(stateRef, () => {
    // @vx-allow use-use
    const VestBus = useInitVestBus();

    return assign(
      // We're also binding the suite to the stateRef, so that the suite
      // can access the stateRef when it's called.
      VestRuntime.persist(suite),
      {
        dump: VestRuntime.persist(
          () => VestRuntime.useAvailableRoot() as TIsolateSuite,
        ),
        get: VestRuntime.persist(useCreateSuiteResult),
        remove: Bus.usePrepareEmitter<string>('REMOVE_FIELD'),
        reset: Bus.usePrepareEmitter('RESET_SUITE'),
        resetField: Bus.usePrepareEmitter<string>('RESET_FIELD'),
        resume: VestRuntime.persist(useLoadSuite),
        runStatic: (...args: Parameters<T>): StaticSuiteRunResult<F, G> =>
          mountedStatic(...args) as StaticSuiteRunResult<F, G>,
        subscribe: VestBus.subscribe,
        ...bindSuiteSelectors<F, G>(VestRuntime.persist(useCreateSuiteResult)),
        ...getTypedMethods<F, G>(),
      },
    );
  });
}

function useRunSuiteCallback<
  T extends CB,
  F extends TFieldName,
  G extends TGroupName,
>(suiteCallback: T, ...args: Parameters<T>): CB<SuiteRunResult<F, G>> {
  const emit = Bus.useEmit();

  return () => {
    suiteCallback(...args);
    emit('SUITE_CALLBACK_RUN_FINISHED');
    return useSuiteRunResult<F, G>();
  };
}

/**
 * Creates a static suite for server-side validation.
 *
 * @param {Function} validationFn - The validation function that defines the suite's tests.
 * @returns {Function} - A function that runs the validations defined in the suite.
 *
 * @example
 * import { staticSuite, test, enforce } from 'vest';
 *
 * const suite = staticSuite(data => {
 *   test('username', 'username is required', () => {
 *     enforce(data.username).isNotEmpty();
 *   });
 * });
 *
 * suite(data);
 */

function staticSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
>(suiteName: SuiteName, suiteCallback: T): StaticSuite<F, G, T>;
function staticSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
>(suiteCallback: T): StaticSuite<F, G, T>;
// @vx-allow use-use
// eslint-disable-next-line max-lines-per-function
function staticSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
>(
  ...createArgs: [suiteName: SuiteName, suiteCallback: T] | [suiteCallback: T]
): StaticSuite<F, G, T> {
  return assign(
    (...args: Parameters<T>): StaticSuiteRunResult<F, G> => {
      const suite = createSuite<F, G, T>(
        ...(createArgs as unknown as [SuiteName, T]),
      );

      const result = suite(...args);

      return assign(
        new Promise<SuiteWithDump<F, G>>(resolve => {
          result.done(res => {
            resolve(withDump(res) as SuiteWithDump<F, G>);
          });
        }),
        withDump(result),
      );

      function withDump(o: any) {
        return assign({ dump: suite.dump }, o);
      }
    },
    {
      ...getTypedMethods<F, G>(),
    },
  );
}

export type StaticSuite<
  F extends TFieldName = string,
  G extends TGroupName = string,
  T extends CB = CB,
> = (...args: Parameters<T>) => StaticSuiteRunResult<F, G>;

export type StaticSuiteRunResult<
  F extends TFieldName = string,
  G extends TGroupName = string,
> = Promise<SuiteWithDump<F, G>> &
  WithDump<SuiteRunResult<F, G> & TTypedMethods<F, G>>;

type WithDump<T> = T & { dump: CB<TIsolateSuite> };
type SuiteWithDump<F extends TFieldName, G extends TGroupName> = WithDump<
  SuiteResult<F, G>
>;

export { createSuite, staticSuite };
