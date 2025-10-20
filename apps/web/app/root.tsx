import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { NavigationProvider } from "@gftdcojp/performer-ui";
import { Link as RemixLink, useLocation } from "@remix-run/react";
import stylesheet from "./tailwind.css?url";

export function links() {
  return [{ rel: "stylesheet", href: stylesheet }];
}

function RemixLinkAdapter({ to, href, ...rest }: any) {
  return <RemixLink to={to ?? href ?? "#"} {...rest} />;
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <NavigationProvider
          Link={RemixLinkAdapter}
          usePathname={() => useLocation().pathname}
        >
          <Outlet />
        </NavigationProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}


