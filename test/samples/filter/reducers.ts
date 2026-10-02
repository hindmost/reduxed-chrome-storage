import { VisibilityFilters } from './actions';
import { AnyAction } from 'redux';

export default function visibilityFilter(
  state: string = VisibilityFilters.SHOW_ALL, action: AnyAction
): string {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return action.filter;
    default:
      return state;
  }
}
