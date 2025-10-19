// Server-side rendering setup
import { createServer } from '@gftdcojp/performer';

export const server = createServer({
  port: process.env.PORT || 3000,
  hostname: process.env.HOSTNAME || 'localhost'
});
