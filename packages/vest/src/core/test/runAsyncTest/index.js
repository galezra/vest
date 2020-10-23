import callEach from '../../../lib/callEach';
import context from '../../context';
import useTestCallbacks from '../../state/useTestCallbacks';
import useTestObjects from '../../state/useTestObjects';
import hasRemainingTests from '../../suite/hasRemainingTests';
import { removePending } from '../lib/pending';

/**
 * Runs async test.
 * @param {VestTest} testObject A VestTest instance.
 */
const runAsyncTest = testObject => {
  const { asyncTest, statement } = testObject;
  const { stateRef } = context.use();
  const done = context.bind({ stateRef }, () => {
    removePending(testObject);

    // This is for cases in which the suite state was already reset
    if (!stateRef.current() || testObject.canceled) {
      return;
    }

    // Perform required done callback calls and cleanups after the test is finished
    runDoneCallbacks(testObject.fieldName);
  });
  const fail = context.bind({ stateRef }, rejectionMessage => {
    testObject.statement =
      typeof rejectionMessage === 'string' ? rejectionMessage : statement;
    testObject.fail();

    // Spreading the array to invalidate the cache
    useTestObjects(testObjects => testObjects.slice());
    done();
  });
  try {
    asyncTest.then(done, fail);
  } catch (e) {
    fail();
  }
};

/**
 * Runs done callback when async tests are finished running.
 * @param {string} [fieldName] Field name with associated callbacks.
 */
const runDoneCallbacks = fieldName => {
  const [{ fieldCallbacks, doneCallbacks }] = useTestCallbacks();

  if (fieldName) {
    if (
      !hasRemainingTests(fieldName) &&
      Array.isArray(fieldCallbacks[fieldName])
    ) {
      callEach(fieldCallbacks[fieldName]);
    }
  }
  if (!hasRemainingTests()) {
    callEach(doneCallbacks);
  }
};

export default runAsyncTest;
