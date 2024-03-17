import React from 'react';

import axiosInstance from './xior';

const initialState = {
  loading: false,
  todos: [] as { id: number | string; title: string }[],
  error: '',
};

const reducer = (
  state: typeof initialState,
  action: { type: string } & Partial<typeof initialState>
) => {
  switch (action.type) {
    case 'fetch':
      return { ...state, loading: true };
    case 'success':
      return { ...state, loading: false, todos: action.todos };
    case 'failure':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

export const useXior = (url) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  React.useEffect(() => {
    const fetchTodos = async () => {
      dispatch({ type: 'fetch' });
      await axiosInstance
        .get(url)
        .then((res) => {
          dispatch({ type: 'success', todos: res.data });
        })
        .catch((error) => {
          dispatch({ type: 'failure', error: error.message });
        });
    };
    fetchTodos();
  }, []);

  return state;
};
