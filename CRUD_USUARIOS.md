# CRUD de Usuários - Primata Estética API

## **📋 ENDPOINTS**

### **1. CRIAR USUÁRIO - Cadastrar Novo Usuário**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "email": "recepcionista@primata.com",
    "name": "Maria Silva",
    "password": "senha123",
    "role": "RECEPCIONISTA",
    "phone": "(11) 99999-9999",
    "document": "123.456.789-00"
  }'
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "email": "recepcionista@primata.com",
  "name": "Maria Silva",
  "role": "RECEPCIONISTA",
  "phone": "(11) 99999-9999",
  "document": "123.456.789-00",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **2. LISTAR USUÁRIOS - Buscar Todos os Usuários**
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=maria&role=RECEPCIONISTA&isActive=true&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer {access_token}"
```
**Parâmetros de Query:**
- `page`: Página atual (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `search`: Buscar por nome, email, telefone ou documento
- `role`: Filtrar por role (ADMINISTRADOR, MEDICO, RECEPCIONISTA, SERVICOS_GERAIS)
- `isActive`: Filtrar por status ativo (true/false)
- `sortBy`: Campo para ordenação
- `sortOrder`: Direção da ordenação (asc/desc)

**Retorna:**
```json
{
  "users": [
    {
      "id": "cmf1tiw75007akw4cpb8rkowm",
      "email": "admin@primata.com",
      "name": "Administrador",
      "role": "ADMINISTRADOR",
      "isActive": true
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

### **3. BUSCAR USUÁRIO - Obter Usuário por ID**
```bash
curl -X GET http://localhost:3000/api/users/{user_id} \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "email": "recepcionista@primata.com",
  "name": "Maria Silva",
  "role": "RECEPCIONISTA",
  "phone": "(11) 99999-9999",
  "document": "123.456.789-00",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **4. ATUALIZAR USUÁRIO - Modificar Dados do Usuário**
```bash
curl -X PUT http://localhost:3000/api/users/{user_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "name": "Maria Silva Santos",
    "phone": "(11) 88888-8888",
    "role": "MEDICO"
  }'
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "email": "recepcionista@primata.com",
  "name": "Maria Silva Santos",
  "role": "MEDICO",
  "phone": "(11) 88888-8888",
  "document": "123.456.789-00",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **5. ALTERNAR STATUS - Ativar/Desativar Usuário**
```bash
curl -X PATCH http://localhost:3000/api/users/{user_id}/toggle-status \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "email": "recepcionista@primata.com",
  "name": "Maria Silva Santos",
  "role": "MEDICO",
  "isActive": false,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **6. DELETAR USUÁRIO - Remover Usuário do Sistema**
```bash
curl -X DELETE http://localhost:3000/api/users/{user_id} \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "success": true,
  "message": "Usuário deletado com sucesso"
}
```

### **7. PERFIL DO USUÁRIO - Dados do Usuário Autenticado**
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "email": "admin@primata.com",
  "name": "Administrador",
  "role": "ADMINISTRADOR",
  "phone": "(11) 99999-9999",
  "document": "123.456.789-00",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### **8. ESTATÍSTICAS - Visão Geral dos Usuários**
```bash
curl -X GET http://localhost:3000/api/users/stats/overview \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "totalUsers": 25,
  "activeUsers": 23,
  "inactiveUsers": 2,
  "usersByRole": {
    "ADMINISTRADOR": 2,
    "MEDICO": 5,
    "RECEPCIONISTA": 15,
    "SERVICOS_GERAIS": 3
  },
  "recentRegistrations": 5
}
```

### **9. LISTAR ROLES - Todos os Roles Disponíveis**
```bash
curl -X GET http://localhost:3000/api/users/roles/list \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
[
  {
    "role": "ADMINISTRADOR",
    "description": "Controle total sobre o sistema"
  },
  {
    "role": "MEDICO",
    "description": "Acesso completo aos históricos e registros médicos"
  },
  {
    "role": "RECEPCIONISTA",
    "description": "Atendimento inicial e agendamentos"
  },
  {
    "role": "SERVICOS_GERAIS",
    "description": "Manutenção e organização das instalações"
  }
]
```

### **10. INFORMAÇÕES DO ROLE - Detalhes de um Role Específico**
```bash
curl -X GET http://localhost:3000/api/users/roles/MEDICO \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "role": "MEDICO",
  "description": "Acesso completo aos históricos e registros médicos",
  "permissions": [
    "patients:read",
    "patients:write",
    "appointments:read",
    "appointments:write",
    "medical_records:read",
    "medical_records:write"
  ]
}
```

## **🔐 PERMISSÕES NECESSÁRIAS**

- **Criar, Listar, Buscar, Atualizar, Deletar, Alternar Status, Estatísticas, Listar Roles, Informações do Role**: Requer role `ADMINISTRADOR`
- **Perfil do Usuário**: Acesso para usuários autenticados

## **📝 ROLES DISPONÍVEIS**

- **ADMINISTRADOR**: Controle total sobre o sistema
- **MEDICO**: Acesso completo aos históricos e registros médicos
- **RECEPCIONISTA**: Atendimento inicial e agendamentos
- **SERVICOS_GERAIS**: Manutenção e organização das instalações

## **⚠️ OBSERVAÇÕES**

- Todos os endpoints (exceto `/me`) requerem autenticação e role de `ADMINISTRADOR`
- O endpoint `/me` é acessível para qualquer usuário autenticado
- IDs são CUIDs (Collision-resistant Unique Identifier) válidos
- Senhas devem ter no mínimo 6 caracteres
- Emails devem ser válidos e únicos no sistema
- Nomes devem ter no mínimo 3 caracteres
- **IMPORTANTE**: Não é possível deletar usuários com role `ADMINISTRADOR` por segurança
