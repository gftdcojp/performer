import React from "react";

// Merkle DAG: ui_components -> feedback -> not_found_component

export interface NotFoundProps {
  title?: string;
  message?: string;
  className?: string;
}

/**
 * not-found.tsx で利用する汎用 404 表示コンポーネント。
 */
export function NotFound({ title = "Not Found", message = "The requested resource could not be found.", className }: NotFoundProps) {
  return (
    <div role="status" className={className}>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

export default NotFound;


