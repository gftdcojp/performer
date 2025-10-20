import type { ReactNode, ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Link, createActiveChecker } from './Link';
import { NavigationProvider } from './navigation';

function MockLink({ to, href, children, ...rest }: { to?: string; href?: string; children: ReactNode }) {
    // Render a simple anchor; prefer href attr
    const finalHref = typeof href === 'string' ? href : typeof to === 'string' ? to : '#';
    return (
        <a href={finalHref} {...rest}>
            {children as ReactElement}
        </a>
    );
}

describe('Link Component', () => {
	it('renders children correctly', () => {
        render(
            <NavigationProvider Link={MockLink} usePathname={() => '/'}>
                <Link href="/test">
                    <a href="/test">Test Link</a>
                </Link>
            </NavigationProvider>
        );

		expect(screen.getByText('Test Link')).toBeInTheDocument();
	});

	it('passes href to child element', () => {
        render(
            <NavigationProvider Link={MockLink} usePathname={() => '/'}>
                <Link href="/test">
                    <a href="/test">Test Link</a>
                </Link>
            </NavigationProvider>
        );

		const link = screen.getByText('Test Link');
		expect(link).toHaveAttribute('href', '/test');
	});

	it('applies className correctly', () => {
        render(
            <NavigationProvider Link={MockLink} usePathname={() => '/'}>
                <Link href="/test" className="test-class">
                    <a href="/test">Test Link</a>
                </Link>
            </NavigationProvider>
        );

		const link = screen.getByText('Test Link');
		expect(link).toHaveClass('test-class');
	});

	it('applies activeClassName when link is active', () => {
        render(
            <NavigationProvider Link={MockLink} usePathname={() => '/test'}>
                <Link
                    href="/test"
                    activeClassName="active"
                    isActive={(pathname) => pathname === '/test'}
                >
                    <a href="/test">Test Link</a>
                </Link>
            </NavigationProvider>
        );

		const link = screen.getByText('Test Link');
		expect(link).toHaveClass('active');

        // no-op
	});

	it('handles onClick correctly', () => {
		const handleClick = vi.fn();

        render(
            <NavigationProvider Link={MockLink} usePathname={() => '/'}>
                <Link href="/test" onClick={handleClick}>
                    <a href="/test">Test Link</a>
                </Link>
            </NavigationProvider>
        );

		const link = screen.getByText('Test Link');
		fireEvent.click(link);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('passes additional props to child element', () => {
        render(
            <NavigationProvider Link={MockLink} usePathname={() => '/'}>
                <Link href="/test" data-testid="custom-link">
                    <a href="/test">Test Link</a>
                </Link>
            </NavigationProvider>
        );

		const link = screen.getByTestId('custom-link');
		expect(link).toBeInTheDocument();
	});
});

describe('createActiveChecker', () => {
	it('returns true for exact match', () => {
		const checker = createActiveChecker('/test');
		expect(checker('/test')).toBe(true);
	});

	it('returns true for path starting with href + /', () => {
		const checker = createActiveChecker('/test');
		expect(checker('/test/page')).toBe(true);
	});

	it('returns false for non-matching path', () => {
		const checker = createActiveChecker('/test');
		expect(checker('/other')).toBe(false);
	});
});
