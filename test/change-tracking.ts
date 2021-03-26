import { expect } from 'chai';
import sinon from 'sinon';
import reset from './shortcuts/reset';
import storeCreatorFactory from './shortcuts/factory';
import { addTodo } from './samples/todos/actions';
import todosReducer from './samples/todos/reducers';

describe('State change tracking', () => {

  beforeEach(reset);

  it("create two stores representing background script and popup page (for example), both with TodoList reducer; add a change listener on the 1st store; dispatch an action on the 2nd store; as a result, the listener should be called once and getState() calls on both stores should return the same value", async () => {
    const storeOfBg = await storeCreatorFactory()( todosReducer );
    const spyOnBg = sinon.spy();
    storeOfBg.subscribe(spyOnBg);

    const storeOfPopup = await storeCreatorFactory()( todosReducer );

    const clock = sinon.useFakeTimers();
    storeOfPopup.dispatch(addTodo('todo1'));
    expect(spyOnBg.callCount).to.equal(0); 
    clock.tick(1);
    expect(spyOnBg.callCount).to.equal(1);
    expect(storeOfPopup.getState()).to.eql(storeOfBg.getState());
    clock.restore();
  });

});

