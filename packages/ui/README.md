# @gftdcojp/performer-ui

UI components library for the Performer BPMN Order Processing Platform.

## Installation

```bash
pnpm add @gftdcojp/performer-ui
```

## Components

### Link

An enhanced Link component that wraps Next.js Link with additional features.

#### Features

- Full Next.js Link compatibility
- Active link detection
- Custom active class support
- Enhanced click handling
- Type-safe props validation

#### Usage

```tsx
import { Link, createActiveChecker } from '@gftdcojp/performer-ui';

function Navigation() {
  const isActive = createActiveChecker('/dashboard');

  return (
    <nav>
      <Link href="/dashboard" activeClassName="active" isActive={isActive}>
        <a>Dashboard</a>
      </Link>
      <Link href="/orders" className="nav-link">
        <a>Orders</a>
      </Link>
    </nav>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | - | The path or URL to navigate to |
| `as` | `string` | - | Optional decorator for the path that will be shown in the browser URL bar |
| `replace` | `boolean` | - | Replace the current history state instead of adding a new url into the stack |
| `scroll` | `boolean` | `true` | Scroll to the top of the page after a navigation |
| `shallow` | `boolean` | - | Update the path of the current page without rerunning getStaticProps, getServerSideProps or getInitialProps |
| `passHref` | `boolean` | - | Forces Link to send the href property to its child |
| `prefetch` | `boolean` | `true` | Prefetch the page in the background |
| `locale` | `string` | - | The active locale is automatically prepended |
| `className` | `string` | - | CSS class name for the link |
| `activeClassName` | `string` | - | CSS class name applied when link is active |
| `isActive` | `(pathname: string) => boolean` | - | Function to determine if link is active |
| `onClick` | `(event: MouseEvent) => void` | - | Click event handler |

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build

# Development mode
pnpm dev
```

## License

MIT
