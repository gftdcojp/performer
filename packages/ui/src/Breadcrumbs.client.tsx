"use client";

import React from "react";
import NextLink from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";

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
  const segments = useSelectedLayoutSegments();

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
            <NextLink href={item.href} prefetch>
              <a {...(idx === items.length - 1 ? { "aria-current": "page" } : undefined)}>{item.label}</a>
            </NextLink>
            {idx < items.length - 1 ? <span aria-hidden>{separator}</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;


