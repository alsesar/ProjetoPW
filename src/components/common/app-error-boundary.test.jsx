import React from 'react';
import ReactDOM from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import AppErrorBoundary from './app-error-boundary';

function Boom() {
  throw new Error('boom');
}

function Fallback({ error }) {
  return <div>Falha capturada: {error.message}</div>;
}

describe('AppErrorBoundary', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('renderiza o fallback quando um filho quebra', () => {
    act(() => {
      root.render(
        <AppErrorBoundary fallback={Fallback}>
          <Boom />
        </AppErrorBoundary>
      );
    });

    expect(container.textContent).toContain('Falha capturada: boom');
  });
});
