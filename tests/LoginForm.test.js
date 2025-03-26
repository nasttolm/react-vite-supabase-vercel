import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, describe, expect, beforeEach } from '@jest/globals';
import SignIn from '../src/pages/auth/SignIn';
import { supabase } from '../src/utils/supabase';
import jest from 'jest-mock';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';



// Mock dependencies
jest.mock('../../utils/supabase', () => ({
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  }));
  
  jest.mock('react-router', () => ({
    useNavigate: jest.fn(),
  }));
  
  jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
  }));
  
  jest.mock('../../src/containers/AccountForm', () => {
    return function MockAccountForm({ onSubmit, onFacebookAuth }) {
      return (
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit('test@example.com', 'password123');
            }}
          >
            <input aria-label="Email" defaultValue="test@example.com" />
            <input aria-label="Password" defaultValue="password123" />
            <button type="submit">Sign In</button>
          </form>
          <button onClick={onFacebookAuth}>Facebook Auth</button>
        </div>
      );
    };
  });
  


  describe('SignIn Component', () => {
    const mockNavigate = jest.fn();
  
    beforeEach(() => {
      jest.clearAllMocks();
      useNavigate.mockReturnValue(mockNavigate);
    });
  
    it('renders AccountForm with correct props', () => {
      render(<SignIn />);
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /facebook auth/i })).toBeInTheDocument();
    });
  
    it('navigates to "/" and shows success toast on successful login', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });
      render(<SignIn />);
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(toast.success).toHaveBeenCalledWith('Welcome!');
      });
    });
  
    it('shows error toast on failed login', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });
      render(<SignIn />);
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });
  
    it('shows error toast on sign-in exception', async () => {
      supabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'));
      render(<SignIn />);
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred during sign in');
      });
    });
  
    it('calls signInWithOAuth with Facebook provider on Facebook button click', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
      render(<SignIn />);
      fireEvent.click(screen.getByRole('button', { name: /facebook auth/i }));
      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'facebook' });
      });
    });
  
    it('shows error toast on failed Facebook OAuth', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({ error: { message: 'OAuth error' } });
      render(<SignIn />);
      fireEvent.click(screen.getByRole('button', { name: /facebook auth/i }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('OAuth error');
      });
    });
  
    it('shows error toast on Facebook OAuth exception', async () => {
      supabase.auth.signInWithOAuth.mockRejectedValue(new Error('Network error'));
      render(<SignIn />);
      fireEvent.click(screen.getByRole('button', { name: /facebook auth/i }));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign in with Facebook');
      });
    });
  });