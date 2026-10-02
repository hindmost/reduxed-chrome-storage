import { AnyAction } from 'redux';

type Todo = {
  id: number;
  text?: string;
  completed?: boolean;
}

export default function todos(state: Todo[] = [], action: AnyAction): Todo[] {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: state.length+1,
          text: action.text,
          completed: false
        }
      ];
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo
      );
    default:
      return state;
  }
}
