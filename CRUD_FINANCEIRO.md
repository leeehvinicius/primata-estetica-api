# CRUD Financeiro - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. CREATE - Criar Pagamento**
```bash
POST /api/payments
```
**Body:**
```json
{
  "clientId": "client123",
  "serviceId": "service123",
  "appointmentId": "appointment123",
  "amount": 150.00,
  "discountAmount": 20.00,
  "paymentMethod": "CREDIT_CARD",
  "dueDate": "2024-12-31",
  "notes": "Pagamento parcelado"
}
```

### **2. READ - Listar Pagamentos**
```bash
GET /api/payments?page=1&limit=10&paymentStatus=PAID&paymentMethod=CREDIT_CARD
```

### **3. READ - Buscar por ID**
```bash
GET /api/payments/{id}
```

### **4. UPDATE - Atualizar**
```bash
PUT /api/payments/{id}
```
**Body:**
```json
{
  "amount": 180.00,
  "discountAmount": 25.00,
  "notes": "Atualizado com desconto adicional"
}
```

### **5. DELETE - Deletar**
```bash
DELETE /api/payments/{id}
```

### **6. GESTÃO - Marcar como Pago**
```bash
PATCH /api/payments/{id}/mark-as-paid
```

### **7. GESTÃO - Reembolsar**
```bash
PATCH /api/payments/{id}/refund
```
**Body:**
```json
{
  "reason": "Cliente solicitou cancelamento"
}
```

### **8. RECIBOS - Gerar Recibo**
```bash
POST /api/payments/{id}/generate-receipt
```

### **9. ESTATÍSTICAS**
```bash
GET /api/payments/stats/overview
```

## **🔑 PERMISSÕES**
- **ADMINISTRADOR**: Todos os endpoints
- **RECEPCIONISTA**: Criar, atualizar, marcar como pago, gerar recibo
- **MEDICO**: Apenas leitura e estatísticas

## **📊 ENUMS**

### **PaymentMethod**
- `CASH` - Dinheiro
- `CREDIT_CARD` - Cartão de crédito
- `DEBIT_CARD` - Cartão de débito
- `PIX` - PIX
- `BANK_TRANSFER` - Transferência bancária
- `CHECK` - Cheque
- `VOUCHER` - Vale
- `OTHER` - Outro

### **PaymentStatus**
- `PENDING` - Pendente
- `PAID` - Pago
- `PARTIAL` - Parcialmente pago
- `CANCELLED` - Cancelado
- `REFUNDED` - Reembolsado
- `OVERDUE` - Vencido

## **📝 EXEMPLO RÁPIDO**
```bash
# 1. Login para obter token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# 2. Criar pagamento
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client123",
    "serviceId": "service123",
    "amount": 150.00,
    "paymentMethod": "CREDIT_CARD"
  }'

# 3. Marcar como pago
curl -X PATCH http://localhost:3000/api/payments/{id}/mark-as-paid \
  -H "Authorization: Bearer {token}"

# 4. Gerar recibo
curl -X POST http://localhost:3000/api/payments/{id}/generate-receipt \
  -H "Authorization: Bearer {token}"
```
