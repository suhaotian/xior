import React from 'react';

const TodoItem = ({ todo }: { todo: { id: number | string; title: string } }) => {
  const { id, title } = todo;
  return (
    <div>
      <p>
        {id}.{title}
      </p>
    </div>
  );
};

export default TodoItem;
