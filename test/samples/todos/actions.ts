import { Dispatch } from 'redux';

export const addTodo = (text:string) => ({
  type: 'ADD_TODO',
  text
});

export const toggleTodo = (id:number) => ({
  type: 'TOGGLE_TODO',
  id
});

export const delayAddTodo = (text:string, delay?:number) => (dispatch: Dispatch) => {
  setTimeout(() => {
    dispatch(addTodo(text));
  }, delay || 1000);
}

export const delayToggleTodo = (id:number, delay?:number) => (dispatch: Dispatch) => {
  setTimeout(() => {
    dispatch(toggleTodo(id));
  }, delay || 1000);
}

export const batchAddTodos = (todos: string[]) => (dispatch: Dispatch) => {
  todos.forEach((todo) => {
    dispatch(addTodo(todo));
  });
};
