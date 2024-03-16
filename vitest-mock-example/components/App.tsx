import React from 'react';

import TodoItem from './Todo';
import { useXior } from './useXior';

function App() {
  const { loading, todos, error } = useXior('/todos');

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="todo" data-testid="todos">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

export default App;
