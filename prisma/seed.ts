import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@primata.com'
    const exists = await prisma.user.findUnique({ where: { email } })

    if (!exists) {
        const passwordHash = await bcrypt.hash('admin123', 12)
        await prisma.user.create({
            data: {
                email,
                name: 'Administrador',
                passwordHash,
                profile: { create: { role: 'ADMIN' } }
            }
        })
        console.log('✅ Admin criado: admin@primata.com / admin123')
    } else {
        console.log('ℹ️ Admin já existe')
    }
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })