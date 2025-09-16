# CRUD de Parceiros - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. CREATE - Criar Parceiro**
```bash
POST /api/partners
```
**Body:**
```json
{
  "name": "Parceiro X",
  "documentType": "CPF",
  "document": "12345678901",
  "partnerDiscount": 0.00,
  "clientDiscount": 0.00,
  "fixedDiscount": 0.00,
  "notes": "Observações do parceiro",
  "isActive": true
}
```

### **2. READ - Listar Parceiros**
```bash
GET /api/partners?search=texto
```

### **3. READ - Buscar Parceiro por ID**
```bash
GET /api/partners/{id}
```

### **4. UPDATE - Atualizar Parceiro**
```bash
PUT /api/partners/{id}
```
**Body (exemplo):**
```json
{
  "name": "Parceiro X Atualizado",
  "partnerDiscount": 10.00,
  "clientDiscount": 5.00,
  "fixedDiscount": 0.00,
  "notes": "Atualização",
  "isActive": true
}
```

### **5. DELETE - Deletar Parceiro**
```bash
DELETE /api/partners/{id}
```

## **📦 MODELO**

- name: Nome do Parceiro
- documentType: CPF ou CNPJ
- document: Documento único
- partnerDiscount: Desconto (%) do parceiro
- clientDiscount: Desconto (%) do cliente
- fixedDiscount: Desconto fixo (opcional)
- notes: Observações
- isActive: Parceiro ativo

## **🧩 INTEGRAÇÃO COM AGENDAMENTOS**

- Envie `partnerId` ao criar um agendamento para aplicar automaticamente os descontos do parceiro no campo `pricing` do retorno.

## **⚠️ PERMISSÕES**
- ADMINISTRADOR, RECEPCIONISTA: Criar e atualizar parceiros
- ADMINISTRADOR: Deletar parceiros
- Todos: Visualizar parceiros

## **🚀 EXEMPLO RÁPIDO**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# Criar parceiro
curl -X POST http://localhost:3000/api/partners \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"name": "Parceiro X", "documentType": "CPF", "document": "12345678901"}'
```
