"use client";

import React from "react";
import { useNavigation } from "./navigation";

// Merkle DAG: ui_components -> navigation -> breadcrumbs_component

export interface BreadcrumbsProps {
  baseHref?: string;
  className?: string;
  separator?: React.ReactNode;
  segmentLabel?: (segment: string) => string;
}

/**
 * App Router 専用のパンくず。 layout セグメントから階層を構築します。
 */
export function Breadcrumbs({
  baseHref = "",
  className,
  separator = "/",
  segmentLabel = (s) => s,
}: BreadcrumbsProps) {
  const { useSegments, Link } = useNavigation();
  const segments = useSegments();

  const items = React.useMemo(() => {
    const acc: { href: string; label: string }[] = [];
    let path = baseHref;
    for (const seg of segments) {
      path += `/${seg}`;
      acc.push({ href: path || "/", label: segmentLabel(seg) });
    }
    return acc;
  }, [segments, baseHref, segmentLabel]);

  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol>
        {items.map((item, idx) => (
          <li key={item.href}>
            <Link href={item.href} {...(idx === items.length - 1 ? { "aria-current": "page" } : undefined)}>
              <a href={item.href}>{item.label}</a>
            </Link>
            {idx < items.length - 1 ? <span aria-hidden>{separator}</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;


