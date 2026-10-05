import { describe, beforeEach, it, expect, vi } from 'vitest';
import reset from './shortcuts/reset';
import setup from './shortcuts/setup';
import { addTodo } from './samples/todos/actions';
import todosReducer from './samples/todos/reducers';

describe(`State change tracking`, () => {

  beforeEach(reset);

  describe(`In persistent background script`, () => {

    it(`create two stores representing background script and popup page (for example),
both with TodoList reducer;
add a change listener on the 1st store;
dispatch an action on the 2nd store;
as a result, the listener should be called once and
getState() calls on both stores should return the same value
`, async () => {
      const instantiate = setup( todosReducer );
      const storeOfBg = await instantiate();
      const spyInBg = vi.fn();
      storeOfBg.subscribe(spyInBg);

      const storeOfPopup = await setup( todosReducer )();

      const clock = vi.useFakeTimers();
      storeOfPopup.dispatch(addTodo('todo1'));
      expect(spyInBg).to.have.callCount(0);
      clock.advanceTimersByTime(1);
      expect(spyInBg).to.have.callCount(1);
      expect(storeOfPopup.getState()).to.eql(storeOfBg.getState());
      clock.useRealTimers();
    });

  });

  describe(`In Manifest V3 service worker`, () => {

    it(`create a store representing popup page (for example) with TodoList reducer;
set up a change listener in a service worker via special factory option;
dispatch an action on the created store;
as a result, the listener should be called with two arguments:
1st one should be a Redux store with the same state as of the created store and
2nd one representing the previous state should equal empty array
`, async () => {
      const storeOfPopup = await setup( todosReducer )();

      const spyInSw = vi.fn();
      setup( todosReducer, spyInSw );

      const clock = vi.useFakeTimers();
      storeOfPopup.dispatch(addTodo('todo1'));
      expect(spyInSw).to.have.callCount(0);
      clock.advanceTimersByTime(1);
      expect(spyInSw).to.have.callCount(1);
      const store = spyInSw.mock.lastCall![0];
      const oldState = spyInSw.mock.lastCall![1];
      expect(store).to.instanceOf(storeOfPopup.constructor);
      expect(store.getState()).to.eql(storeOfPopup.getState());
      expect(oldState).to.eql([]);
      clock.useRealTimers();
    });

  }); 
});

