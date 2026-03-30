/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChunkCompletionView from '../ChunkCompletionView';

// Mock useCountUp to return target immediately (no animation in tests)
jest.mock('@/hooks/useCountUp', () => {
  return function mockUseCountUp(target) {
    return target;
  };
});

// Mock Button to render a real button
jest.mock('@/components/ui/Button', () => {
  return function MockButton({
    children,
    onClick,
    disabled,
    variant,
    ...rest
  }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        {...rest}
      >
        {children}
      </button>
    );
  };
});

const defaultProps = {
  chunkNumber: 1,
  totalChunks: 3,
  chunkStats: { correct: 20, incorrect: 5, totalAttempts: 25, accuracy: 80 },
  overallStats: {
    correct: 20,
    incorrect: 5,
    totalAttempts: 25,
    accuracy: 80,
    itemsCompleted: 25,
    totalItems: 60,
  },
  onContinue: jest.fn(),
  onSaveAndExit: jest.fn(),
  isLoading: false,
};

describe('ChunkCompletionView', () => {
  test('1. renders chunk number and total chunks', () => {
    render(<ChunkCompletionView {...defaultProps} />);
    expect(screen.getByText('Chunk 1 of 3 Complete!')).toBeInTheDocument();
  });

  test('2. displays correct/incorrect stats', () => {
    render(<ChunkCompletionView {...defaultProps} />);
    expect(screen.getByText('20')).toBeInTheDocument(); // correct
    expect(screen.getByText('5')).toBeInTheDocument(); // incorrect
  });

  test('3. shows overall progress', () => {
    render(<ChunkCompletionView {...defaultProps} />);
    expect(screen.getByText('25 of 60 items completed')).toBeInTheDocument();
  });

  test('4. Continue button calls onContinue', () => {
    render(<ChunkCompletionView {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue to Next Chunk'));
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  test('5. Exit & Save Progress button calls onSaveAndExit', () => {
    render(<ChunkCompletionView {...defaultProps} />);
    fireEvent.click(screen.getByText('Exit & Save Progress'));
    expect(defaultProps.onSaveAndExit).toHaveBeenCalledTimes(1);
  });

  test('6. buttons disabled when isLoading', () => {
    render(<ChunkCompletionView {...defaultProps} isLoading={true} />);
    expect(
      screen.getByText(/Continue to Next Chunk/).closest('button')
    ).toBeDisabled();
    expect(
      screen.getByText('Exit & Save Progress').closest('button')
    ).toBeDisabled();
  });

  test('7. renders Quick Review section with answered items', () => {
    const items = [
      { question: 'to eat', answer: '食べる', isCorrect: true },
      { question: 'to drink', answer: '飲む', isCorrect: false },
    ];
    render(
      <ChunkCompletionView {...defaultProps} chunkAnsweredItems={items} />
    );
    expect(screen.getByText('Quick Review')).toBeInTheDocument();
    expect(screen.getByText('to eat')).toBeInTheDocument();
    expect(screen.getByText('食べる')).toBeInTheDocument();
    expect(screen.getByText('to drink')).toBeInTheDocument();
    expect(screen.getByText('飲む')).toBeInTheDocument();
  });

  test('8. hides Quick Review when no answered items', () => {
    render(<ChunkCompletionView {...defaultProps} chunkAnsweredItems={[]} />);
    expect(screen.queryByText('Quick Review')).not.toBeInTheDocument();
  });
});
