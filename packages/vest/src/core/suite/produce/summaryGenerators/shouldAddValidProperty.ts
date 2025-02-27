import { isNotEmpty, isEmpty } from 'isEmpty';

import { hasErrorsByTestObjects } from 'hasFailuresByTestObjects';
import { nonMatchingFieldName } from 'matchingFieldName';
import { useTestsFlat, useAllIncomplete, useOptionalFields } from 'stateHooks';

// eslint-disable-next-line max-statements, complexity
export default function shouldAddValidProp(fieldName?: string): boolean {
  if (fieldIsOmitted(fieldName)) {
    return true;
  }

  if (hasErrorsByTestObjects(fieldName)) {
    return false;
  }

  const testObjects = useTestsFlat();

  if (isEmpty(testObjects)) {
    return false;
  }

  if (hasNonOptionalIncomplete(fieldName)) {
    return false;
  }

  return noMissingTests(fieldName);
}

function fieldIsOmitted(fieldName?: string) {
  if (!fieldName) {
    return false;
  }
  const flatTests = useTestsFlat();
  return flatTests.some(
    testObject => testObject.fieldName === fieldName && testObject.isOmitted()
  );
}

function hasNonOptionalIncomplete(fieldName?: string) {
  const [optionalFields] = useOptionalFields();

  return isNotEmpty(
    useAllIncomplete().filter(testObject => {
      if (nonMatchingFieldName(testObject, fieldName)) {
        return false;
      }
      return optionalFields[testObject.fieldName] !== true;
    })
  );
}

function noMissingTests(fieldName?: string): boolean {
  const testObjects = useTestsFlat();
  const [optionalFields] = useOptionalFields();

  return testObjects.every(testObject => {
    if (nonMatchingFieldName(testObject, fieldName)) {
      return true;
    }

    return (
      optionalFields[testObject.fieldName] === true ||
      testObject.isTested() ||
      testObject.isOmitted()
    );
  });
}
