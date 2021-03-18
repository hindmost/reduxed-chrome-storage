import { expect } from 'chai';
import sinon from 'sinon';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import chrome from './mock/chrome.js';
import reduxedStorageCreatorFactory from '../src';
import { addTodo, toggleTodo, delayAddTodo, delayToggleTodo } from './samples/todos/actions';
import { setVisibilityFilter, VisibilityFilters } from './samples/filter/actions';
import todosReducer from './samples/todos/reducers';
import filterReducer from './samples/filter/reducers';
global.chrome = chrome;

describe('Use Cases', () => {

  beforeEach(() => {
    chrome.storage.reset();
  });

  describe('State change tracking', () => {

    it("create two stores representing background script and popup page (for example), both with TodoList reducer; add a change listener on the 1st store; dispatch an action on the 2nd store; as a result, the listener should be called once and getState() calls on both stores should return the same value", async () => {
      const storeOfBg = await reduxedStorageCreatorFactory({
        createStore
      })(
        todosReducer
      );
      const spyOnBg = sinon.spy();
      storeOfBg.subscribe(spyOnBg);

      const storeOfPopup = await reduxedStorageCreatorFactory({
        createStore
      })(
        todosReducer
      );

      const clock = sinon.useFakeTimers();
      storeOfPopup.dispatch(addTodo('todo1'));
      expect(spyOnBg.callCount).to.equal(0); 
      clock.tick(1);
      expect(spyOnBg.callCount).to.equal(1);
      expect(storeOfPopup.getState()).to.eql(storeOfBg.getState());
      clock.restore();
    });

  });

  describe("State persistence through extension's activity periods (browser sessions in the case of persistent extension)", () => {

    describe('Regular usage', () => {

      it("create a store with TodoList reducer; dispatch an action on it; store its current state in a variable; create another store (with the same reducer) representing the next session; as a result, its current state should equal the previously stored value", async () => {
        const storeOfSession1 = await reduxedStorageCreatorFactory({
          createStore
        })(
          todosReducer
        );

        const clock = sinon.useFakeTimers();
        clock.tick(1);
        storeOfSession1.dispatch(addTodo('todo1'));
        clock.tick(1);
        const stateOfSession1 = storeOfSession1.getState();
        clock.restore();

        const storeOfSession2 = await reduxedStorageCreatorFactory({
          createStore
        })(
          todosReducer
        );
        expect(storeOfSession2.getState()).to.eql(stateOfSession1);
      });

    });

    describe("Advanced usage along with the store creator's initialState argument", () => {
 
      it("create a store with combined TodoList+VisibilityFilter reducer; dispatch a TodoList action on it adding one todo; dispatch a VisibilityFilter action on it setting VisibilityFilter to 'SHOW_ACTIVE'; store the current state in a variable; create another store (with the same reducer) representing the next session; as a result, VisibilityFilter property of the current state should equal 'SHOW_ACTIVE', while TodoList property should equal its counterpart in the previously stored state", async () => {
        const combinedReducer = combineReducers({todos: todosReducer, filter: filterReducer});
        const storeOfSession1 = await reduxedStorageCreatorFactory({
          createStore
        })(
          combinedReducer
        );
  
        const clock = sinon.useFakeTimers();
        clock.tick(1);
        storeOfSession1.dispatch(addTodo('todo1'));
        storeOfSession1.dispatch(setVisibilityFilter(VisibilityFilters.SHOW_ACTIVE));
        clock.tick(1);
        const stateOfSession1 = storeOfSession1.getState();
        clock.restore();
  
        const storeOfSession2 = await reduxedStorageCreatorFactory({
          createStore
        })(
          combinedReducer, {filter: VisibilityFilters.SHOW_ALL}
        );
        const stateOfSession2 = storeOfSession2.getState();
        expect(stateOfSession1.todos).to.eql(stateOfSession2.todos);
        expect(stateOfSession2.filter).to.eql(VisibilityFilters.SHOW_ALL);
      });
  
    });
  
  });

  describe('Sync actions in bulk', () => {

    it("create a store with TodoList reducer; dispatch 5 consecutive actions on it adding 3 todos and checking the 1st and 3rd ones as completed; as a result, the current state should equal the predefined value", async () => {
      const store = await reduxedStorageCreatorFactory({
        createStore
      })(
        todosReducer
      );

      const clock = sinon.useFakeTimers();
      store.dispatch(addTodo('todo1'));
      store.dispatch(toggleTodo(1));
      store.dispatch(addTodo('todo2'));
      store.dispatch(addTodo('todo3'));
      store.dispatch(toggleTodo(3));
      clock.tick(1);

      const resultState = [
        {id: 1, text: 'todo1', completed: true},
        {id: 2, text: 'todo2', completed: false},
        {id: 3, text: 'todo3', completed: true}
      ];
      expect(store.getState()).to.eql(resultState);
      clock.restore();
    });

  });

  describe('Async actions', () => {

    describe('of equal duration', () => {

      it("create a store with TodoList reducer and Redux Thunk as a middleware; dispatch an async action adding one todo (with 1 sec delay); 1ms later dispatch another async action checking the added todo as completed (with 1 sec delay); at this point the current state should be an empty array; 1 sec later the current state should receive the added todo unchecked;  1 msec later the todo in the current state should become checked", async () => {
        const store = await reduxedStorageCreatorFactory({
          createStore
        })(
          todosReducer, null, applyMiddleware(thunk)
        );

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
        const store = await reduxedStorageCreatorFactory({
          createStore
        })(
          todosReducer, null, applyMiddleware(thunk)
        );

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

});

