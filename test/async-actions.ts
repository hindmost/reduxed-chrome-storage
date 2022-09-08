import { expect } from 'chai';
import sinon from 'sinon';
import reset from './shortcuts/reset';
import setup from './shortcuts/setup';
import {
  addTodo, delayAddTodo, delayToggleTodo, batchAddTodos
} from './samples/todos/actions';
import {
  setVisibilityFilter, VisibilityFilters
} from './samples/filter/actions';
import todosReducer from './samples/todos/reducers';
import filterReducer from './samples/filter/reducers';

describe("Async actions", () => {

  beforeEach(reset);

  describe('of equal duration', () => {

    it("create a store with TodoList reducer; dispatch an async action adding one todo (with 1 sec delay); 1ms later dispatch another async action checking the added todo as completed (with 1 sec delay); at this point the current state should be an empty array; 1 sec later the current state should receive the added todo unchecked;  1 msec later the todo in the current state should become checked", async () => {
      const instantiate = setup( todosReducer );
      const store = await instantiate();

      const clock = sinon.useFakeTimers();
      store.dispatch(delayAddTodo('todo1'));
      clock.tick(1);
      store.dispatch(delayToggleTodo(1));
      expect(store.getState()).to.eql([]);
      clock.tick(999);
      expect(store.getState()).to.eql([
        {id: 1, text: 'todo1', completed: false}
      ]);
      clock.tick(1);
      expect(store.getState()).to.eql([
        {id: 1, text: 'todo1', completed: true}
      ]);
      clock.restore();
    });

  });

  describe('of unequal duration', () => {

    it("create a store with TodoList reducer; dispatch an async action adding 'todo1' todo (with 2 sec delay); 1ms later dispatch another async action adding 'todo2' todo (with 1 sec delay); at this point the current state should be an empty array; 1.001 sec later the current state should receive the 'todo2' todo; 1 sec later the 'todo1' todo should be appended to the current state", async () => {
      const instantiate = setup( todosReducer );
      const store = await instantiate();

      const clock = sinon.useFakeTimers();
      store.dispatch(delayAddTodo('todo1', 2000));
      clock.tick(1);
      store.dispatch(delayAddTodo('todo2', 1000));
      expect(store.getState()).to.eql([]);
      clock.tick(1001);
      expect(store.getState()).to.eql([
        {id: 1, text: 'todo2', completed: false}
      ]);
      clock.tick(1000);
      expect(store.getState()).to.eql([
        {id: 1, text: 'todo2', completed: false},
        {id: 2, text: 'todo1', completed: false}
      ]);
      clock.restore();
    });

  });

  describe("multiple state changes per action", () => {

    it("create a store with TodoList reducer; dispatch an async action that causes multiple state changes by adding 4 todos; in the end the current state should contain all 4 todos", async () => {
      const instantiate = setup( todosReducer );
      const store = await instantiate();

      const clock = sinon.useFakeTimers();
      expect(store.getState()).to.eql([]);
      store.dispatch(batchAddTodos(['todo1', 'todo2', 'todo3', 'todo4']));
      clock.tick(1);
      expect(store.getState()).to.eql([
        { id: 1, text: 'todo1', completed: false },
        { id: 2, text: 'todo2', completed: false },
        { id: 3, text: 'todo3', completed: false },
        { id: 4, text: 'todo4', completed: false },
      ]);
      clock.restore();
    });

  });

  describe("outdated actions handling", () => {

    it("create two stores, both with combined TodoList+VisibilityFilter reducer; dispatch on the 1st store two async actions: 1st one adding 'todo1' todo (with 1 sec delay) and 2nd one adding 'todo2' todo (with 2 sec delay); dispatch on the 2nd store a sync action setting VisibilityFilter to 'SHOW_ACTIVE'; once the 1st store receives update from the 2nd store the two async actions become outdated; 2 sec later dispatch on the 1st store a sync action adding 'todo3' todo; in the end the current state of the 1st store should contain 'todo1' (async action - completed before outdatedTmeout=1sec is exceeded) and 'todo3' (sync action - completed immediately) in the todo list, but not 'todo2' (async action - lost as uncompleted within outdatedTmeout)", async () => {
      const reducers = {
        todos: todosReducer, filter: filterReducer
      };
      const storeOfOne = await setup( reducers )();
      const storeOfTwo = await setup( reducers )();

      const clock = sinon.useFakeTimers();
      storeOfOne.dispatch(delayAddTodo('todo1', 1000));
      storeOfOne.dispatch(delayAddTodo('todo2', 2000));
      storeOfTwo.dispatch( setVisibilityFilter(VisibilityFilters.SHOW_ACTIVE) );
      clock.tick(2001);
      storeOfOne.dispatch(addTodo('todo3'));
      expect(storeOfOne.getState()).to.eql({
        todos: [
          {id: 1, text: 'todo1', completed: false},
          {id: 2, text: 'todo3', completed: false}
        ],
        filter: VisibilityFilters.SHOW_ACTIVE
      });
      clock.restore();
    });

  });

});
