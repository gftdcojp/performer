import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const loader = async (_args: LoaderFunctionArgs) => json({ ok: true });

export default function Index() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Performer (Remix)</h1>
      <div className="mt-4">
        <Link to="/orders/123" className="text-blue-600 underline">
          Go to order 123
        </Link>
      </div>
    </main>
  );
}


