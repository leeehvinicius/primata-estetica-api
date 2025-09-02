# CRUD de Parceiros (Convênios) - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. CREATE - Criar Convênio**
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
  "validity": "2025-12-31",
  "isActive": true
}
```

### **2. READ - Listar Convênios**
```bash
GET /api/agreements/agreements?page=1&limit=10&isActive=true
```

### **3. READ - Buscar por ID**
```bash
GET /api/agreements/agreements/{id}
```

### **4. UPDATE - Atualizar**
```bash
PUT /api/agreements/agreements/{id}
```
**Body:**
```json
{
  "validity": "2026-12-31",
  "cardNumber": "1234567890123457",
  "isActive": false
}
```

### **5. DELETE - Deletar**
```bash
DELETE /api/agreements/agreements/{id}
```

### **6. CALCULAR DESCONTO**
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

### **7. VERIFICAR COBERTURA**
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

### **8. RELATÓRIOS**
```bash
GET /api/agreements/reports/health-plans/{healthPlanId}?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

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
- **ADMINISTRADOR, RECEPCIONISTA**: Criar, atualizar, calcular desconto, verificar cobertura
- **ADMINISTRADOR**: Deletar, gerenciar integrações e limites
- **Todos**: Visualizar

## **🚀 EXEMPLO RÁPIDO**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# Criar convênio
curl -X POST http://localhost:3000/api/agreements/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"healthPlanId": "healthplan123", "clientId": "client123", "agreementNumber": "CONV001/2024"}'

# Listar
curl -X GET "http://localhost:3000/api/agreements/agreements" \
  -H "Authorization: Bearer {token}"

# Calcular desconto
curl -X POST http://localhost:3000/api/agreements/calculate-discount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"agreementId": "agreement123", "serviceId": "service123", "amount": 150.00}'
```
