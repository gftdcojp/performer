import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Link, createActiveChecker } from './Link';

// Mock Next.js Link
vi.mock('next/link', () => ({
	default: ({ children, passHref, href, ...props }: any) => {
		// Extract Next.js specific props that shouldn't be passed to DOM
		const { as, replace, scroll, shallow, prefetch, locale, ...domProps } = props;

		// Pass href to child if passHref is true
		const childProps = passHref ? { ...domProps, href } : domProps;

		return React.cloneElement(children, {
			...childProps,
			'data-next-link': true,
		});
	},
}));

describe('Link Component', () => {
	it('renders children correctly', () => {
		render(
			<Link href="/test">
				<a>Test Link</a>
			</Link>
		);

		expect(screen.getByText('Test Link')).toBeInTheDocument();
	});

	it('passes href to child element', () => {
		render(
			<Link href="/test">
				<a>Test Link</a>
			</Link>
		);

		const link = screen.getByText('Test Link');
		expect(link).toHaveAttribute('href', '/test');
	});

	it('applies className correctly', () => {
		render(
			<Link href="/test" className="test-class">
				<a>Test Link</a>
			</Link>
		);

		const link = screen.getByText('Test Link');
		expect(link).toHaveClass('test-class');
	});

	it('applies activeClassName when link is active', () => {
		// Mock window.location.pathname
		const originalLocation = window.location;
		Object.defineProperty(window, 'location', {
			value: { pathname: '/test' },
			writable: true,
		});

		render(
			<Link
				href="/test"
				activeClassName="active"
				isActive={(pathname) => pathname === '/test'}
			>
				<a>Test Link</a>
			</Link>
		);

		const link = screen.getByText('Test Link');
		expect(link).toHaveClass('active');

		// Restore original location
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true,
		});
	});

	it('handles onClick correctly', () => {
		const handleClick = vi.fn();

		render(
			<Link href="/test" onClick={handleClick}>
				<a>Test Link</a>
			</Link>
		);

		const link = screen.getByText('Test Link');
		fireEvent.click(link);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('passes additional props to child element', () => {
		render(
			<Link href="/test" data-testid="custom-link">
				<a>Test Link</a>
			</Link>
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
