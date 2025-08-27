# CRUD de Serviços - Primata Estética API

## **🔐 AUTENTICAÇÃO**
```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS**

### **1. CREATE - Criar Serviço**
```bash
POST /api/services
```
**Body:**
```json
{
  "name": "Limpeza de Pele Profunda",
  "description": "Tratamento completo de limpeza facial",
  "category": "FACIAL_TREATMENT",
  "duration": 60,
  "price": 150.00,
  "isActive": true
}
```

### **2. READ - Listar Serviços**
```bash
GET /api/services?page=1&limit=10&category=FACIAL_TREATMENT
```

### **3. READ - Buscar por ID**
```bash
GET /api/services/{id}
```

### **4. UPDATE - Atualizar**
```bash
PUT /api/services/{id}
```
**Body:**
```json
{
  "name": "Limpeza de Pele Profunda Plus",
  "price": 180.00
}
```

### **5. DELETE - Deletar**
```bash
DELETE /api/services/{id}
```

### **6. GESTÃO - Alternar Status**
```bash
PATCH /api/services/{id}/toggle-status
```

### **7. BUSCA AVANÇADA**
```bash
GET /api/services/search?query=limpeza&category=FACIAL_TREATMENT&minPrice=100&maxPrice=200
```

### **8. ESTATÍSTICAS**
```bash
GET /api/services/stats
```

## **🔑 PERMISSÕES**
- **ADMINISTRADOR**: Todos os endpoints
- **MEDICO**: Apenas leitura
- **RECEPCIONISTA**: Apenas leitura

## **📊 ENUMS**

### **ServiceCategory**
- `FACIAL_TREATMENT` - Tratamento Facial
- `BODY_TREATMENT` - Tratamento Corporal
- `HAIR_TREATMENT` - Tratamento Capilar
- `COSMETIC_PROCEDURE` - Procedimento Cosmético
- `CONSULTATION` - Consulta
- `MAINTENANCE` - Manutenção

## **📝 EXEMPLO RÁPIDO**
```bash
# 1. Login para obter token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'

# 2. Criar serviço
curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Limpeza de Pele",
    "description": "Tratamento facial",
    "category": "FACIAL_TREATMENT",
    "duration": 60,
    "price": 150.00
  }'
```
