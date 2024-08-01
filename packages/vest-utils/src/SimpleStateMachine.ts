import { CB } from 'utilityTypes';

const STATE_WILD_CARD = '*';
type TStateWildCard = typeof STATE_WILD_CARD;

export type TStateMachine<S extends string = string, A extends S = S> = {
  initial: S;
  states: Partial<{
    [key in S & TStateWildCard]: {
      [key in A]?: S | [S, CB<boolean, [payload?: any]>];
    };
  }>;
};

export type TStateMachineApi<S extends string = string, A extends S = S> = {
  getState: CB<S>;
  initial: CB<S>;
  staticTransition: (from: S, action: A, payload?: any) => S;
  transition: (action: A, payload?: any) => void;
};

export function StateMachine<S extends string = string, A extends S = S>(
  machine: TStateMachine<S, A>,
): TStateMachineApi<S, A> {
  let state = machine.initial;

  const api = { getState, initial, staticTransition, transition };

  return api;

  function getState(): S {
    return state;
  }

  function initial(): S {
    return machine.initial;
  }

  function transition(action: A, payload?: any): S {
    return (state = staticTransition(state, action, payload));
  }

  // eslint-disable-next-line complexity
  function staticTransition(from: S, action: A, payload?: any): S {
    const transitionTo =
      machine.states[from]?.[action] ??
      // @ts-expect-error - This is a valid state
      machine.states[STATE_WILD_CARD]?.[action];

    let target = transitionTo;

    if (Array.isArray(target)) {
      const [, conditional] = target;
      if (!conditional(payload)) {
        return from;
      }

      target = target[0];
    }

    if (!target || target === from) {
      return from;
    }

    return target as S;
  }
}
