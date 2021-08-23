import { Pool, PoolClient } from "pg"
import dotenv from "dotenv"
dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function unseed(client: PoolClient) {
  await client.query(`delete from "Account" where email in($1, $2)`, [
    "alice@prisma.io",
    "bob@prisma.io",
  ])
}

async function seed(client: PoolClient) {
  await client.query(`insert into "Account" (email, balance) values ($1, $2)`, [
    "alice@prisma.io",
    100,
  ])
  await client.query(`insert into "Account" (email, balance) values ($1, $2)`, [
    "bob@prisma.io",
    100,
  ])
}

async function transfer(
  pool: Pool,
  nth: number,
  from: string,
  to: string,
  amount: number
) {
  const client = await pool.connect()
  await client.query("begin")
  console.time("send " + nth)
  const sender = await client.query(
    `update "Account" set balance = balance - $1 where email = $2 returning *`,
    [amount, from]
  )
  console.timeEnd("send " + nth)
  console.time("throw " + nth)
  if (sender.rows[0].balance < 0) {
    await client.query("rollback")
    client.release()
    console.timeEnd("throw " + nth)
    throw new Error(`${from} doesn't have enough to send ${amount}`)
  }
  console.timeEnd("throw " + nth)
  console.time("recieve " + nth)
  const recipient = await client.query(
    `update "Account" set balance = balance + $1 where email = $2 returning *`,
    [amount, to]
  )
  console.timeEnd("recieve " + nth)
  await client.query("commit")
  client.release()
  return recipient.rows[0]
}

async function main() {
  const client = await pool.connect()
  await unseed(client)
  await seed(client)
  client.release()
  console.time("transfer")
  await Promise.all([
    transfer(pool, 1, "alice@prisma.io", "bob@prisma.io", 100),
    transfer(pool, 2, "alice@prisma.io", "bob@prisma.io", 100),
  ])
  console.timeEnd("transfer")
}

main()
  .catch(console.error)
  .finally(() => pool.end())
