import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../src/components/Button';


import { test, expect } from '@jest/globals';

test('renders button with label', () => {
  render(<Button label="Click me" />);
  const buttonElement = screen.getByRole('button');
  expect(buttonElement).toHaveTextContent('Click me');
});