import * as React from "react";

// Merkle DAG: ui_components -> navigation -> provider
// Framework-agnostic navigation provider. Adapters (e.g., Remix) inject Link and location hooks.

export type LinkLikeProps = React.ComponentProps<"a"> & {
	to?: string;
	href?: string;
};

export type LinkLike = React.ComponentType<LinkLikeProps>;

export interface NavigationContextValue {
	Link: LinkLike;
	usePathname: () => string;
	useSegments: () => string[];
}

const NavigationContext = React.createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
	Link,
	children,
	usePathname,
	useSegments,
}: {
	Link: LinkLike;
	usePathname: () => string;
	useSegments?: () => string[];
	children: React.ReactNode;
}) {
	const computeSegments = React.useCallback(() => {
		const pathname = usePathname();
		const parts = pathname.split("/").filter(Boolean);
		return parts;
	}, [usePathname]);

	const value = React.useMemo<NavigationContextValue>(
		() => ({
			Link,
			usePathname,
			useSegments: useSegments ?? computeSegments,
		}),
		[Link, usePathname, useSegments, computeSegments],
	);

	return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
	const ctx = React.useContext(NavigationContext);
	if (!ctx) throw new Error("NavigationProvider is missing in component tree");
	return ctx;
}


