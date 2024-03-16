import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import MockPlugin from 'xior/plugins/mock';

import App from '../components/App';
import xiorInstance from '../components/xior';

const mock = new MockPlugin(xiorInstance, { onNoMatch: 'throwException' });

const todos = [
  {
    id: 1,
    title: 'Buy milk',
    completed: false,
  },
  {
    id: 2,
    title: 'Walk the dog',
    completed: true,
  },
];

beforeAll(() => {
  mock.reset();
});

afterEach(cleanup);

const renderComponent = () => render(<App />);

describe('axios mocking test', () => {
  it('should render loading followed by todos', async () => {
    mock.onGet('/todos').reply(200, todos);

    const { queryByText, getByTestId } = renderComponent();

    expect(queryByText(/Loading/i)).toBeInTheDocument();
    expect(queryByText(/Walk the dog/i)).not.toBeInTheDocument();

    await waitFor(() => getByTestId('todos'));
    expect(queryByText(/Loading/i)).not.toBeInTheDocument();
    expect(queryByText(/Walk the dog/i)).toBeInTheDocument();
  });

  it('should render loading followed by error message', async () => {
    mock.onGet('/todos').networkError();

    const { queryByText, getByText } = renderComponent();

    expect(queryByText(/Loading/i)).toBeInTheDocument();
    expect(queryByText(/Walk the dog/i)).not.toBeInTheDocument();

    await waitFor(() => getByText(/Error:/i));
    expect(queryByText(/Loading/i)).not.toBeInTheDocument();
    expect(queryByText(/Error: /i)).toBeInTheDocument();
  });
});
