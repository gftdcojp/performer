import React, { forwardRef } from 'react';
import { z } from 'zod';
import { useNavigation } from './navigation';

// Merkle DAG: ui_components -> navigation -> link_component
// Framework-agnostic Link powered by NavigationProvider adapter

/**
 * Link component props schema for validation
 */
const LinkPropsSchema = z.object({
	href: z.string().min(1, 'href is required'),
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
export type LinkProps = z.infer<typeof LinkPropsSchema> & { ref?: React.Ref<HTMLAnchorElement> };

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
			children,
			className,
			activeClassName,
			isActive,
			onClick,
			...rest
		},
		ref
	) => {
		const { Link: Impl, usePathname } = useNavigation();
		// Validate props at runtime (development only)
		if (process.env.NODE_ENV === 'development') {
			try {
				LinkPropsSchema.omit({ children: true }).parse({
					href,
					className,
					activeClassName,
				});
			} catch (error) {
				console.error('Link component props validation failed:', error);
			}
		}

		// Check if link is active (client-side only)
		const [isActiveLink, setIsActiveLink] = React.useState(false);

		const pathname = usePathname();
		React.useEffect(() => {
			if (isActive) {
				setIsActiveLink(Boolean(isActive(pathname)));
			}
		}, [isActive, pathname]);

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
			return classes.join(" ") || undefined;
		}, [className, activeClassName, isActiveLink]);

		return (
			<Impl
				to={href}
				href={href}
				className={combinedClassName}
				onClick={handleClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
				{...rest}
			>
				{children as React.ReactElement}
			</Impl>
		);
	}
);

Link.displayName = 'Link';

// Utility function for active link detection
export const createActiveChecker = (href: string) => (pathname: string): boolean => {
	return pathname === href || pathname.startsWith(`${href}/`);
};

export default Link;
