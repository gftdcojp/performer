"use client";

import React from "react";

// Merkle DAG: ui_components -> feedback -> error_view_component

export interface ErrorViewProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  actionLabel?: string;
}

/**
 * App Router の error.tsx で利用する汎用エラー表示。
 * reset を onRetry に渡して利用できます。
 */
export function ErrorView({
  title = "Something went wrong",
  message,
  onRetry,
  className,
  actionLabel = "Try again",
  children,
}: React.PropsWithChildren<ErrorViewProps>) {
  return (
    <div role="alert" className={className}>
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
      {children}
      {onRetry ? (
        <button type="button" onClick={onRetry} aria-live="polite">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ErrorView;


