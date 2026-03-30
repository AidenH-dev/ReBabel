/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeSessionModal from '../ResumeSessionModal';

// Mock BaseModal to just render children + footer (avoids portal/animation complexity)
jest.mock('@/components/ui/BaseModal', () => {
  return function MockBaseModal({ isOpen, children, footer }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-modal">
        {children}
        <div data-testid="modal-footer">{footer}</div>
      </div>
    );
  };
});

// Mock Button to render a real button with the variant as data attribute
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

const mockSessionState = {
  entity_id: 'ss_abc123',
  TYPE: 'session_state',
  owner: 'usr_test',
  state_status: 'active',
  session_type: 'quiz',
  is_chunked: 'false',
  chunk_size: '25',
  total_items: '10',
  total_chunks: '1',
  current_chunk_index: '0',
  chunks_completed: '0',
  current_index: '3',
  items_completed: '3',
  stats_correct: '2',
  stats_incorrect: '1',
  stats_attempts: '3',
  created_at: '2026-03-28T10:00:00.000000+00',
  updated_at: '2026-03-28T14:00:00.000000+00',
  quiz_mode: 'completely-new',
};

describe('ResumeSessionModal', () => {
  const defaultProps = {
    isOpen: true,
    sessionState: mockSessionState,
    loadingAction: null,
    onResume: jest.fn(),
    onStartFresh: jest.fn(),
    onCancel: jest.fn(),
  };

  test('1. renders session type label and progress when isOpen', () => {
    render(<ResumeSessionModal {...defaultProps} />);
    expect(screen.getByText('Quiz')).toBeInTheDocument();
    expect(screen.getByText('3 of 10 items')).toBeInTheDocument();
  });

  test('2. shows chunk info when is_chunked=true', () => {
    const chunkedState = {
      ...mockSessionState,
      is_chunked: 'true',
      total_chunks: '3',
      current_chunk_index: '1',
    };
    render(
      <ResumeSessionModal {...defaultProps} sessionState={chunkedState} />
    );
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  test('3. hides chunk info when is_chunked=false', () => {
    render(<ResumeSessionModal {...defaultProps} />);
    expect(screen.queryByText(/Chunk/)).not.toBeInTheDocument();
  });

  test('4. Resume button calls onResume', () => {
    render(<ResumeSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Resume Session'));
    expect(defaultProps.onResume).toHaveBeenCalledTimes(1);
  });

  test('5. Start Fresh button calls onStartFresh', () => {
    render(<ResumeSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Start Fresh'));
    expect(defaultProps.onStartFresh).toHaveBeenCalledTimes(1);
  });

  test('6. Cancel button calls onCancel', () => {
    render(<ResumeSessionModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test('7. all buttons disabled when loadingAction is set', () => {
    render(<ResumeSessionModal {...defaultProps} loadingAction="resume" />);
    expect(screen.getByText('Resume Session').closest('button')).toBeDisabled();
    expect(screen.getByText('Start Fresh').closest('button')).toBeDisabled();
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
  });

  test('8. handles null updated_at gracefully', () => {
    const stateNoDate = { ...mockSessionState, updated_at: null };
    render(<ResumeSessionModal {...defaultProps} sessionState={stateNoDate} />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
