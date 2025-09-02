# CRUD Financeiro - Primata Estética API

## **📋 ENDPOINTS**

### **1. CRIAR PAGAMENTO - Cadastrar Novo Pagamento**
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "clientId": "cmf1tiw75007akw4cpb8rkowm",
    "appointmentId": "cmf1tiw75007akw4cpb8rkowm",
    "serviceId": "cmf1tiw75007akw4cpb8rkowm",
    "amount": 150.00,
    "discountAmount": 20.00,
    "paymentMethod": "PIX",
    "paymentStatus": "PENDING",
    "dueDate": "2024-12-31",
    "notes": "Pagamento para tratamento facial",
    "transactionId": "TXN123456",
    "generateReceipt": true
  }'
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "clientId": "cmf1tiw75007akw4cpb8rkowm",
  "appointmentId": "cmf1tiw75007akw4cpb8rkowm",
  "serviceId": "cmf1tiw75007akw4cpb8rkowm",
  "amount": 150.00,
  "discountAmount": 20.00,
  "finalAmount": 130.00,
  "paymentMethod": "PIX",
  "paymentStatus": "PENDING",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "notes": "Pagamento para tratamento facial",
  "transactionId": "TXN123456",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "client": {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Maria Silva"
  },
  "service": {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Tratamento Facial"
  }
}
```

### **2. LISTAR PAGAMENTOS - Buscar Todos os Pagamentos**
```bash
curl -X GET "http://localhost:3000/api/payments?page=1&limit=10&clientName=maria&paymentMethod=PIX&paymentStatus=PENDING&minAmount=100&maxAmount=200&startDate=2024-01-01&endDate=2024-12-31&sortBy=amount&sortOrder=desc" \
  -H "Authorization: Bearer {access_token}"
```
**Parâmetros de Query:**
- `page`: Página atual (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `clientName`: Buscar por nome do cliente
- `paymentMethod`: Filtrar por método (CASH, CREDIT_CARD, DEBIT_CARD, PIX, BANK_TRANSFER, CHECK, VOUCHER, OTHER)
- `paymentStatus`: Filtrar por status (PENDING, PAID, PARTIAL, CANCELLED, REFUNDED, OVERDUE)
- `minAmount`: Valor mínimo
- `maxAmount`: Valor máximo
- `startDate`: Data de início (YYYY-MM-DD)
- `endDate`: Data de fim (YYYY-MM-DD)
- `sortBy`: Campo para ordenação
- `sortOrder`: Direção da ordenação (asc/desc)

**Retorna:**
```json
{
  "payments": [
    {
      "id": "cmf1tiw75007akw4cpb8rkowm",
      "amount": 150.00,
      "finalAmount": 130.00,
      "paymentMethod": "PIX",
      "paymentStatus": "PENDING",
      "client": {
        "id": "cmf1tiw75007akw4cpb8rkowm",
        "name": "Maria Silva"
      },
      "service": {
        "id": "cmf1tiw75007akw4cpb8rkowm",
        "name": "Tratamento Facial"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### **3. BUSCAR PAGAMENTO - Obter Pagamento por ID**
```bash
curl -X GET http://localhost:3000/api/payments/{payment_id} \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "clientId": "cmf1tiw75007akw4cpb8rkowm",
  "appointmentId": "cmf1tiw75007akw4cpb8rkowm",
  "serviceId": "cmf1tiw75007akw4cpb8rkowm",
  "amount": 150.00,
  "discountAmount": 20.00,
  "finalAmount": 130.00,
  "paymentMethod": "PIX",
  "paymentStatus": "PENDING",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "notes": "Pagamento para tratamento facial",
  "transactionId": "TXN123456",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "client": {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Maria Silva"
  },
  "service": {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Tratamento Facial"
  },
  "commissions": [
    {
      "id": "cmf1tiw75007akw4cpb8rkowm",
      "professionalId": "cmf1tiw75007akw4cpb8rkowm",
      "amount": 19.50,
      "percentage": 15,
      "status": "PENDING"
    }
  ]
}
```

### **4. ATUALIZAR PAGAMENTO - Modificar Dados do Pagamento**
```bash
curl -X PUT http://localhost:3000/api/payments/{payment_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "amount": 160.00,
    "discountAmount": 25.00,
    "paymentMethod": "CREDIT_CARD",
    "notes": "Pagamento atualizado com desconto adicional"
  }'
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "clientId": "cmf1tiw75007akw4cpb8rkowm",
  "appointmentId": "cmf1tiw75007akw4cpb8rkowm",
  "serviceId": "cmf1tiw75007akw4cpb8rkowm",
  "amount": 160.00,
  "discountAmount": 25.00,
  "finalAmount": 135.00,
  "paymentMethod": "CREDIT_CARD",
  "paymentStatus": "PENDING",
  "notes": "Pagamento atualizado com desconto adicional",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **5. MARCAR COMO PAGO - Alterar Status para Pago**
```bash
curl -X PATCH http://localhost:3000/api/payments/{payment_id}/mark-as-paid \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "paymentStatus": "PAID",
  "paidAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **6. REEMBOLSAR PAGAMENTO - Processar Reembolso**
```bash
curl -X PATCH http://localhost:3000/api/payments/{payment_id}/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "reason": "Cliente solicitou cancelamento do serviço"
  }'
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "paymentStatus": "REFUNDED",
  "refundedAt": "2024-01-01T00:00:00.000Z",
  "refundReason": "Cliente solicitou cancelamento do serviço",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **7. GERAR RECIBO - Criar Comprovante de Pagamento**
```bash
curl -X POST http://localhost:3000/api/payments/{payment_id}/generate-receipt \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "receiptNumber": "REC-2024-001",
  "receiptType": "RECEIPT",
  "amount": 130.00,
  "issuedAt": "2024-01-01T00:00:00.000Z",
  "payment": {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "amount": 150.00,
    "discountAmount": 20.00,
    "finalAmount": 130.00,
    "paymentMethod": "PIX"
  },
  "client": {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Maria Silva"
  }
}
```

### **8. DELETAR PAGAMENTO - Remover Pagamento do Sistema**
```bash
curl -X DELETE http://localhost:3000/api/payments/{payment_id} \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "success": true,
  "message": "Pagamento deletado com sucesso"
}
```

### **9. ESTATÍSTICAS FINANCEIRAS - Visão Geral dos Pagamentos**
```bash
curl -X GET http://localhost:3000/api/payments/stats/overview \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "totalPayments": 150,
  "totalAmount": 22500.00,
  "totalPaid": 18000.00,
  "totalPending": 3000.00,
  "totalOverdue": 1500.00,
  "paymentsByMethod": {
    "PIX": 60,
    "CREDIT_CARD": 45,
    "CASH": 25,
    "DEBIT_CARD": 15,
    "BANK_TRANSFER": 5
  },
  "paymentsByStatus": {
    "PAID": 120,
    "PENDING": 20,
    "OVERDUE": 10
  },
  "averagePayment": 150.00,
  "monthlyRevenue": {
    "2024-01": 7500.00,
    "2024-02": 8000.00,
    "2024-03": 7000.00
  }
}
```

## **🔐 PERMISSÕES NECESSÁRIAS**

### **Criar Pagamento:**
- **ADMINISTRADOR**: ✅ Acesso total
- **RECEPCIONISTA**: ✅ Pode criar pagamentos

### **Listar e Buscar Pagamentos:**
- **ADMINISTRADOR**: ✅ Acesso total
- **MEDICO**: ✅ Pode visualizar pagamentos
- **RECEPCIONISTA**: ✅ Pode visualizar pagamentos

### **Atualizar Pagamento:**
- **ADMINISTRADOR**: ✅ Acesso total
- **RECEPCIONISTA**: ✅ Pode atualizar pagamentos

### **Marcar como Pago:**
- **ADMINISTRADOR**: ✅ Acesso total
- **RECEPCIONISTA**: ✅ Pode marcar como pago

### **Reembolsar Pagamento:**
- **ADMINISTRADOR**: ✅ Acesso total
- **MEDICO**: ❌ Sem permissão
- **RECEPCIONISTA**: ❌ Sem permissão

### **Gerar Recibo:**
- **ADMINISTRADOR**: ✅ Acesso total
- **RECEPCIONISTA**: ✅ Pode gerar recibos

### **Deletar Pagamento:**
- **ADMINISTRADOR**: ✅ Acesso total
- **MEDICO**: ❌ Sem permissão
- **RECEPCIONISTA**: ❌ Sem permissão

## **📝 MÉTODOS DE PAGAMENTO DISPONÍVEIS**

- **CASH**: Dinheiro
- **CREDIT_CARD**: Cartão de crédito
- **DEBIT_CARD**: Cartão de débito
- **PIX**: PIX
- **BANK_TRANSFER**: Transferência bancária
- **CHECK**: Cheque
- **VOUCHER**: Vale
- **OTHER**: Outro

## **📊 STATUS DE PAGAMENTO DISPONÍVEIS**

- **PENDING**: Pendente
- **PAID**: Pago
- **PARTIAL**: Parcialmente pago
- **CANCELLED**: Cancelado
- **REFUNDED**: Reembolsado
- **OVERDUE**: Vencido

## **💰 TIPOS DE RECIBO DISPONÍVEIS**

- **INVOICE**: Fatura
- **RECEIPT**: Recibo
- **PROOF**: Comprovante
- **TAX**: Nota fiscal

## **⚠️ OBSERVAÇÕES**

- IDs são CUIDs (Collision-resistant Unique Identifier) válidos
- Valores monetários são sempre positivos
- Descontos são aplicados sobre o valor total
- Comissões são calculadas automaticamente (15% do valor final)
- Recibos são gerados automaticamente ao marcar como pago
- Pagamentos vencidos são marcados automaticamente como OVERDUE
- Apenas administradores podem deletar pagamentos
- Apenas administradores podem processar reembolsos
- Todos os endpoints requerem autenticação
