import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { router, handleOrpc } from "@gftdcojp/performer-rpc";

export const loader = async ({ request }: LoaderFunctionArgs) => handleOrpc(request);
export const action = async ({ request }: ActionFunctionArgs) => handleOrpc(request);


