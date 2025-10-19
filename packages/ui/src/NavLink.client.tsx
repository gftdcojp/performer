"use client";

import React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

// Merkle DAG: ui_components -> navigation -> navlink_component

export interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  prefetch?: boolean;
}

/**
 * App Router 専用のナビゲーションリンク。
 * usePathname で現在パスを検出し、activeClassName を付与します。
 */
export function NavLink({
  href,
  className,
  activeClassName,
  exact = false,
  prefetch = true,
  children,
  ...rest
}: NavLinkProps) {
  const pathname = usePathname();

  const isActive = React.useMemo(() => {
    if (!pathname) return false;
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }, [pathname, href, exact]);

  const combined = React.useMemo(() => {
    const classes: string[] = [];
    if (className) classes.push(className);
    if (isActive && activeClassName) classes.push(activeClassName);
    return classes.join(" ") || undefined;
  }, [className, activeClassName, isActive]);

  return (
    <NextLink href={href} prefetch={prefetch} passHref>
      {React.cloneElement(children as React.ReactElement, {
        className: combined,
        ...(isActive ? { "aria-current": "page" } : {}),
        ...rest,
      })}
    </NextLink>
  );
}

export default NavLink;


