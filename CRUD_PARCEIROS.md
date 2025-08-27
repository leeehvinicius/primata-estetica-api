# CRUD Completo de Parceiros - Primata Estética API

## **🔐 AUTENTICAÇÃO NECESSÁRIA**

**IMPORTANTE:** Todos os endpoints requerem autenticação JWT. Use o token recebido no login:

```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS DISPONÍVEIS**

### **1. PLANOS DE SAÚDE - Gestão de Operadoras**
### **2. CONVÊNIOS - Gestão de Convênios dos Clientes**
### **3. DESCONTOS - Gestão de Descontos por Convênio**
### **4. LIMITES DE COBERTURA - Controle de Limites**
### **5. INTEGRAÇÕES - Conexão com Operadoras**
### **6. PAGAMENTOS - Processamento de Pagamentos**
### **7. ALERTAS - Monitoramento de Cobertura**
### **8. RELATÓRIOS - Análises e Estatísticas**

---

## **1. 🏥 PLANOS DE SAÚDE - Gestão de Operadoras**

### **1.1 CREATE - Criar Plano de Saúde**

#### **Endpoint:** `POST /api/agreements/health-plans`

#### **Permissões:** `ADMINISTRADOR`

#### **Body (JSON):**
```json
{
  "name": "Unimed São Paulo",
  "planType": "INDIVIDUAL",
  "operatorCode": "UNIMED001",
  "isActive": true
}
```

#### **CURL:**
```bash
curl -X POST http://localhost:3000/api/agreements/health-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "name": "Unimed São Paulo",
    "planType": "INDIVIDUAL",
    "operatorCode": "UNIMED001",
    "isActive": true
  }'
```

#### **Resposta de Sucesso (201):**
```json
{
  "id": "healthplan123",
  "name": "Unimed São Paulo",
  "planType": "INDIVIDUAL",
  "operatorCode": "UNIMED001",
  "isActive": true,
  "createdAt": "2024-12-20T10:00:00.000Z",
  "updatedAt": "2024-12-20T10:00:00.000Z"
}
```

### **1.2 READ - Listar Planos de Saúde**

#### **Endpoint:** `GET /api/agreements/health-plans`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/health-plans" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **1.3 READ - Buscar Plano por ID**

#### **Endpoint:** `GET /api/agreements/health-plans/{id}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/health-plans/healthplan123" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **1.4 UPDATE - Atualizar Plano de Saúde**

#### **Endpoint:** `PUT /api/agreements/health-plans/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/health-plans/healthplan123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "name": "Unimed São Paulo - Premium",
    "planType": "FAMILIAR"
  }'
```

### **1.5 DELETE - Deletar Plano de Saúde**

#### **Endpoint:** `DELETE /api/agreements/health-plans/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X DELETE "http://localhost:3000/api/agreements/health-plans/healthplan123" \
  -H "Authorization: Bearer {seu_access_token}"
```

---

## **2. 🤝 CONVÊNIOS - Gestão de Convênios dos Clientes**

### **2.1 CREATE - Criar Convênio para Cliente**

#### **Endpoint:** `POST /api/agreements/agreements`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "healthPlanId": "healthplan123",
  "clientId": "client123",
  "agreementNumber": "CONV001/2024",
  "cardNumber": "1234567890123456",
  "validity": "2025-12-31",
  "isActive": true
}
```

#### **CURL:**
```bash
curl -X POST http://localhost:3000/api/agreements/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "healthPlanId": "healthplan123",
    "clientId": "client123",
    "agreementNumber": "CONV001/2024",
    "cardNumber": "1234567890123456",
    "validity": "2025-12-31",
    "isActive": true
  }'
```

#### **Resposta de Sucesso (201):**
```json
{
  "id": "agreement123",
  "healthPlanId": "healthplan123",
  "clientId": "client123",
  "agreementNumber": "CONV001/2024",
  "cardNumber": "1234567890123456",
  "validity": "2025-12-31T00:00:00.000Z",
  "isActive": true,
  "createdAt": "2024-12-20T10:00:00.000Z",
  "updatedAt": "2024-12-20T10:00:00.000Z",
  "healthPlan": {
    "id": "healthplan123",
    "name": "Unimed São Paulo",
    "planType": "INDIVIDUAL"
  },
  "client": {
    "id": "client123",
    "name": "João Silva Santos"
  }
}
```

### **2.2 READ - Listar Todos os Convênios**

#### **Endpoint:** `GET /api/agreements/agreements`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/agreements" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **2.3 READ - Buscar Convênio por ID**

#### **Endpoint:** `GET /api/agreements/agreements/{id}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/agreements/agreement123" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **2.4 READ - Buscar Convênios de um Cliente**

#### **Endpoint:** `GET /api/agreements/clients/{clientId}/agreements`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/clients/client123/agreements" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **2.5 UPDATE - Atualizar Convênio**

#### **Endpoint:** `PUT /api/agreements/agreements/{id}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/agreements/agreement123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "validity": "2026-12-31",
    "cardNumber": "1234567890123457"
  }'
```

### **2.6 DELETE - Deletar Convênio**

#### **Endpoint:** `DELETE /api/agreements/agreements/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X DELETE "http://localhost:3000/api/agreements/agreements/agreement123" \
  -H "Authorization: Bearer {seu_access_token}"
```

---

## **3. 💰 DESCONTOS - Gestão de Descontos por Convênio**

### **3.1 CREATE - Criar Desconto para Convênio**

#### **Endpoint:** `POST /api/agreements/agreements/{agreementId}/discounts`

#### **Permissões:** `ADMINISTRADOR`

#### **Body (JSON):**
```json
{
  "serviceId": "service123",
  "discountPercentage": 20.50,
  "isActive": true
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/agreements/agreement123/discounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "serviceId": "service123",
    "discountPercentage": 20.50,
    "isActive": true
  }'
```

### **3.2 READ - Listar Descontos de um Convênio**

#### **Endpoint:** `GET /api/agreements/agreements/{agreementId}/discounts`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/agreements/agreement123/discounts" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **3.3 UPDATE - Atualizar Desconto**

#### **Endpoint:** `PUT /api/agreements/discounts/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/discounts/discount123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "discountPercentage": 25.00
  }'
```

### **3.4 DELETE - Deletar Desconto**

#### **Endpoint:** `DELETE /api/agreements/discounts/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X DELETE "http://localhost:3000/api/agreements/discounts/discount123" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **3.5 UTILITY - Calcular Desconto para Serviço**

#### **Endpoint:** `POST /api/agreements/calculate-discount`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "agreementId": "agreement123",
  "serviceId": "service123",
  "amount": 150.00
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/calculate-discount" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "agreementId": "agreement123",
    "serviceId": "service123",
    "amount": 150.00
  }'
```

---

## **4. 🚧 LIMITES DE COBERTURA - Controle de Limites**

### **4.1 CREATE - Criar Limite de Cobertura**

#### **Endpoint:** `POST /api/agreements/health-plans/{healthPlanId}/coverage-limits`

#### **Permissões:** `ADMINISTRADOR`

#### **Body (JSON):**
```json
{
  "serviceId": "service123",
  "limitAmount": 1000.00,
  "limitType": "MONTHLY",
  "isActive": true
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/health-plans/healthplan123/coverage-limits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "serviceId": "service123",
    "limitAmount": 1000.00,
    "limitType": "MONTHLY",
    "isActive": true
  }'
```

### **4.2 READ - Listar Limites de Cobertura**

#### **Endpoint:** `GET /api/agreements/health-plans/{healthPlanId}/coverage-limits`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/health-plans/healthplan123/coverage-limits" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **4.3 UPDATE - Atualizar Limite de Cobertura**

#### **Endpoint:** `PUT /api/agreements/coverage-limits/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/coverage-limits/limit123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "limitAmount": 1200.00
  }'
```

### **4.4 DELETE - Deletar Limite de Cobertura**

#### **Endpoint:** `DELETE /api/agreements/coverage-limits/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X DELETE "http://localhost:3000/api/agreements/coverage-limits/limit123" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **4.5 UTILITY - Verificar Limite de Cobertura**

#### **Endpoint:** `POST /api/agreements/check-coverage-limit`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "agreementId": "agreement123",
  "serviceId": "service123",
  "amount": 200.00
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/check-coverage-limit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "agreementId": "agreement123",
    "serviceId": "service123",
    "amount": 200.00
  }'
```

---

## **5. 🔌 INTEGRAÇÕES - Conexão com Operadoras**

### **5.1 CREATE - Criar Integração com Operadora**

#### **Endpoint:** `POST /api/agreements/health-plans/{healthPlanId}/integrations`

#### **Permissões:** `ADMINISTRADOR`

#### **Body (JSON):**
```json
{
  "integrationType": "API",
  "endpoint": "https://api.unimed.com.br/v1",
  "credentials": {
    "apiKey": "unimed_api_key_123",
    "clientId": "primata_estetica",
    "authorization": "Bearer token123"
  },
  "settings": {
    "timeout": 30000,
    "version": "1.0",
    "retryAttempts": 3
  },
  "isActive": true
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/health-plans/healthplan123/integrations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "integrationType": "API",
    "endpoint": "https://api.unimed.com.br/v1",
    "credentials": {
      "apiKey": "unimed_api_key_123",
      "clientId": "primata_estetica",
      "authorization": "Bearer token123"
    },
    "settings": {
      "timeout": 30000,
      "version": "1.0",
      "retryAttempts": 3
    },
    "isActive": true
  }'
```

### **5.2 READ - Listar Integrações de um Plano**

#### **Endpoint:** `GET /api/agreements/health-plans/{healthPlanId}/integrations`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/health-plans/healthplan123/integrations" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **5.3 TEST - Testar Integração com Operadora**

#### **Endpoint:** `POST /api/agreements/integrations/{id}/test`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/integrations/integration123/test" \
  -H "Authorization: Bearer {seu_access_token}"
```

#### **Resposta:**
```json
{
  "success": true,
  "message": "Conexão testada com sucesso",
  "details": {
    "endpoint": "https://api.unimed.com.br/v1"
  }
}
```

### **5.4 UPDATE - Atualizar Integração**

#### **Endpoint:** `PUT /api/agreements/integrations/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/integrations/integration123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "endpoint": "https://api.unimed.com.br/v2",
    "settings": {
      "timeout": 45000,
      "version": "2.0"
    }
  }'
```

### **5.5 DELETE - Deletar Integração**

#### **Endpoint:** `DELETE /api/agreements/integrations/{id}`

#### **Permissões:** `ADMINISTRADOR`

#### **CURL:**
```bash
curl -X DELETE "http://localhost:3000/api/agreements/integrations/integration123" \
  -H "Authorization: Bearer {seu_access_token}"
```

---

## **6. 💳 PAGAMENTOS - Processamento de Pagamentos**

### **6.1 CREATE - Processar Pagamento com Convênio**

#### **Endpoint:** `POST /api/agreements/agreements/{agreementId}/payments`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "paymentId": "payment123",
  "amountCovered": 120.00,
  "amountClient": 30.00,
  "discountApplied": 20.00
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/agreements/agreement123/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "paymentId": "payment123",
    "amountCovered": 120.00,
    "amountClient": 30.00,
    "discountApplied": 20.00
  }'
```

### **6.2 READ - Listar Pagamentos de um Convênio**

#### **Endpoint:** `GET /api/agreements/agreements/{agreementId}/payments`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/agreements/agreement123/payments" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **6.3 READ - Buscar Pagamento por ID**

#### **Endpoint:** `GET /api/agreements/payments/{id}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/payments/payment123" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **6.4 UPDATE - Atualizar Pagamento**

#### **Endpoint:** `PUT /api/agreements/payments/{id}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/payments/payment123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "amountCovered": 125.00,
    "amountClient": 25.00
  }'
```

---

## **7. 🚨 ALERTAS - Monitoramento de Cobertura**

### **7.1 READ - Listar Alertas Ativos**

#### **Endpoint:** `GET /api/agreements/alerts`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/alerts" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **7.2 READ - Listar Alertas de um Convênio**

#### **Endpoint:** `GET /api/agreements/agreements/{agreementId}/alerts`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/agreements/agreement123/alerts" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **7.3 UPDATE - Resolver Alerta**

#### **Endpoint:** `PUT /api/agreements/alerts/{id}/resolve`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "message": "Alerta resolvido - cliente atualizou dados"
}
```

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/agreements/alerts/alert123/resolve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "message": "Alerta resolvido - cliente atualizou dados"
  }'
```

---

## **8. 📊 RELATÓRIOS - Análises e Estatísticas**

### **8.1 Relatório de Convênios por Plano de Saúde**

#### **Endpoint:** `GET /api/agreements/reports/health-plans/{healthPlanId}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Query Parameters:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/reports/health-plans/healthplan123?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **8.2 Relatório de Convênios por Cliente**

#### **Endpoint:** `GET /api/agreements/reports/clients/{clientId}`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/agreements/reports/clients/client123" \
  -H "Authorization: Bearer {seu_access_token}"
```

---

## **9. 🛠️ UTILITÁRIOS - Funcionalidades Auxiliares**

### **9.1 Aplicar Desconto Automático**

#### **Endpoint:** `POST /api/agreements/apply-discount`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "clientId": "client123",
  "serviceId": "service123",
  "amount": 150.00
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/apply-discount" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "clientId": "client123",
    "serviceId": "service123",
    "amount": 150.00
  }'
```

### **9.2 Verificar Cobertura de Convênio**

#### **Endpoint:** `POST /api/agreements/check-coverage`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "agreementId": "agreement123",
  "serviceId": "service123",
  "amount": 200.00
}
```

#### **CURL:**
```bash
curl -X POST "http://localhost:3000/api/agreements/check-coverage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "agreementId": "agreement123",
    "serviceId": "service123",
    "amount": 200.00
  }'
```

---

## **📊 ENUMS DISPONÍVEIS**

### **LimitType (Tipo de Limite):**
```typescript
enum LimitType {
  PER_SESSION = "PER_SESSION",    // Por sessão
  MONTHLY = "MONTHLY",            // Mensal
  ANNUAL = "ANNUAL",              // Anual
  LIFETIME = "LIFETIME"           // Vitalício
}
```

### **AlertType (Tipo de Alerta):**
```typescript
enum AlertType {
  LIMIT_EXCEEDED = "LIMIT_EXCEEDED",      // Limite excedido
  EXPIRING_SOON = "EXPIRING_SOON",        // Expirando em breve
  INVALID_AGREEMENT = "INVALID_AGREEMENT", // Convênio inválido
  COVERAGE_DENIED = "COVERAGE_DENIED",     // Cobertura negada
  PAYMENT_DELAYED = "PAYMENT_DELAYED"      // Pagamento atrasado
}
```

### **IntegrationType (Tipo de Integração):**
```typescript
enum IntegrationType {
  API = "API",           // Integração via API REST
  WEBHOOK = "WEBHOOK",   // Integração via Webhook
  EMAIL = "EMAIL",       // Integração via Email
  FTP = "FTP",          // Integração via FTP
  SFTP = "SFTP"         // Integração via SFTP
}
```

---

## **⚠️ CÓDIGOS DE ERRO**

### **400 - Bad Request:**
```json
{
  "statusCode": 400,
  "message": [
    "healthPlanId should not be empty",
    "clientId should not be empty",
    "agreementNumber should not be empty"
  ],
  "error": "Bad Request"
}
```

### **401 - Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **403 - Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Acesso negado"
}
```

### **404 - Not Found:**
```json
{
  "statusCode": 404,
  "message": "Convênio não encontrado"
}
```

### **409 - Conflict:**
```json
{
  "statusCode": 409,
  "message": "Número de convênio já cadastrado"
}
```

---

## **🚀 EXEMPLOS COMPLETOS DE USO**

### **Fluxo Completo de Gestão de Parceiros:**

```bash
# 1. Login para obter token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@primata.com",
    "password": "admin123"
  }'

# 2. Criar plano de saúde
curl -X POST http://localhost:3000/api/agreements/health-plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "name": "Unimed São Paulo",
    "planType": "INDIVIDUAL",
    "operatorCode": "UNIMED001"
  }'

# 3. Criar integração com operadora
curl -X POST "http://localhost:3000/api/agreements/health-plans/{id_plano}/integrations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "integrationType": "API",
    "endpoint": "https://api.unimed.com.br/v1",
    "credentials": {
      "apiKey": "chave_api_123"
    }
  }'

# 4. Testar integração
curl -X POST "http://localhost:3000/api/agreements/integrations/{id_integracao}/test" \
  -H "Authorization: Bearer {token_do_login}"

# 5. Criar convênio para cliente
curl -X POST http://localhost:3000/api/agreements/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "healthPlanId": "{id_plano}",
    "clientId": "{id_cliente}",
    "agreementNumber": "CONV001/2024"
  }'

# 6. Criar desconto para convênio
curl -X POST "http://localhost:3000/api/agreements/agreements/{id_convênio}/discounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "serviceId": "{id_serviço}",
    "discountPercentage": 20.50
  }'

# 7. Calcular desconto
curl -X POST "http://localhost:3000/api/agreements/calculate-discount" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "agreementId": "{id_convênio}",
    "serviceId": "{id_serviço}",
    "amount": 150.00
  }'

# 8. Gerar relatório
curl -X GET "http://localhost:3000/api/agreements/reports/health-plans/{id_plano}?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer {token_do_login}"
```

---

## **📝 NOTAS IMPORTANTES**

- **Todos os endpoints requerem autenticação JWT**
- **Apenas ADMINISTRADOR pode criar/deletar planos de saúde**
- **ADMINISTRADOR e RECEPCIONISTA podem gerenciar convênios**
- **Apenas ADMINISTRADOR pode gerenciar integrações**
- **Número de convênio deve ser único por operadora**
- **Descontos podem ser aplicados por serviço ou pacote**
- **Limites de cobertura são controlados por tipo (sessão, mensal, anual)**
- **Alertas são gerados automaticamente para monitoramento**
- **Integrações suportam múltiplos tipos (API, Webhook, Email)**
- **Relatórios incluem análises detalhadas de uso e cobertura**
- **Sistema valida automaticamente limites e cobertura**
- **Pagamentos são processados com desconto automático**
- **Histórico completo de todas as operações é mantido**
