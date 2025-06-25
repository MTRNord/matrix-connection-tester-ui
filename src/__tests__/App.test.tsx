import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { mutate } from 'swr';

vi.mock('swr', () => ({
    default: vi.fn(),
    mutate: vi.fn(),
}));

vi.mock('../FederationResults', () => ({
    default: vi.fn(({ serverName }) => (
        <div data-testid="federation-results">Federation Results for {serverName}</div>
    )),
}));

vi.mock('../SupportInfo', () => ({
    default: vi.fn(({ serverName }) => (
        <div data-testid="support-info">Support Info for {serverName}</div>
    )),
}));

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset window location
        Object.defineProperty(window, 'location', {
            value: {
                search: '',
                pathname: '/',
                hash: '',
                href: 'http://localhost/',
            },
            writable: true,
        });
        Object.defineProperty(window, 'history', {
            value: {
                replaceState: vi.fn(),
                pushState: vi.fn(),
            },
            writable: true,
        });
    });

    it('renders the main title', () => {
        render(<App />);
        expect(screen.getByText('Matrix Connection Tester')).toBeInTheDocument();
    });

    it('renders the form with input and button', () => {
        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });
        const button = screen.getByRole('button', { name: /test connection/i });

        expect(input).toBeInTheDocument();
        expect(button).toBeInTheDocument();
    });

    it('updates input value when typing', async () => {
        const user = userEvent.setup();
        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });

        await user.type(input, 'matrix.org');

        expect(input).toHaveValue('matrix.org');
    });

    it('submits form and shows results when valid server name is entered', async () => {
        const user = userEvent.setup();
        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });
        const button = screen.getByRole('button', { name: /test connection/i });

        await user.type(input, 'matrix.org');
        await user.click(button);

        await waitFor(() => {
            expect(screen.getByTestId('federation-results')).toBeInTheDocument();
            expect(screen.getByTestId('support-info')).toBeInTheDocument();
        });

        expect(mutate).toHaveBeenCalledWith(['federation', 'matrix.org'], undefined, { revalidate: true });
        expect(mutate).toHaveBeenCalledWith(['support', 'matrix.org'], undefined, { revalidate: true });
    });

    it('does not submit empty form', async () => {
        const user = userEvent.setup();
        render(<App />);

        const button = screen.getByRole('button', { name: /test connection/i });

        await user.click(button);

        expect(screen.queryByTestId('federation-results')).not.toBeInTheDocument();
        expect(mutate).not.toHaveBeenCalled();
    });

    it('trims whitespace from input before submission', async () => {
        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });
        const form = input.closest('form')!;

        // Set input value with whitespace using fireEvent 
        fireEvent.change(input, { target: { value: '  matrix.org  ' } });

        // Verify input has whitespace
        expect(input).toHaveValue('  matrix.org  ');

        // Submit form directly to bypass HTML5 validation
        fireEvent.submit(form);

        // Verify mutate was called with trimmed server name
        expect(mutate).toHaveBeenCalledWith(['federation', 'matrix.org'], undefined, { revalidate: true });
        expect(mutate).toHaveBeenCalledWith(['support', 'matrix.org'], undefined, { revalidate: true });
    });

    it('reads server name from URL parameters on mount', () => {
        Object.defineProperty(window, 'location', {
            value: {
                search: '?serverName=example.com',
                pathname: '/',
                hash: '',
                href: 'http://localhost/?serverName=example.com',
            },
            writable: true,
        });

        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });
        expect(input).toHaveValue('example.com');
        expect(screen.getByTestId('federation-results')).toBeInTheDocument();
    });

    it('updates URL when server name is submitted', async () => {
        const user = userEvent.setup();
        const mockReplaceState = vi.fn();
        Object.defineProperty(window, 'history', {
            value: {
                replaceState: mockReplaceState,
                pushState: vi.fn(),
            },
            writable: true,
        });

        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });
        const button = screen.getByRole('button', { name: /test connection/i });

        await user.type(input, 'matrix.org');
        await user.click(button);

        await waitFor(() => {
            expect(mockReplaceState).toHaveBeenCalledWith({}, '', '/?serverName=matrix.org');
        });
    });

    it('validates input pattern for server names', () => {
        render(<App />);

        const input = screen.getByRole('textbox', { name: /matrix server name/i });

        expect(input).toHaveAttribute('pattern', '^[a-zA-Z0-9.\\-]+(:[0-9]+)?$');
        expect(input).toHaveAttribute('required');
    });
});
