import { expect } from 'chai';
import sinon from 'sinon';
import reset from './shortcuts/reset';
import storeCreatorFactory from './shortcuts/factory';
import { addTodo } from './samples/todos/actions';
import todosReducer from './samples/todos/reducers';

describe('State change tracking', () => {

  beforeEach(reset);

  describe('In persistent background script', () => {

    it("create two stores representing background script and popup page (for example), both with TodoList reducer; add a change listener on the 1st store; dispatch an action on the 2nd store; as a result, the listener should be called once and getState() calls on both stores should return the same value", async () => {
      const storeOfBg = await storeCreatorFactory()( todosReducer );
      const spy = sinon.spy();
      storeOfBg.subscribe(spy);

      const storeOfPopup = await storeCreatorFactory()( todosReducer );

      const clock = sinon.useFakeTimers();
      storeOfPopup.dispatch(addTodo('todo1'));
      expect(spy.callCount).to.equal(0); 
      clock.tick(1);
      expect(spy.callCount).to.equal(1);
      expect(storeOfPopup.getState()).to.eql(storeOfBg.getState());
      clock.restore();
    });

  });

  describe("In Manifest V3 service worker", () => {

    it("create a store representing popup page (for example) with TodoList reducer; set up a change listener in a service worker via special factory option; dispatch an action on the created store; as a result, the listener should be called with two arguments: 1st one should be a Redux store with the same state as of the created store and 2nd one representing the previous state should equal empty array", async () => {
      const storeOfPopup = await storeCreatorFactory()( todosReducer );

      const spy = sinon.spy();
      await storeCreatorFactory(spy)( todosReducer );

      const clock = sinon.useFakeTimers();
      storeOfPopup.dispatch(addTodo('todo1'));
      expect(spy.callCount).to.equal(0);
      clock.tick(1);
      expect(spy.callCount).to.equal(1);
      const store = spy.getCall(0).args[0];
      const oldState = spy.getCall(0).args[1];
      expect(store).to.instanceOf(storeOfPopup.constructor);
      expect(store.getState()).to.eql(storeOfPopup.getState());
      expect(oldState).to.eql([]);
      clock.restore();
    });

  }); 
});

