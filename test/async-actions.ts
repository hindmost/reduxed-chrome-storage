import { expect } from 'chai';
import sinon from 'sinon';
import { applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reset from './shortcuts/reset';
import storeCreatorFactory from './shortcuts/factory';
import { delayAddTodo, delayToggleTodo } from './samples/todos/actions';
import todosReducer from './samples/todos/reducers';

describe("Async actions", () => {

  beforeEach(reset);

  describe('of equal duration', () => {

    it("create a store with TodoList reducer and Redux Thunk as a middleware; dispatch an async action adding one todo (with 1 sec delay); 1ms later dispatch another async action checking the added todo as completed (with 1 sec delay); at this point the current state should be an empty array; 1 sec later the current state should receive the added todo unchecked;  1 msec later the todo in the current state should become checked", async () => {
      const store = await storeCreatorFactory()( todosReducer, applyMiddleware(thunk) );

      const clock = sinon.useFakeTimers();
      store.dispatch(delayAddTodo('todo1'));
      clock.tick(1);
      store.dispatch(delayToggleTodo(1));
      expect(store.getState()).to.eql([]);
      clock.tick(1000);
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

    it("create a store with TodoList reducer and Redux Thunk as a middleware; dispatch an async action adding todo 'todo1' (with 2 sec delay); 1ms later dispatch another async action adding todo 'todo2' (with 1 sec delay); at this point the current state should be an empty array; 1.001 sec later the current state should receive the 'todo2' todo;  1 sec later the 'todo1' todo should be appended to the current state", async () => {
      const store = await storeCreatorFactory()( todosReducer, applyMiddleware(thunk) );

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

});
