# CRUD de Parceiros (Convênios) - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. PLANOS DE SAÚDE**

#### **CREATE - Criar Plano de Saúde**
```bash
POST /api/agreements/health-plans
```
**Body:**
```json
{
  "name": "Unimed",
  "planType": "individual",
  "operatorCode": "UNI001",
  "isActive": true
}
```

#### **READ - Listar Planos de Saúde**
```bash
GET /api/agreements/health-plans
```

#### **READ - Buscar Plano por ID**
```bash
GET /api/agreements/health-plans/{id}
```

#### **UPDATE - Atualizar Plano**
```bash
PUT /api/agreements/health-plans/{id}
```
**Body:**
```json
{
  "name": "Unimed Plus",
  "planType": "familiar",
  "operatorCode": "UNI002",
  "isActive": true
}
```

#### **DELETE - Deletar Plano**
```bash
DELETE /api/agreements/health-plans/{id}
```

### **2. CONVÊNIOS**

#### **CREATE - Criar Convênio**
```bash
POST /api/agreements/agreements
```
**Body:**
```json
{
  "healthPlanId": "healthplan123",
  "clientId": "client123",
  "agreementNumber": "CONV001/2024",
  "cardNumber": "1234567890123456",
  "isActive": true
}
```

#### **READ - Listar Convênios**
```bash
GET /api/agreements/agreements
```

#### **READ - Buscar por ID**
```bash
GET /api/agreements/agreements/{id}
```

#### **READ - Buscar Convênios de um Cliente**
```bash
GET /api/agreements/clients/{clientId}/agreements
```

#### **UPDATE - Atualizar Convênio**
```bash
PUT /api/agreements/agreements/{id}
```
**Body:**
```json
{
  "cardNumber": "1234567890123457",
  "isActive": false
}
```

#### **DELETE - Deletar Convênio**
```bash
DELETE /api/agreements/agreements/{id}
```

### **3. DESCONTOS**

#### **CREATE - Criar Desconto**
```bash
POST /api/agreements/agreements/{agreementId}/discounts
```
**Body:**
```json
{
  "serviceId": "service123",
  "packageId": "package123",
  "discountPercentage": 20.00,
  "isActive": true
}
```

#### **READ - Listar Descontos de um Convênio**
```bash
GET /api/agreements/agreements/{agreementId}/discounts
```

#### **UPDATE - Atualizar Desconto**
```bash
PUT /api/agreements/discounts/{id}
```
**Body:**
```json
{
  "discountPercentage": 25.00,
  "isActive": true
}
```

#### **DELETE - Deletar Desconto**
```bash
DELETE /api/agreements/discounts/{id}
```

#### **CALCULAR DESCONTO**
```bash
POST /api/agreements/calculate-discount
```
**Body:**
```json
{
  "agreementId": "agreement123",
  "serviceId": "service123",
  "amount": 150.00
}
```

### **4. LIMITES DE COBERTURA**

#### **CREATE - Criar Limite de Cobertura**
```bash
POST /api/agreements/health-plans/{healthPlanId}/coverage-limits
```
**Body:**
```json
{
  "serviceId": "service123",
  "packageId": "package123",
  "limitAmount": 1000.00,
  "limitType": "MONTHLY",
  "isActive": true
}
```

#### **READ - Listar Limites de Cobertura**
```bash
GET /api/agreements/health-plans/{healthPlanId}/coverage-limits
```

#### **UPDATE - Atualizar Limite**
```bash
PUT /api/agreements/coverage-limits/{id}
```
**Body:**
```json
{
  "limitAmount": 1500.00,
  "limitType": "ANNUAL",
  "isActive": true
}
```

#### **DELETE - Deletar Limite**
```bash
DELETE /api/agreements/coverage-limits/{id}
```

#### **VERIFICAR LIMITE DE COBERTURA**
```bash
POST /api/agreements/check-coverage-limit
```
**Body:**
```json
{
  "agreementId": "agreement123",
  "serviceId": "service123",
  "amount": 200.00
}
```

### **5. PAGAMENTOS COM CONVÊNIOS**

#### **CREATE - Processar Pagamento com Convênio**
```bash
POST /api/agreements/agreements/{agreementId}/payments
```
**Body:**
```json
{
  "paymentId": "payment123",
  "amountCovered": 150.00,
  "amountClient": 50.00,
  "discountApplied": 20.00,
  "isActive": true
}
```

#### **READ - Listar Pagamentos de um Convênio**
```bash
GET /api/agreements/agreements/{agreementId}/payments
```

#### **READ - Buscar Pagamento por ID**
```bash
GET /api/agreements/payments/{id}
```

#### **UPDATE - Atualizar Pagamento**
```bash
PUT /api/agreements/payments/{id}
```
**Body:**
```json
{
  "amountCovered": 160.00,
  "amountClient": 40.00,
  "discountApplied": 25.00
}
```

### **6. PAGAMENTOS GERAIS**

#### **CREATE - Criar Pagamento**
```bash
POST /api/payments
```
**Body:**
```json
{
  "clientId": "client123",
  "serviceId": "service123",
  "amount": 200.00,
  "partnerDiscount": 15.00,
  "clientDiscount": 5.00,
  "paymentMethod": "CREDIT_CARD",
  "paymentStatus": "PENDING",
  "dueDate": "2024-12-31",
  "notes": "Pagamento com desconto de convênio"
}
```

#### **UPDATE - Atualizar Pagamento**
```bash
PUT /api/payments/{id}
```
**Body:**
```json
{
  "partnerDiscount": 20.00,
  "clientDiscount": 10.00,
  "paymentStatus": "COMPLETED",
  "notes": "Desconto atualizado"
}
```

### **7. ALERTAS**

#### **READ - Listar Alertas Ativos**
```bash
GET /api/agreements/alerts
```

#### **READ - Listar Alertas de um Convênio**
```bash
GET /api/agreements/agreements/{agreementId}/alerts
```

#### **UPDATE - Resolver Alerta**
```bash
PUT /api/agreements/alerts/{id}/resolve
```

### **8. INTEGRAÇÃO COM OPERADORAS**

#### **CREATE - Criar Integração**
```bash
POST /api/agreements/health-plans/{healthPlanId}/integrations
```
**Body:**
```json
{
  "integrationType": "API",
  "endpoint": "https://api.unimed.com.br/v1",
  "credentials": {
    "apiKey": "abc123",
    "authorization": "Bearer token123"
  },
  "settings": {
    "timeout": 30000,
    "version": "1.0",
    "retryAttempts": 3,
    "baseUrl": "https://api.unimed.com.br"
  },
  "isActive": true
}
```

#### **READ - Listar Integrações de um Plano**
```bash
GET /api/agreements/health-plans/{healthPlanId}/integrations
```

#### **TEST - Testar Integração**
```bash
POST /api/agreements/integrations/{id}/test
```

#### **UPDATE - Atualizar Integração**
```bash
PUT /api/agreements/integrations/{id}
```
**Body:**
```json
{
  "endpoint": "https://api.unimed.com.br/v2",
  "credentials": {
    "apiKey": "xyz789"
  },
  "settings": {
    "timeout": 45000,
    "version": "2.0"
  }
}
```

#### **DELETE - Deletar Integração**
```bash
DELETE /api/agreements/integrations/{id}
```

### **9. RELATÓRIOS**

#### **Relatório por Plano de Saúde**
```bash
GET /api/agreements/reports/health-plans/{healthPlanId}?startDate=2024-01-01&endDate=2024-12-31
```

#### **Relatório por Cliente**
```bash
GET /api/agreements/reports/clients/{clientId}
```

### **10. UTILITÁRIOS**

#### **Aplicar Desconto Automático**
```bash
POST /api/agreements/apply-discount
```
**Body:**
```json
{
  "clientId": "client123",
  "serviceId": "service123",
  "amount": 200.00
}
```

#### **Verificar Cobertura de Convênio**
```bash
POST /api/agreements/check-coverage
```
**Body:**
```json
{
  "agreementId": "agreement123",
  "serviceId": "service123",
  "amount": 200.00
}
```

## **📊 CAMPOS DOS MODELOS**

### **HealthPlan (Plano de Saúde):**
- `id` - ID único do plano
- `name` - Nome da operadora (ex: Unimed, Amil)
- `planType` - Tipo do plano (individual, familiar, empresarial)
- `operatorCode` - Código da operadora
- `isActive` - Status ativo/inativo
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### **Agreement (Convênio):**
- `id` - ID único do convênio
- `healthPlanId` - ID do plano de saúde
- `clientId` - ID do cliente
- `agreementNumber` - Número do convênio
- `cardNumber` - Número do cartão (opcional)
- `isActive` - Status ativo/inativo
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### **AgreementDiscount (Desconto):**
- `id` - ID único do desconto
- `agreementId` - ID do convênio
- `serviceId` - ID do serviço (opcional)
- `packageId` - ID do pacote (opcional)
- `discountPercentage` - Percentual de desconto (0-100)
- `isActive` - Status ativo/inativo
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### **CoverageLimit (Limite de Cobertura):**
- `id` - ID único do limite
- `healthPlanId` - ID do plano de saúde
- `serviceId` - ID do serviço (opcional)
- `packageId` - ID do pacote (opcional)
- `limitAmount` - Valor limite de cobertura
- `limitType` - Tipo de limite
- `isActive` - Status ativo/inativo
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### **AgreementPayment (Pagamento com Convênio):**
- `id` - ID único do pagamento
- `agreementId` - ID do convênio
- `paymentId` - ID do pagamento
- `amountCovered` - Valor coberto pelo convênio
- `amountClient` - Valor pago pelo cliente
- `discountApplied` - Desconto aplicado
- `isActive` - Status ativo/inativo
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### **Payment (Pagamento Geral):**
- `id` - ID único do pagamento
- `clientId` - ID do cliente
- `appointmentId` - ID do agendamento (opcional)
- `serviceId` - ID do serviço
- `amount` - Valor original do pagamento
- `partnerDiscount` - **Percentual de desconto para o parceiro (0-100)**
- `clientDiscount` - **Percentual de desconto para o cliente (0-100)**
- `finalAmount` - Valor final após descontos
- `currency` - Moeda do pagamento (padrão: BRL)
- `paymentMethod` - Método de pagamento
- `paymentStatus` - Status do pagamento
- `paymentDate` - Data do pagamento
- `dueDate` - Data de vencimento (opcional)
- `notes` - Observações do pagamento (opcional)
- `transactionId` - ID da transação externa (opcional)
- `externalPaymentId` - ID externo do pagamento no gateway (opcional)
- `receiptNumber` - Número do recibo (opcional)
- `refundedAt` - Data do reembolso (opcional)
- `refundAmount` - Valor reembolsado (opcional)
- `createdBy` - ID do usuário que criou
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

### **CoverageAlert (Alerta de Cobertura):**
- `id` - ID único do alerta
- `agreementId` - ID do convênio
- `serviceId` - ID do serviço (opcional)
- `packageId` - ID do pacote (opcional)
- `alertType` - Tipo do alerta
- `message` - Mensagem do alerta
- `isResolved` - Status resolvido
- `resolvedAt` - Data de resolução
- `createdAt` - Data de criação

### **OperatorIntegration (Integração com Operadora):**
- `id` - ID único da integração
- `healthPlanId` - ID do plano de saúde
- `integrationType` - Tipo de integração
- `endpoint` - URL do endpoint (opcional)
- `credentials` - Credenciais criptografadas (opcional)
- `settings` - Configurações da integração (opcional)
- `isActive` - Status ativo/inativo
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

## **📊 ENUMS**

### **LimitType:**
- `PER_SESSION` - Por sessão
- `MONTHLY` - Mensal
- `ANNUAL` - Anual
- `LIFETIME` - Vitalício

### **AlertType:**
- `LIMIT_EXCEEDED` - Limite excedido
- `EXPIRING_SOON` - Expirando em breve
- `INVALID_AGREEMENT` - Convênio inválido
- `COVERAGE_DENIED` - Cobertura negada
- `PAYMENT_DELAYED` - Pagamento atrasado

### **IntegrationType:**
- `API` - Integração via API REST
- `WEBHOOK` - Integração via Webhook
- `EMAIL` - Integração via Email
- `FTP` - Integração via FTP
- `SFTP` - Integração via SFTP

## **⚠️ PERMISSÕES**
- **ADMINISTRADOR, RECEPCIONISTA**: Criar, atualizar, calcular desconto, verificar cobertura, processar pagamentos
- **ADMINISTRADOR**: Deletar, gerenciar integrações, limites de cobertura e descontos
- **Todos**: Visualizar

## **🚀 EXEMPLO RÁPIDO**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# Criar plano de saúde
curl -X POST http://localhost:3000/api/agreements/health-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"name": "Unimed", "planType": "individual", "operatorCode": "UNI001"}'

# Criar convênio
curl -X POST http://localhost:3000/api/agreements/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"healthPlanId": "healthplan123", "clientId": "client123", "agreementNumber": "CONV001/2024"}'

# Listar convênios
curl -X GET "http://localhost:3000/api/agreements/agreements" \
  -H "Authorization: Bearer {token}"

# Calcular desconto
curl -X POST http://localhost:3000/api/agreements/calculate-discount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"agreementId": "agreement123", "serviceId": "service123", "amount": 150.00}'

# Verificar cobertura
curl -X POST http://localhost:3000/api/agreements/check-coverage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"agreementId": "agreement123", "serviceId": "service123", "amount": 200.00}'
```

## **📝 NOTAS IMPORTANTES**

1. **Validações**: Todos os endpoints utilizam validação com `class-validator`
2. **Soft Delete**: Exclusões são feitas marcando registros como inativos
3. **Relacionamentos**: Os modelos possuem relacionamentos complexos que são incluídos nas consultas
4. **Integrações**: Suporte para diferentes tipos de integração com operadoras
5. **Alertas**: Sistema de alertas para monitorar limites e validades
6. **Relatórios**: Geração de relatórios por plano de saúde e por cliente
7. **Descontos**: Sistema flexível de descontos por serviço ou pacote
8. **Limites**: Controle de limites de cobertura por tipo (sessão, mensal, anual, vitalício)
