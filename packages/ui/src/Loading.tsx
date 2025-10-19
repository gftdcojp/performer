import React from "react";

// Merkle DAG: ui_components -> feedback -> loading_component

export interface LoadingProps {
  label?: string;
  className?: string;
  spinner?: React.ReactNode;
}

/**
 * loading.tsx で利用する汎用ローディング表示。
 */
export function Loading({ label = "Loading...", className, spinner }: LoadingProps) {
  return (
    <div role="status" aria-live="polite" className={className}>
      {spinner ?? <span aria-hidden>⏳</span>}
      <span>{label}</span>
    </div>
  );
}

export default Loading;


