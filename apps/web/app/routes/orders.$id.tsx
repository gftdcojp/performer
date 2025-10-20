import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { router as rpcRouter } from "@gftdcojp/performer-rpc";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id!;
  // Placeholder: fetch order view via RPC or domain use case
  return json({ id, status: "PENDING" });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const id = params.id!;
  const form = await request.formData();
  const intent = form.get("_intent");
  if (intent === "approve") {
    // Integrate with process engine via RPC if needed
    return redirect(`/orders/${id}`);
  }
  return json({ ok: false }, { status: 400 });
};

export default function OrderPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Order {data.id}</h1>
      <p className="mt-2">Status: {data.status}</p>
      <Form method="post" className="mt-4">
        <button name="_intent" value="approve" className="px-3 py-1 bg-blue-600 text-white rounded">
          Approve
        </button>
      </Form>
    </main>
  );
}


