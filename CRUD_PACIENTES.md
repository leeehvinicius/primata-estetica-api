# CRUD Completo de Pacientes - Primata Estética API

## **🔐 AUTENTICAÇÃO NECESSÁRIA**

**IMPORTANTE:** Todos os endpoints requerem autenticação JWT. Use o token recebido no login:

```bash
Authorization: Bearer {seu_access_token}
```

## **📋 ENDPOINTS DISPONÍVEIS**

### **1. CREATE - Criar Cliente**
### **2. READ - Listar/Buscar Clientes**
### **3. UPDATE - Atualizar Cliente**
### **4. DELETE - Deletar Cliente**
### **5. EXTRA - Funcionalidades Adicionais**

---

## **1. 🆕 CREATE - Criar Cliente**

### **Endpoint:** `POST /api/clients`

### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

### **Body (JSON):**
```json
{
  "name": "João Silva Santos",
  "email": "joao.silva@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "document": "123.456.789-00",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "emergencyContact": "Maria Silva",
  "emergencyPhone": "(11) 88888-8888",
  "notes": "Cliente com preferência por horários da manhã",
  "isActive": true
}
```

### **CURL:**
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "name": "João Silva Santos",
    "email": "joao.silva@email.com",
    "phone": "(11) 99999-9999",
    "birthDate": "1990-05-15",
    "gender": "MALE",
    "document": "123.456.789-00",
    "address": "Rua das Flores, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "emergencyContact": "Maria Silva",
    "emergencyPhone": "(11) 88888-8888",
    "notes": "Cliente com preferência por horários da manhã",
    "isActive": true
  }'
```

### **Resposta de Sucesso (201):**
```json
{
  "id": "clucentral123",
  "name": "João Silva Santos",
  "email": "joao.silva@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-05-15T00:00:00.000Z",
  "gender": "MALE",
  "document": "123.456.789-00",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "emergencyContact": "Maria Silva",
  "emergencyPhone": "(11) 88888-8888",
  "notes": "Cliente com preferência por horários da manhã",
  "isActive": true,
  "createdAt": "2024-12-20T10:00:00.000Z",
  "updatedAt": "2024-12-20T10:00:00.000Z"
}
```

---

## **2. 📖 READ - Listar/Buscar Clientes**

### **2.1 Listar Todos os Clientes (Com Paginação)**

#### **Endpoint:** `GET /api/clients`

#### **Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA`

#### **Query Parameters:**
- `page` (opcional): Página atual (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10, máximo: 100)
- `search` (opcional): Buscar por nome, email, telefone ou documento
- `gender` (opcional): Filtrar por gênero (`MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`)
- `isActive` (opcional): Filtrar por status ativo (`true`/`false`)
- `sortBy` (opcional): Campo para ordenação (padrão: `createdAt`)
- `sortOrder` (opcional): Direção da ordenação (`asc`/`desc`, padrão: `desc`)

#### **CURL - Listar Todos:**
```bash
curl -X GET "http://localhost:3000/api/clients" \
  -H "Authorization: Bearer {seu_access_token}"
```

#### **CURL - Com Filtros:**
```bash
curl -X GET "http://localhost:3000/api/clients?page=1&limit=20&search=João&gender=MALE&isActive=true&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer {seu_access_token}"
```

#### **Resposta:**
```json
{
  "clients": [
    {
      "id": "clucentral123",
      "name": "João Silva Santos",
      "email": "joao.silva@email.com",
      "phone": "(11) 99999-9999",
      "birthDate": "1990-05-15T00:00:00.000Z",
      "gender": "MALE",
      "document": "123.456.789-00",
      "isActive": true,
      "createdAt": "2024-12-20T10:00:00.000Z",
      "updatedAt": "2024-12-20T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

### **2.2 Buscar Cliente por ID**

#### **Endpoint:** `GET /api/clients/{id}`

#### **Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/clients/clucentral123" \
  -H "Authorization: Bearer {seu_access_token}"
```

#### **Resposta:**
```json
{
  "id": "clucentral123",
  "name": "João Silva Santos",
  "email": "joao.silva@email.com",
  "phone": "(11) 99999-9999",
  "birthDate": "1990-05-15T00:00:00.000Z",
  "gender": "MALE",
  "document": "123.456.789-00",
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01234-567",
  "emergencyContact": "Maria Silva",
  "emergencyPhone": "(11) 88888-8888",
  "notes": "Cliente com preferência por horários da manhã",
  "isActive": true,
  "createdAt": "2024-12-20T10:00:00.000Z",
  "updatedAt": "2024-12-20T10:00:00.000Z"
}
```

### **2.3 Buscar Clientes por Nome**

#### **Endpoint:** `GET /api/clients/search/name/{name}`

#### **Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/clients/search/name/João" \
  -H "Authorization: Bearer {seu_access_token}"
```

---

## **3. ✏️ UPDATE - Atualizar Cliente**

### **3.1 Atualizar Cliente Completo**

#### **Endpoint:** `PUT /api/clients/{id}`

#### **Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA`

#### **Body (JSON):**
```json
{
  "name": "João Silva Santos Atualizado",
  "phone": "(11) 99999-8888",
  "notes": "Cliente com preferência por horários da tarde",
  "isActive": true
}
```

#### **CURL:**
```bash
curl -X PUT "http://localhost:3000/api/clients/clucentral123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_access_token}" \
  -d '{
    "name": "João Silva Santos Atualizado",
    "phone": "(11) 99999-8888",
    "notes": "Cliente com preferência por horários da tarde",
    "isActive": true
  }'
```

### **3.2 Alternar Status do Cliente**

#### **Endpoint:** `PATCH /api/clients/{id}/toggle-status`

#### **Permissões:** `ADMINISTRADOR`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X PATCH "http://localhost:3000/api/clients/clucentral123/toggle-status" \
  -H "Authorization: Bearer {seu_access_token}"
```

---

## **4. 🗑️ DELETE - Deletar Cliente**

### **Endpoint:** `DELETE /api/clients/{id}`

### **Permissões:** `ADMINISTRADOR` (APENAS)

### **CURL:**
```bash
curl -X DELETE "http://localhost:3000/api/clients/clucentral123" \
  -H "Authorization: Bearer {seu_access_token}"
```

### **Resposta:**
```json
{
  "message": "Cliente deletado com sucesso"
}
```

---

## **5. 🔍 EXTRA - Funcionalidades Adicionais**

### **5.1 Estatísticas dos Clientes**

#### **Endpoint:** `GET /api/clients/stats/overview`

#### **Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/clients/stats/overview" \
  -H "Authorization: Bearer {seu_access_token}"
```

#### **Resposta:**
```json
{
  "total": 150,
  "active": 142,
  "inactive": 8,
  "byGender": {
    "MALE": 65,
    "FEMALE": 80,
    "OTHER": 3,
    "PREFER_NOT_TO_SAY": 2
  },
  "byAgeGroup": {
    "18-25": 25,
    "26-35": 45,
    "36-45": 35,
    "46-55": 25,
    "56+": 20
  },
  "newThisMonth": 12,
  "newThisYear": 89
}
```

### **5.2 Histórico Completo do Cliente**

#### **Endpoint:** `GET /api/clients/{id}/history`

#### **Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA`

#### **CURL:**
```bash
curl -X GET "http://localhost:3000/api/clients/clucentral123/history" \
  -H "Authorization: Bearer {seu_access_token}"
```

#### **Resposta:**
```json
{
  "client": {
    "id": "clucentral123",
    "name": "João Silva Santos",
    "email": "joao.silva@email.com"
  },
  "attendances": [
    {
      "id": "attendance123",
      "serviceType": "CONSULTATION",
      "date": "2024-12-15T10:00:00.000Z",
      "status": "COMPLETED"
    }
  ],
  "medicalHistory": [
    {
      "id": "history123",
      "condition": "Alergia a produtos com fragrância",
      "severity": "MILD",
      "isActive": true
    }
  ],
  "treatments": [
    {
      "id": "treatment123",
      "name": "Limpeza de Pele",
      "status": "ACTIVE",
      "sessions": 5,
      "completedSessions": 2
    }
  ],
  "appointments": [
    {
      "id": "appointment123",
      "scheduledDate": "2024-12-25T14:00:00.000Z",
      "status": "SCHEDULED"
    }
  ]
}
```

---

## **📊 ENUMS DISPONÍVEIS**

### **Gender (Gênero):**
```typescript
enum Gender {
  MALE = "MALE",                    // Masculino
  FEMALE = "FEMALE",                // Feminino
  OTHER = "OTHER",                  // Outro
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"  // Prefere não dizer
}
```

### **Sort Order (Ordenação):**
```typescript
enum SortOrder {
  ASC = "asc",    // Crescente
  DESC = "desc"   // Decrescente
}
```

---

## **⚠️ CÓDIGOS DE ERRO**

### **400 - Bad Request:**
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "phone should not be empty",
    "email must be an email"
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
  "message": "Cliente não encontrado"
}
```

### **409 - Conflict:**
```json
{
  "statusCode": 409,
  "message": "Email já cadastrado"
}
```

---

## **🚀 EXEMPLOS COMPLETOS DE USO**

### **Fluxo Completo de CRUD:**

```bash
# 1. Login para obter token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@primata.com",
    "password": "admin123"
  }'

# 2. Criar cliente
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "name": "Maria Santos",
    "email": "maria.santos@email.com",
    "phone": "(11) 77777-7777",
    "gender": "FEMALE"
  }'

# 3. Listar clientes
curl -X GET "http://localhost:3000/api/clients?page=1&limit=10" \
  -H "Authorization: Bearer {token_do_login}"

# 4. Buscar cliente específico
curl -X GET "http://localhost:3000/api/clients/{id_do_cliente}" \
  -H "Authorization: Bearer {token_do_login}"

# 5. Atualizar cliente
curl -X PUT "http://localhost:3000/api/clients/{id_do_cliente}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token_do_login}" \
  -d '{
    "phone": "(11) 77777-8888"
  }'

# 6. Deletar cliente
curl -X DELETE "http://localhost:3000/api/clients/{id_do_cliente}" \
  -H "Authorization: Bearer {token_do_login}"
```

---

## **📝 NOTAS IMPORTANTES**

- **Todos os endpoints requerem autenticação JWT**
- **Apenas ADMINISTRADOR pode deletar clientes**
- **MEDICO e RECEPCIONISTA podem ler e atualizar**
- **RECEPCIONISTA pode criar novos clientes**
- **CPF e Email são únicos (não podem ser duplicados)**
- **Data de nascimento deve estar no formato ISO (YYYY-MM-DD)**
- **Telefone é obrigatório, email é opcional**
- **O sistema valida automaticamente CPF e email**
- **Histórico inclui atendimentos, histórico médico e tratamentos**
- **Estatísticas são calculadas em tempo real**
