import { enforce } from 'n4s';

import create, { Suite } from './core/suite/create';

import VestTest from 'VestTest';
import context from 'ctx';
import each from 'each';
import { only, skip } from 'exclusive';
import group from 'group';
import include from 'include';
import { eager } from 'mode';
import omitWhen from 'omitWhen';
import optional from 'optionalTests';
import type { SuiteResult } from 'produceSuiteResult';
import type { SuiteRunResult } from 'produceSuiteRunResult';
import skipWhen from 'skipWhen';
import { test } from 'test';
import warn from 'warn';

const VERSION = __LIB_VERSION__;
export {
  test,
  create,
  each,
  only,
  skip,
  warn,
  group,
  optional,
  skipWhen,
  omitWhen,
  enforce,
  VERSION,
  context,
  include,
  eager,
};

export type { SuiteResult, SuiteRunResult, VestTest, Suite };
