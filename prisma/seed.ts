import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    // ===== Service Categories (defaults) =====
    const defaultServiceCategories = [
        { name: 'Tratamentos Faciais', description: 'Categoria para serviços faciais' },
        { name: 'Tratamentos Corporais', description: 'Categoria para serviços corporais' },
        { name: 'Depilação', description: 'Categoria para serviços de depilação' },
        { name: 'Limpeza de Pele', description: 'Categoria para serviços de limpeza de pele' },
        { name: 'Procedimentos Estéticos', description: 'Categoria para procedimentos estéticos' },
        { name: 'Consultas', description: 'Categoria para consultas' },
        { name: 'Manutenção', description: 'Categoria para serviços de manutenção' },
        { name: 'Outros', description: 'Categoria genérica' },
    ]

    // Ensure an admin exists to own createdBy references
    let admin = await prisma.user.findFirst({ where: { profile: { role: Role.ADMINISTRADOR } } })
    if (!admin) {
        const passwordHash = await bcrypt.hash('admin123', 12)
        admin = await prisma.user.create({
            data: {
                email: 'admin@primata.com',
                name: 'Administrador Sistema',
                passwordHash,
                profile: { create: { role: Role.ADMINISTRADOR, phone: '(11) 99999-9999', document: '123.456.789-00' } }
            }
        })
    }

    for (const c of defaultServiceCategories) {
        await (prisma as any).serviceCategory.upsert({
            where: { name: c.name },
            update: {},
            create: { name: c.name, description: c.description, createdBy: admin.id }
        })
    }

    // Set a default category for services without one (after migration)
    const defaultCategory = await (prisma as any).serviceCategory.findFirst({ where: { name: 'Outros' } })
    if (defaultCategory) {
        await (prisma as any).service.updateMany({
            where: { OR: [{ serviceCategoryId: null }, { serviceCategoryId: '' }] },
            data: { serviceCategoryId: defaultCategory.id }
        })
    }

    // Criar usuários de exemplo para cada role
    const users = [
        {
            email: 'admin@primata.com',
            name: 'Administrador Sistema',
            password: 'admin123',
            role: Role.ADMINISTRADOR,
            phone: '(11) 99999-9999',
            document: '123.456.789-00'
        },
        {
            email: 'medico@primata.com',
            name: 'Dr. João Silva',
            password: 'medico123',
            role: Role.MEDICO,
            phone: '(11) 88888-8888',
            document: '987.654.321-00'
        },
        {
            email: 'recepcao@primata.com',
            name: 'Maria Santos',
            password: 'recepcao123',
            role: Role.RECEPCIONISTA,
            phone: '(11) 77777-7777',
            document: '456.789.123-00'
        },
        {
            email: 'servicos@primata.com',
            name: 'Pedro Oliveira',
            password: 'servicos123',
            role: Role.SERVICOS_GERAIS,
            phone: '(11) 66666-6666',
            document: '789.123.456-00'
        }
    ]

    for (const userData of users) {
        const exists = await prisma.user.findUnique({ where: { email: userData.email } })

        if (!exists) {
            const passwordHash = await bcrypt.hash(userData.password, 12)
            await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    passwordHash,
                    profile: { 
                        create: { 
                            role: userData.role,
                            phone: userData.phone,
                            document: userData.document
                        } 
                    }
                }
            })
            console.log(`✅ ${userData.role} criado: ${userData.email} / ${userData.password}`)
        } else {
            console.log(`ℹ️ ${userData.role} já existe: ${userData.email}`)
        }
    }

    console.log('\n🎯 Usuários de teste criados:')
    console.log('👑 Administrador: admin@primata.com / admin123')
    console.log('👨‍⚕️ Médico: medico@primata.com / medico123')
    console.log('👩 Recepcionista: recepcao@primata.com / recepcao123')
    console.log('🔧 Serviços Gerais: servicos@primata.com / servicos123')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })