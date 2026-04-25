import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@boxshop.com' }
  })

  if (existingAdmin) {
    console.log('Admin user already exists.')
    return
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin BoxShop',
      email: 'admin@boxshop.com',
      password: hashedPassword,
      role: 'ADMIN',
    }
  })

  console.log(`Created admin user: ${admin.email} / password: admin123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
