import { expect } from 'chai';
import sinon from 'sinon';
import reset from './shortcuts/reset';
import storeCreatorFactory from './shortcuts/factory';
import { addTodo, toggleTodo } from './samples/todos/actions';
import todosReducer from './samples/todos/reducers';

describe('Sync actions in bulk', () => {

  beforeEach(reset);

  it("create a store with TodoList reducer; dispatch 5 consecutive actions on it adding 3 todos and checking the 1st and 3rd ones as completed; as a result, the current state should equal the predefined value", async () => {
    const store = await storeCreatorFactory()( todosReducer );

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
