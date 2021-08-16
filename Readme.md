# Interactive Transaction Example

We're building an online banking system. One of the actions we want to perform is to send money from one person to another person.

As experienced developers, we want to make sure that during the transfer:

1. the amount doesn't disappear
2. the amount isn't doubled

This sounds like the perfect job for interactive transactions.

## Example

In the examples below, Alice and Bob each have $100 in their accounts. If you try to send more money than you have, the transfer is rejected.

Alice, being the mischeivous type, opens up the transfer page on 2 web browsers. She enters $100 on both pages and clicks the transfer button twice.

We'd expect Alice to be able to make 1 transfer for $100 and the other transfer would be rejected. This would result in Alice having $0 and Bob having $200.

I've created 3 examples to test how Prisma and [node-postgres](https://github.com/brianc/node-postgres) handle this behavior.

1. `prisma.ts`: Transfer with the Prisma Client.
1. `client.ts`: Transfer with one active connection to Postgres.
1. `pool.ts`: Transfer with two active connections to Postgres.

## Run

1. npm install
2. npx ts-node prisma.ts
3. npx ts-node client.ts
4. npx ts-node pool.ts
