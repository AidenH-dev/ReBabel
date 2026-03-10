/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { useActionTrail } from '../useActionTrail';

let trailRef;
function TestComponent() {
  trailRef = useActionTrail();
  return <button data-testid="test-btn">Click me</button>;
}

describe('useActionTrail', () => {
  beforeEach(() => {
    trailRef = null;
  });

  it('captures click events', () => {
    const { unmount } = render(<TestComponent />);

    act(() => {
      fireEvent.click(document.querySelector('button'));
    });

    expect(trailRef.current).toHaveLength(1);
    expect(trailRef.current[0]).toMatchObject({
      eventType: 'click',
      tag: 'button',
      testId: 'test-btn',
    });
    expect(trailRef.current[0].text).toBe('Click me');
    expect(trailRef.current[0].timestamp).toBeDefined();

    unmount();
  });

  it('captures input events', () => {
    function InputComponent() {
      trailRef = useActionTrail();
      return <input data-testid="name-input" />;
    }

    const { unmount } = render(<InputComponent />);

    act(() => {
      fireEvent.input(document.querySelector('input'), {
        target: { value: 'hello' },
      });
    });

    expect(trailRef.current).toHaveLength(1);
    expect(trailRef.current[0].eventType).toBe('input');
    expect(trailRef.current[0].tag).toBe('input');
    expect(trailRef.current[0].testId).toBe('name-input');

    unmount();
  });

  it('truncates text to 40 chars', () => {
    function LongTextComponent() {
      trailRef = useActionTrail();
      return <button>{'A'.repeat(60)}</button>;
    }

    const { unmount } = render(<LongTextComponent />);

    act(() => {
      fireEvent.click(document.querySelector('button'));
    });

    expect(trailRef.current[0].text).toHaveLength(40);

    unmount();
  });

  it('limits entries to 25', () => {
    const { unmount } = render(<TestComponent />);

    act(() => {
      for (let i = 0; i < 30; i++) {
        fireEvent.click(document.querySelector('button'));
      }
    });

    expect(trailRef.current).toHaveLength(25);

    unmount();
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<TestComponent />);

    // Should have added click and input listeners
    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(addSpy).toHaveBeenCalledWith('input', expect.any(Function), true);

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith('input', expect.any(Function), true);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
