import React, { forwardRef } from 'react';
import NextLink from 'next/link';
import { z } from 'zod';

// Merkle DAG: ui_components -> navigation -> link_component
// Next.js Link wrapper with enhanced features and validation

/**
 * Link component props schema for validation
 */
const LinkPropsSchema = z.object({
	href: z.string().min(1, 'href is required'),
	as: z.string().optional(),
	replace: z.boolean().optional(),
	scroll: z.boolean().optional().default(true),
	shallow: z.boolean().optional(),
	passHref: z.boolean().optional(),
	prefetch: z.boolean().optional().default(true),
	locale: z.string().optional(),
	children: z.any(),
	// Additional props for enhanced functionality
	className: z.string().optional(),
	activeClassName: z.string().optional(),
	isActive: z.function().optional(),
	onClick: z.function().optional(),
});

/**
 * Link component props type
 */
export type LinkProps = z.infer<typeof LinkPropsSchema> & {
	ref?: React.Ref<HTMLAnchorElement>;
};

/**
 * Enhanced Link component similar to Next.js Link with additional features
 *
 * Features:
 * - Next.js Link wrapper with full compatibility
 * - Active link detection
 * - Custom active class support
 * - Enhanced click handling
 * - Type-safe props validation
 *
 * @param props Link component props
 * @param ref Forwarded ref for the anchor element
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
	(
		{
			href,
			as,
			replace,
			scroll = true,
			shallow,
			passHref,
			prefetch = true,
			locale,
			children,
			className,
			activeClassName,
			isActive,
			onClick,
			...rest
		},
		ref
	) => {
		// Validate props at runtime (development only)
		if (process.env.NODE_ENV === 'development') {
			try {
				LinkPropsSchema.omit({ children: true }).parse({
					href,
					as,
					replace,
					scroll,
					shallow,
					passHref,
					prefetch,
					locale,
					className,
					activeClassName,
				});
			} catch (error) {
				console.error('Link component props validation failed:', error);
			}
		}

		// Check if link is active (client-side only)
		const [isActiveLink, setIsActiveLink] = React.useState(false);

		React.useEffect(() => {
			if (typeof window !== 'undefined' && isActive) {
				setIsActiveLink(isActive(window.location.pathname));
			}
		}, [isActive]);

		// Handle click events
		const handleClick = React.useCallback(
			(event: React.MouseEvent<HTMLAnchorElement>) => {
				if (onClick) {
					onClick(event);
				}
			},
			[onClick]
		);

		// Combine class names
		const combinedClassName = React.useMemo(() => {
			const classes = [];
			if (className) classes.push(className);
			if (activeClassName && isActiveLink) classes.push(activeClassName);
			return classes.join(' ') || undefined;
		}, [className, activeClassName, isActiveLink]);

		return (
			<NextLink
				href={href}
				as={as}
				replace={replace}
				scroll={scroll}
				shallow={shallow}
				passHref={true} // Always pass href to child for our enhanced functionality
				prefetch={prefetch}
				locale={locale}
			>
				{React.cloneElement(children as React.ReactElement, {
					ref,
					className: combinedClassName,
					onClick: handleClick,
					...rest,
				})}
			</NextLink>
		);
	}
);

Link.displayName = 'Link';

// Utility function for active link detection
export const createActiveChecker = (href: string) => (pathname: string): boolean => {
	return pathname === href || pathname.startsWith(href + '/');
};

export default Link;
