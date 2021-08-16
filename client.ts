import { Client } from "pg"
import dotenv from "dotenv"
dotenv.config()

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function unseed(client: Client) {
  await client.query(`delete from "Account" where email in($1, $2)`, [
    "alice@prisma.io",
    "bob@prisma.io",
  ])
}

async function seed(client: Client) {
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
  client: Client,
  nth: number,
  from: string,
  to: string,
  amount: number
) {
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
    console.timeEnd("throw " + nth)
    return
  }
  console.timeEnd("throw " + nth)
  console.time("recieve " + nth)
  const recipient = await client.query(
    `update "Account" set balance = balance + $1 where email = $2 returning *`,
    [amount, to]
  )
  console.timeEnd("recieve " + nth)
  await client.query("commit")
  return recipient.rows[0]
}

async function main() {
  await client.connect()
  await unseed(client)
  await seed(client)
  console.time("transfer")
  await Promise.all([
    transfer(client, 1, "alice@prisma.io", "bob@prisma.io", 100),
    transfer(client, 2, "alice@prisma.io", "bob@prisma.io", 100),
  ])
  console.timeEnd("transfer")
}

main()
  .catch(console.error)
  .finally(() => client.end())
