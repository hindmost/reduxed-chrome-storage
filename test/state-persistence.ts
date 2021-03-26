import { expect } from 'chai';
import sinon from 'sinon';
import { combineReducers } from 'redux';
import reset from './shortcuts/reset';
import storeCreatorFactory from './shortcuts/factory';
import { addTodo } from './samples/todos/actions';
import { setVisibilityFilter, VisibilityFilters } from './samples/filter/actions';
import todosReducer from './samples/todos/reducers';
import filterReducer from './samples/filter/reducers';

describe("State persistence through extension's activity periods (browser sessions in the case of persistent extension)", () => {

  beforeEach(reset);

  describe('Regular usage', () => {

    it("create a store with TodoList reducer; dispatch an action on it; store its current state in a variable; create another store (with the same reducer) representing the next session; as a result, its current state should equal the previously stored value", async () => {
      const storeOfSession1 = await storeCreatorFactory()( todosReducer );

      const clock = sinon.useFakeTimers();
      clock.tick(1);
      storeOfSession1.dispatch(addTodo('todo1'));
      clock.tick(1);
      const stateOfSession1 = storeOfSession1.getState();
      clock.restore();

      const storeOfSession2 = await storeCreatorFactory()( todosReducer );
      expect(storeOfSession2.getState()).to.eql(stateOfSession1);
    });

  });

  describe("Advanced usage along with the store creator's initialState argument", () => {

    it("create a store with combined TodoList+VisibilityFilter reducer; dispatch a TodoList action on it adding one todo; dispatch a VisibilityFilter action on it setting VisibilityFilter to 'SHOW_ACTIVE'; store the current state in a variable; create another store (with the same reducer) representing the next session; as a result, VisibilityFilter property of the current state should equal 'SHOW_ACTIVE', while TodoList property should equal its counterpart in the previously stored state", async () => {
      const combinedReducer = combineReducers({todos: todosReducer, filter: filterReducer});
      const storeOfSession1 = await storeCreatorFactory()( combinedReducer );

      const clock = sinon.useFakeTimers();
      clock.tick(1);
      storeOfSession1.dispatch(addTodo('todo1'));
      storeOfSession1.dispatch(setVisibilityFilter(VisibilityFilters.SHOW_ACTIVE));
      clock.tick(1);
      const stateOfSession1 = storeOfSession1.getState();
      clock.restore();

      const storeOfSession2 = await storeCreatorFactory()( combinedReducer, {filter: VisibilityFilters.SHOW_ALL} );
      const stateOfSession2 = storeOfSession2.getState();
      expect(stateOfSession1.todos).to.eql(stateOfSession2.todos);
      expect(stateOfSession2.filter).to.eql(VisibilityFilters.SHOW_ALL);
    });

  });

});
