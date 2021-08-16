import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

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

async function transfer(nth: number, from: string, to: string, amount: number) {
  return await prisma.$transaction(async (prisma) => {
    console.time("send " + nth)
    const sender = await prisma.account.update({
      data: {
        balance: {
          decrement: amount,
        },
      },
      where: {
        email: from,
      },
    })
    console.timeEnd("send " + nth)
    console.time("throw " + nth)
    if (sender.balance < 0) {
      throw new Error(`${from} doesn't have enough to send ${amount}`)
    }
    console.timeEnd("throw " + nth)
    console.time("recieve " + nth)
    const recipient = prisma.account.update({
      data: {
        balance: {
          increment: amount,
        },
      },
      where: {
        email: to,
      },
    })
    console.timeEnd("recieve " + nth)
    return recipient
  })
}

async function main() {
  await prisma.$connect()
  await unseed()
  await seed()
  console.time("transfer")
  await Promise.all([
    transfer(1, "alice@prisma.io", "bob@prisma.io", 100),
    transfer(2, "alice@prisma.io", "bob@prisma.io", 100),
  ])
  console.timeEnd("transfer")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
