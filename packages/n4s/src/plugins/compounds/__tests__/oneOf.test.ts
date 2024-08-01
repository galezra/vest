import { describe, it, expect } from 'vitest';

import { enforce } from 'enforce';
import * as ruleReturn from 'ruleReturn';

import 'schema';
import 'compounds';

describe('enforce.oneOf', () => {
  it('Should fail when multiple enforcements are met', () => {
    expect(
      enforce.oneOf(enforce.isNumber(), enforce.greaterThan(2)).run(3),
    ).toEqual(ruleReturn.failing());
  });

  it('Should pass when only one enforcement is met', () => {
    expect(
      User.run({
        name: {
          first: 'John',
          last: 'Doe',
        },
      }),
    ).toEqual(ruleReturn.passing());
    expect(User.run({ id: 11 })).toEqual(ruleReturn.passing());
  });

  it('Should fail when no enforcement is met', () => {
    expect(User.run({})).toEqual(ruleReturn.failing());
  });
});

const Entity = enforce.loose({
  id: enforce.isNumber(),
});

const Person = enforce.loose({
  name: enforce.shape({
    first: enforce.isString().longerThan(2),
    last: enforce.isString().longerThan(2),
  }),
});
const User = enforce.oneOf(Entity, Person);
