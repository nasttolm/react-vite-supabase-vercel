import { vi, expect, describe, it, beforeEach } from 'vitest';
import '@testing-library/jest-dom'; // Import this to enable toBeInTheDocument

// Mock supabase with the correct path
import supabase from '../src/utils/supabase'; // Import the mocked supabase object
vi.mock('../src/utils/supabase', () => ({
  default: {
    auth: {
      signUp: vi.fn(),          // Mock signUp as a function
      signInWithOAuth: vi.fn(), // Mock signInWithOAuth as a function
    },
  },
}));

// Import testing utilities and dependencies
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import SignUp from '../src/pages/auth/SignUp'; // Adjust path based on your structure

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test suite
describe('SignUp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mock call history between tests
  });

  it('renders sign-up form correctly', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('handles successful sign-up with email and password', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { identities: [{ id: 'some-id' }] } },
      error: null,
    });

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(toast.success).toHaveBeenCalledWith('Welcome! Please check your inbox to confirm your account.');
      expect(mockNavigate).toHaveBeenCalledWith('/create-profile');
    });
  });


});