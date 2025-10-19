// Merkle DAG: cli_entry -> command_dispatch -> command_handlers
// CLI entry point with Next.js-style command structure

import { PerformerCLI } from './index.js';

async function main() {
  const cli = new PerformerCLI();
  await cli.run(process.argv);
}

main().catch((error) => {
  console.error('Performer CLI Error:', error.message);
  process.exit(1);
});
