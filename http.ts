import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
import fetch from "node-fetch"

async function unseed() {
  await prisma.account.deleteMany({
    where: {
      OR: [{ email: "alice@prisma.io" }, { email: "bob@prisma.io" }],
    },
  })
}

async function seed() {
  await prisma.account.create({
    data: {
      email: "alice@prisma.io",
      balance: 100,
    },
  })
  await prisma.account.create({
    data: {
      email: "bob@prisma.io",
      balance: 100,
    },
  })
}

async function startTx(): Promise<string> {
  const res = await fetch("http://localhost:4466/transaction/start", {
    method: "POST",
    body: JSON.stringify({
      max_wait: 5000,
      timeout: 5000,
    }),
  })
  const response = await res.json()
  const tid = response["id"]
  return tid
}

async function commitTx(tid: string) {
  const res = await fetch(`http://localhost:4466/transaction/${tid}/commit`, {
    method: "POST",
  })
  const response = await res.json()
  console.log("commit", response)
}

async function rollbackTx(tid: string) {
  const res = await fetch(`http://localhost:4466/transaction/${tid}/rollback`, {
    method: "POST",
  })
  const response = await res.json()
  console.log("rollback", response)
}

async function updateAlice(tid: string) {
  const graphql = `mutation {
    updateOneAccount(
      data: {
        balance: {
          decrement: 100
        }
      }
      where: {
        email: "alice@prisma.io"
      }
    ) {
      id
      email
      balance
    }
  }`
  const res = await fetch("http://localhost:4466/", {
    method: "POST",
    headers: {
      "X-transaction-id": tid,
    },
    body: JSON.stringify({
      query: graphql,
      variables: {},
    }),
  })
  // console.log(res.status)
  const response = await res.json()
  return response.data.updateOneAccount.balance
}

async function updateBob(tid: string) {
  const graphql = `mutation {
    updateOneAccount(
      data: {
        balance: {
          increment: 100
        }
      }
      where: {
        email: "bob@prisma.io"
      }
    ) {
      id
      email
      balance
    }
  }`
  const res = await fetch("http://localhost:4466/", {
    method: "POST",
    headers: {
      "X-transaction-id": tid,
    },
    body: JSON.stringify({
      query: graphql,
      variables: {},
    }),
  })
  // console.log(res.status)
  const response = await res.json()
  console.log(response)
}

async function transfer() {
  const tid = await startTx()
  console.log(tid)
  const balance = await updateAlice(tid)
  if (balance < 0) {
    await rollbackTx(tid)
    console.log("balance less than 0")
    return
  }
  await updateBob(tid)
  await commitTx(tid)
}

async function main() {
  await prisma.$connect()
  await unseed()
  await seed()
  console.time("transfer")
  await Promise.all([transfer(), transfer()])
  console.timeEnd("transfer")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
