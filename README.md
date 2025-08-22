# Primata Estética API

Sistema completo de gestão para clínica estética desenvolvido em NestJS com PostgreSQL, incluindo controle de clientes, agendamentos, pagamentos, estoque, relatórios, segurança e integrações externas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Módulos](#módulos)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Endpoints da API](#endpoints-da-api)
- [Validações](#validações)
- [Respostas](#respostas)
- [Segurança](#segurança)
- [Integrações](#integrações)
- [Deploy](#deploy)

## 🎯 Visão Geral

A API Primata Estética é um sistema completo de gestão para clínicas estéticas que oferece:

- **Gestão de Clientes**: Cadastro completo com histórico médico e preferências
- **Agendamento**: Sistema de agendamentos com lembretes automáticos
- **Pagamentos**: Controle financeiro com múltiplos métodos de pagamento
- **Estoque**: Gestão de produtos e controle de inventário
- **Relatórios**: Análises financeiras e operacionais
- **Segurança**: Controle de acesso baseado em roles (RBAC)
- **Convênios**: Gestão de planos de saúde e descontos
- **Integrações**: Conexão com sistemas externos (pagamentos, CRM, contabilidade)

## 🛠 Tecnologias

- **Backend**: NestJS 11.x
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT com Passport
- **Validação**: class-validator
- **Documentação**: Swagger/OpenAPI
- **Segurança**: bcrypt, criptografia AES-256-GCM
- **Integrações**: HTTP Client (@nestjs/axios)
- **Monitoramento**: Logs estruturados e auditoria

## 📁 Estrutura do Projeto

```
src/
├── auth/                    # Autenticação e autorização
├── clients/                 # Módulo 1: Gestão de Clientes
├── professionals/           # Módulo 2: Gestão de Profissionais
├── services/               # Módulo 3: Gestão de Serviços
├── appointments/           # Módulo 4: Agendamento de Consultas
├── payments/               # Módulo 5: Controle de Pagamentos
├── stock/                  # Módulo 6: Gestão de Estoque
├── reports/                # Módulo 7: Relatórios
├── security/               # Módulo 8: Segurança e Controle de Acesso
├── external-integration/   # Módulo 9: Integração com Sistemas Externos
├── agreements/             # Módulo 10: Gestão de Convênios e Descontos
├── common/                 # Utilitários compartilhados
├── prisma/                 # Configuração do banco de dados
└── main.ts                 # Ponto de entrada da aplicação
```

## ⚙️ Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd primata-estetica-api
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/primata_estetica"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Security
ENCRYPTION_KEY="your-32-character-encryption-key"
```

4. **Configure o banco de dados**
```bash
npx prisma generate
npx prisma db push
```

5. **Execute o projeto**
```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

### Scripts Disponíveis

- `npm run start:dev` - Executa em modo desenvolvimento com hot reload
- `npm run build` - Compila o projeto
- `npm run start:prod` - Executa em modo produção
- `npm run test` - Executa os testes
- `npm run lint` - Executa o linter
- `npm run format` - Formata o código

## 🏗 Módulos

### Módulo 1: Gestão de Clientes
Gerencia o cadastro completo de clientes com histórico médico, preferências e dados pessoais.

**Funcionalidades:**
- Cadastro completo de clientes
- Histórico médico e tratamentos
- Preferências e contraindicações
- Busca e filtros avançados
- Soft delete

### Módulo 2: Gestão de Profissionais
Controla os profissionais da clínica, suas especialidades e horários.

**Funcionalidades:**
- Cadastro de profissionais
- Especialidades e licenças
- Horários de trabalho
- Comissões

### Módulo 3: Gestão de Serviços
Gerencia os serviços oferecidos pela clínica.

**Funcionalidades:**
- Cadastro de serviços
- Pacotes e promoções
- Preços e duração
- Categorização

### Módulo 4: Agendamento de Consultas
Sistema completo de agendamentos com lembretes.

**Funcionalidades:**
- Agendamento de consultas
- Confirmações automáticas
- Lembretes por email/SMS
- Status de agendamento

### Módulo 5: Controle de Pagamentos
Gestão financeira completa da clínica.

**Funcionalidades:**
- Múltiplos métodos de pagamento
- Controle de comissões
- Recibos e faturas
- Status de pagamento

### Módulo 6: Gestão de Estoque
Controle de produtos e inventário.

**Funcionalidades:**
- Cadastro de produtos
- Controle de estoque
- Alertas de estoque baixo
- Movimentações

### Módulo 7: Relatórios
Análises e relatórios da clínica.

**Funcionalidades:**
- Relatórios financeiros
- Relatórios de atendimento
- Análises de performance
- Exportação de dados

### Módulo 8: Segurança e Controle de Acesso
Sistema de segurança robusto com RBAC.

**Funcionalidades:**
- Autenticação JWT
- Controle de acesso baseado em roles
- Auditoria completa
- Criptografia de dados sensíveis
- Logs de segurança

### Módulo 9: Integração com Sistemas Externos
Conexão com sistemas de terceiros.

**Funcionalidades:**
- Integração com gateways de pagamento
- Sincronização com CRM
- Exportação para sistemas contábeis
- Webhooks

### Módulo 10: Gestão de Convênios e Descontos
Gestão de planos de saúde e descontos.

**Funcionalidades:**
- Cadastro de operadoras
- Convênios por cliente
- Descontos personalizados
- Limites de cobertura
- Integração com operadoras

## 🔐 Autenticação e Autorização

### Roles (Perfis de Usuário)

- **ADMINISTRADOR**: Acesso total ao sistema
- **MEDICO**: Acesso aos históricos médicos e registros
- **RECEPCIONISTA**: Atendimento inicial e agendamentos
- **SERVICOS_GERAIS**: Manutenção e organização

### Fluxo de Autenticação

1. **Login**: `POST /auth/login`
2. **Refresh Token**: `POST /auth/refresh`
3. **Logout**: `POST /auth/logout`

### Headers Necessários

```http
Authorization: Bearer <jwt-token>
```

## 📡 Endpoints da API

### Autenticação

#### POST /auth/login
**Descrição**: Realiza login do usuário

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "ADMINISTRADOR"
  }
}
```

#### POST /auth/refresh
**Descrição**: Renova o token de acesso

**Headers:**
```http
Authorization: Bearer <refresh-token>
```

**Resposta:**
```json
{
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

#### POST /auth/logout
**Descrição**: Realiza logout do usuário

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

### Clientes

#### POST /clients
**Descrição**: Cria um novo cliente

**Permissões**: ADMINISTRADOR, RECEPCIONISTA

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-01-01",
  "gender": "MALE",
  "document": "123.456.789-00",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "emergencyContact": "Maria Silva",
  "emergencyPhone": "(11) 88888-8888",
  "notes": "Observações importantes"
}
```

**Resposta:**
```json
{
  "id": "client-id",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-01-01T00:00:00.000Z",
  "gender": "MALE",
  "document": "123.456.789-00",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "emergencyContact": "Maria Silva",
  "emergencyPhone": "(11) 88888-8888",
  "notes": "Observações importantes",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### GET /clients
**Descrição**: Lista clientes com filtros e paginação

**Permissões**: ADMINISTRADOR, MEDICO, RECEPCIONISTA

**Query Parameters:**
- `page` (number): Página atual (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)
- `search` (string): Busca por nome, email, telefone ou documento
- `gender` (enum): Filtrar por gênero (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
- `isActive` (boolean): Filtrar por status ativo
- `sortBy` (string): Campo para ordenação
- `sortOrder` (enum): Direção da ordenação (asc, desc)

**Resposta:**
```json
{
  "data": [
    {
      "id": "client-id",
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "(11) 99999-9999",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### GET /clients/:id
**Descrição**: Busca cliente por ID

**Permissões**: ADMINISTRADOR, MEDICO, RECEPCIONISTA

**Resposta:**
```json
{
  "id": "client-id",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-01-01T00:00:00.000Z",
  "gender": "MALE",
  "document": "123.456.789-00",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "emergencyContact": "Maria Silva",
  "emergencyPhone": "(11) 88888-8888",
  "notes": "Observações importantes",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "preferences": {
    "skinType": "NORMAL",
    "allergies": "Nenhuma",
    "medications": "Nenhum",
    "contraindications": "Nenhuma",
    "goals": "Rejuvenescimento",
    "budget": "MEDIUM",
    "preferredTime": "MORNING"
  },
  "appointments": [
    {
      "id": "appointment-id",
      "scheduledDate": "2024-01-15T10:00:00.000Z",
      "status": "CONFIRMED",
      "service": {
        "name": "Limpeza de Pele",
        "currentPrice": 150.00
      }
    }
  ]
}
```

#### PUT /clients/:id
**Descrição**: Atualiza dados do cliente

**Permissões**: ADMINISTRADOR, MEDICO, RECEPCIONISTA

**Body:** (mesmo formato do POST, mas campos opcionais)

#### DELETE /clients/:id
**Descrição**: Remove cliente (soft delete)

**Permissões**: ADMINISTRADOR

### Agendamentos

#### POST /appointments
**Descrição**: Cria um novo agendamento

**Permissões**: ADMINISTRADOR, RECEPCIONISTA

**Body:**
```json
{
  "clientId": "client-id",
  "professionalId": "professional-id",
  "serviceId": "service-id",
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "duration": 60,
  "appointmentType": "CONSULTATION",
  "priority": "NORMAL",
  "notes": "Primeira consulta"
}
```

**Resposta:**
```json
{
  "id": "appointment-id",
  "clientId": "client-id",
  "professionalId": "professional-id",
  "serviceId": "service-id",
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "duration": 60,
  "status": "SCHEDULED",
  "appointmentType": "CONSULTATION",
  "priority": "NORMAL",
  "notes": "Primeira consulta",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "client": {
    "name": "João Silva",
    "phone": "(11) 99999-9999"
  },
  "professional": {
    "name": "Dr. Maria Santos",
    "specialty": "Dermatologia"
  },
  "service": {
    "name": "Limpeza de Pele",
    "currentPrice": 150.00
  }
}
```

#### GET /appointments
**Descrição**: Lista agendamentos com filtros

**Query Parameters:**
- `page` (number): Página atual
- `limit` (number): Itens por página
- `startDate` (string): Data inicial (YYYY-MM-DD)
- `endDate` (string): Data final (YYYY-MM-DD)
- `status` (enum): Status do agendamento
- `clientId` (string): ID do cliente
- `professionalId` (string): ID do profissional
- `serviceId` (string): ID do serviço

#### PUT /appointments/:id
**Descrição**: Atualiza agendamento

#### DELETE /appointments/:id
**Descrição**: Cancela agendamento

### Pagamentos

#### POST /payments
**Descrição**: Cria um novo pagamento

**Permissões**: ADMINISTRADOR, RECEPCIONISTA

**Body:**
```json
{
  "clientId": "client-id",
  "appointmentId": "appointment-id",
  "serviceId": "service-id",
  "amount": 150.00,
  "discountAmount": 0.00,
  "finalAmount": 150.00,
  "paymentMethod": "CREDIT_CARD",
  "paymentDate": "2024-01-15T10:00:00.000Z",
  "notes": "Pagamento realizado"
}
```

**Resposta:**
```json
{
  "id": "payment-id",
  "clientId": "client-id",
  "appointmentId": "appointment-id",
  "serviceId": "service-id",
  "amount": 150.00,
  "discountAmount": 0.00,
  "finalAmount": 150.00,
  "paymentMethod": "CREDIT_CARD",
  "paymentStatus": "PAID",
  "paymentDate": "2024-01-15T10:00:00.000Z",
  "transactionId": "txn_123456",
  "receiptNumber": "REC001",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "client": {
    "name": "João Silva"
  },
  "service": {
    "name": "Limpeza de Pele"
  }
}
```

#### GET /payments
**Descrição**: Lista pagamentos com filtros

**Query Parameters:**
- `page` (number): Página atual
- `limit` (number): Itens por página
- `startDate` (string): Data inicial
- `endDate` (string): Data final
- `paymentStatus` (enum): Status do pagamento
- `paymentMethod` (enum): Método de pagamento
- `clientId` (string): ID do cliente

### Serviços

#### POST /services
**Descrição**: Cria um novo serviço

**Permissões**: ADMINISTRADOR

**Body:**
```json
{
  "name": "Limpeza de Pele",
  "description": "Limpeza profunda da pele",
  "category": "FACIAL_TREATMENT",
  "duration": 60,
  "basePrice": 150.00,
  "currentPrice": 150.00,
  "requiresProfessional": true,
  "maxConcurrentClients": 1,
  "preparationTime": 15,
  "recoveryTime": 30,
  "contraindications": "Pele muito sensível",
  "benefits": "Pele mais limpa e saudável"
}
```

#### GET /services
**Descrição**: Lista serviços

#### PUT /services/:id
**Descrição**: Atualiza serviço

#### DELETE /services/:id
**Descrição**: Remove serviço

### Profissionais

#### POST /professionals
**Descrição**: Cria um novo profissional

**Permissões**: ADMINISTRADOR

**Body:**
```json
{
  "name": "Dr. Maria Santos",
  "email": "maria@clinic.com",
  "phone": "(11) 88888-8888",
  "document": "123.456.789-00",
  "specialty": "Dermatologia",
  "license": "CRM12345",
  "birthDate": "1985-05-15",
  "gender": "FEMALE",
  "address": "Rua dos Médicos, 456",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "hireDate": "2023-01-01",
  "salary": 5000.00
}
```

#### GET /professionals
**Descrição**: Lista profissionais

#### PUT /professionals/:id
**Descrição**: Atualiza profissional

#### DELETE /professionals/:id
**Descrição**: Remove profissional

### Estoque

#### POST /products
**Descrição**: Cria um novo produto

**Permissões**: ADMINISTRADOR

**Body:**
```json
{
  "name": "Protetor Solar FPS 50",
  "description": "Protetor solar para uso diário",
  "categoryId": "category-id",
  "supplierId": "supplier-id",
  "sku": "PSF50-001",
  "barcode": "7891234567890",
  "unit": "BOTTLE",
  "currentStock": 100,
  "minStock": 10,
  "maxStock": 200,
  "costPrice": 25.00,
  "salePrice": 45.00,
  "requiresPrescription": false,
  "expirationDate": "2025-12-31",
  "location": "Prateleira A1"
}
```

#### GET /products
**Descrição**: Lista produtos

#### PUT /products/:id
**Descrição**: Atualiza produto

#### DELETE /products/:id
**Descrição**: Remove produto

### Relatórios

#### GET /reports/financial
**Descrição**: Relatório financeiro

**Query Parameters:**
- `startDate` (string): Data inicial
- `endDate` (string): Data final
- `format` (enum): Formato do relatório (json, csv, pdf)

#### GET /reports/appointments
**Descrição**: Relatório de agendamentos

#### GET /reports/clients
**Descrição**: Relatório de clientes

#### GET /reports/stock
**Descrição**: Relatório de estoque

### Segurança

#### GET /security/audit-logs
**Descrição**: Logs de auditoria

**Permissões**: ADMINISTRADOR

#### GET /security/security-events
**Descrição**: Eventos de segurança

**Permissões**: ADMINISTRADOR

#### POST /security/backup
**Descrição**: Cria backup do banco

**Permissões**: ADMINISTRADOR

#### POST /security/restore
**Descrição**: Restaura backup

**Permissões**: ADMINISTRADOR

### Convênios

#### POST /agreements/health-plans
**Descrição**: Cria plano de saúde

**Permissões**: ADMINISTRADOR

**Body:**
```json
{
  "name": "Unimed",
  "planType": "individual",
  "operatorCode": "UNI001"
}
```

#### POST /agreements
**Descrição**: Cria convênio para cliente

**Permissões**: ADMINISTRADOR, RECEPCIONISTA

**Body:**
```json
{
  "healthPlanId": "health-plan-id",
  "clientId": "client-id",
  "agreementNumber": "123456789",
  "cardNumber": "1234567890123456",
  "validity": "2025-12-31T23:59:59.000Z"
}
```

#### POST /agreements/discounts
**Descrição**: Cria desconto para convênio

**Permissões**: ADMINISTRADOR

**Body:**
```json
{
  "agreementId": "agreement-id",
  "serviceId": "service-id",
  "discountPercentage": 20.00
}
```

#### GET /agreements/calculate-discount
**Descrição**: Calcula desconto para serviço

**Query Parameters:**
- `agreementId` (string): ID do convênio
- `serviceId` (string): ID do serviço
- `amount` (number): Valor do serviço

### Integrações Externas

#### POST /external-integration/payments/process
**Descrição**: Processa pagamento externo

**Permissões**: ADMINISTRADOR, RECEPCIONISTA

#### POST /external-integration/accounting/export
**Descrição**: Exporta dados para contabilidade

**Permissões**: ADMINISTRADOR

#### POST /external-integration/crm/sync
**Descrição**: Sincroniza com CRM

**Permissões**: ADMINISTRADOR

#### POST /external-integration/webhooks/send
**Descrição**: Envia webhook

**Permissões**: ADMINISTRADOR

## ✅ Validações

### Validações Gerais

Todos os endpoints utilizam validação com `class-validator`:

- **@IsString()**: Valida strings
- **@IsEmail()**: Valida formato de email
- **@IsNumber()**: Valida números
- **@IsDateString()**: Valida datas
- **@IsEnum()**: Valida enums
- **@IsOptional()**: Campo opcional
- **@IsBoolean()**: Valida booleanos
- **@IsUUID()**: Valida UUIDs

### Validações Específicas

#### Clientes
- Email único (se fornecido)
- CPF único (se fornecido)
- Telefone obrigatório
- Data de nascimento válida

#### Agendamentos
- Cliente deve existir
- Profissional deve existir
- Serviço deve existir
- Data/hora não pode ser no passado
- Não pode conflitar com outros agendamentos

#### Pagamentos
- Cliente deve existir
- Valor deve ser positivo
- Método de pagamento válido
- Status válido

#### Convênios
- Plano de saúde deve existir
- Cliente deve existir
- Número do convênio único
- Data de validade no futuro

## 📤 Respostas

### Formato Padrão de Resposta

```json
{
  "success": true,
  "data": {
    // Dados da resposta
  },
  "message": "Operação realizada com sucesso",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Respostas de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email deve ser válido"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado
- **403**: Acesso negado
- **404**: Não encontrado
- **409**: Conflito (dados duplicados)
- **500**: Erro interno do servidor

### Paginação

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔒 Segurança

### Autenticação JWT

- **Access Token**: 15 minutos
- **Refresh Token**: 7 dias
- **Algoritmo**: HS256

### Criptografia

- **Senhas**: bcrypt (salt rounds: 12)
- **Dados Sensíveis**: AES-256-GCM
- **Chaves**: RSA 2048 bits

### Controle de Acesso (RBAC)

```typescript
// Exemplo de uso
@Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
@RequirePermission('clients', 'create')
@UseGuards(RolePermissionGuard)
```

### Auditoria

- Logs de todas as operações
- Rastreamento de IP e User Agent
- Histórico de alterações
- Eventos de segurança

### Rate Limiting

- 100 requests por minuto por IP
- 1000 requests por hora por usuário

### Headers de Segurança

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🔗 Integrações

### Gateways de Pagamento

- **Stripe**: Cartões de crédito/débito
- **MercadoPago**: PIX e cartões
- **PayPal**: Pagamentos internacionais

### Sistemas Contábeis

- **Sage**: Exportação de relatórios
- **QuickBooks**: Sincronização de dados
- **Xero**: Integração financeira

### CRM

- **HubSpot**: Sincronização de contatos
- **Salesforce**: Gestão de leads
- **Pipedrive**: Pipeline de vendas
- **Zoho**: CRM completo

### Webhooks

- **Eventos**: Pagamentos, agendamentos, clientes
- **Formato**: JSON
- **Autenticação**: HMAC-SHA256
- **Retry**: 3 tentativas com backoff exponencial

## 🚀 Deploy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/primata_estetica
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=primata_estetica
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Variáveis de Ambiente de Produção

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/primata_estetica"

# JWT
JWT_SECRET="super-secret-production-key"
JWT_REFRESH_SECRET="super-secret-refresh-production-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Security
ENCRYPTION_KEY="32-character-production-encryption-key"

# External Services
STRIPE_SECRET_KEY="sk_test_..."
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."

# Monitoring
LOG_LEVEL="info"
NODE_ENV="production"
```

## 📚 Documentação Adicional

- **Swagger UI**: `http://localhost:3000/api` (desenvolvimento)
- **Prisma Studio**: `npx prisma studio` (visualização do banco)
- **Logs**: Estruturados em JSON para fácil parsing

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@primataestetica.com ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para clínicas estéticas**
