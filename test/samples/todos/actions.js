export const addTodo = text => ({
  type: 'ADD_TODO',
  text
});

export const toggleTodo = id => ({
  type: 'TOGGLE_TODO',
  id
});

export const delayAddTodo = (text, delay) => dispatch => {
  setTimeout(() => {
    dispatch(addTodo(text));
  }, delay || 1000);
}

export const delayToggleTodo = (id, delay) => dispatch => {
  setTimeout(() => {
    dispatch(toggleTodo(id));
  }, delay || 1000);
}
