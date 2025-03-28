import { vi, it, describe } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignIn from '../src/pages/auth/SignIn'; // Adjust path

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock supabase
const supabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
};
vi.mock('../../utils/supabase', () => ({
  default: supabase,
}));

describe('SignIn Component', () => {
  it('renders sign in form correctly', () => {
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );
    // Add assertions
  });

  it('handles successful sign in', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: '123' } },
    });
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );
    // Add assertions
  });

  it('handles Facebook sign in', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );
    // Add assertions
  });
});