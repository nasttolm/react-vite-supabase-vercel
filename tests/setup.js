import { vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual, // Preserves MemoryRouter and other exports
    useNavigate: () => vi.fn(), // Add mocks for specific functions if needed
  };
});