# CRUD SERVIÇOS - API Primata Estética

Documentação completa dos endpoints para gerenciamento de serviços estéticos.

## 🔐 **AUTENTICAÇÃO**

Todos os endpoints requerem autenticação JWT. Inclua o token no header:
```bash
Authorization: Bearer {access_token}
```

## 📋 **ENDPOINTS DISPONÍVEIS**

### 1. **CRIAR SERVIÇO**
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "name": "Limpeza de Pele Profunda",
    "description": "Limpeza completa com extração de comedões",
    "category": "SKIN_CLEANING",
    "duration": 60,
    "basePrice": 120.00,
    "currentPrice": 120.00,
    "requiresProfessional": true,
    "maxConcurrentClients": 1,
    "preparationTime": 10,
    "recoveryTime": 15,
    "contraindications": "Pele muito sensível, acne ativo",
    "benefits": "Pele mais limpa e renovada",
    "notes": "Recomendado para todos os tipos de pele",
    "isActive": true
  }'
```

**Permissões:** `ADMINISTRADOR` com permissão `services:create`

**Resposta de Sucesso (201):**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "name": "Limpeza de Pele Profunda",
  "description": "Limpeza completa com extração de comedões",
  "category": "SKIN_CLEANING",
  "duration": 60,
  "basePrice": 120.00,
  "currentPrice": 120.00,
  "requiresProfessional": true,
  "maxConcurrentClients": 1,
  "preparationTime": 10,
  "recoveryTime": 15,
  "contraindications": "Pele muito sensível, acne ativo",
  "benefits": "Pele mais limpa e renovada",
  "notes": "Recomendado para todos os tipos de pele",
  "isActive": true,
  "createdAt": "2024-12-01T10:00:00.000Z",
  "updatedAt": "2024-12-01T10:00:00.000Z"
}
```

---

### 2. **LISTAR SERVIÇOS**
```bash
curl -X GET "http://localhost:3000/api/services?page=1&limit=10&search=limpeza&category=SKIN_CLEANING&isActive=true&minPrice=50&maxPrice=200&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer {access_token}"
```

**Parâmetros de Query:**
- `page` (opcional): Página atual (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)
- `search` (opcional): Buscar por nome ou descrição
- `category` (opcional): Filtrar por categoria
- `isActive` (opcional): Filtrar por status ativo
- `minPrice` (opcional): Preço mínimo
- `maxPrice` (opcional): Preço máximo
- `sortBy` (opcional): Campo para ordenação
- `sortOrder` (opcional): Direção da ordenação (asc/desc)

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
{
  "services": [
    {
      "id": "cmf1tiw75007akw4cpb8rkowm",
      "name": "Limpeza de Pele Profunda",
      "description": "Limpeza completa com extração de comedões",
      "category": "SKIN_CLEANING",
      "duration": 60,
      "currentPrice": 120.00,
      "isActive": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNext": false,
  "hasPrev": false
}
```

---

### 3. **BUSCAR SERVIÇO POR ID**
```bash
curl -X GET http://localhost:3000/api/services/cmf1tiw75007akw4cpb8rkowm \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "name": "Limpeza de Pele Profunda",
  "description": "Limpeza completa com extração de comedões",
  "category": "SKIN_CLEANING",
  "duration": 60,
  "basePrice": 120.00,
  "currentPrice": 120.00,
  "requiresProfessional": true,
  "maxConcurrentClients": 1,
  "preparationTime": 10,
  "recoveryTime": 15,
  "contraindications": "Pele muito sensível, acne ativo",
  "benefits": "Pele mais limpa e renovada",
  "notes": "Recomendado para todos os tipos de pele",
  "isActive": true,
  "createdAt": "2024-12-01T10:00:00.000Z",
  "updatedAt": "2024-12-01T10:00:00.000Z"
}
```

---

### 4. **ATUALIZAR SERVIÇO**
```bash
curl -X PUT http://localhost:3000/api/services/cmf1tiw75007akw4cpb8rkowm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "currentPrice": 150.00,
    "description": "Limpeza profunda com hidratação",
    "notes": "Inclui máscara hidratante"
  }'
```

**Permissões:** `ADMINISTRADOR` com permissão `services:update`

**Resposta de Sucesso (200):**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "name": "Limpeza de Pele Profunda",
  "description": "Limpeza profunda com hidratação",
  "category": "SKIN_CLEANING",
  "duration": 60,
  "basePrice": 120.00,
  "currentPrice": 150.00,
  "requiresProfessional": true,
  "maxConcurrentClients": 1,
  "preparationTime": 10,
  "recoveryTime": 15,
  "contraindications": "Pele muito sensível, acne ativo",
  "benefits": "Pele mais limpa e renovada",
  "notes": "Inclui máscara hidratante",
  "isActive": true,
  "createdAt": "2024-12-01T10:00:00.000Z",
  "updatedAt": "2024-12-01T11:00:00.000Z"
}
```

---

### 5. **DELETAR SERVIÇO**
```bash
curl -X DELETE http://localhost:3000/api/services/cmf1tiw75007akw4cpb8rkowm \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR` com permissão `services:delete`

**Resposta de Sucesso (200):**
```json
{
  "message": "Serviço deletado com sucesso"
}
```

---

### 6. **ALTERNAR STATUS DO SERVIÇO**
```bash
curl -X PATCH http://localhost:3000/api/services/cmf1tiw75007akw4cpb8rkowm/toggle-status \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR` com permissão `services:update`

**Resposta de Sucesso (200):**
```json
{
  "id": "cmf1tiw75007akw4cpb8rkowm",
  "name": "Limpeza de Pele Profunda",
  "isActive": false,
  "updatedAt": "2024-12-01T12:00:00.000Z"
}
```

---

### 7. **ESTATÍSTICAS DOS SERVIÇOS**
```bash
curl -X GET http://localhost:3000/api/services/stats/overview \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
{
  "total": 25,
  "active": 23,
  "inactive": 2,
  "byCategory": {
    "FACIAL_TREATMENT": 8,
    "BODY_TREATMENT": 6,
    "SKIN_CLEANING": 4,
    "HAIR_REMOVAL": 3,
    "AESTHETIC_PROCEDURE": 2,
    "CONSULTATION": 1,
    "MAINTENANCE": 1
  },
  "averagePrice": 145.50,
  "averageDuration": 45,
  "totalRevenue": 12500.00
}
```

---

### 8. **BUSCAR SERVIÇOS POR NOME**
```bash
curl -X GET http://localhost:3000/api/services/search/name/limpeza \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Limpeza de Pele Profunda",
    "category": "SKIN_CLEANING",
    "currentPrice": 150.00,
    "duration": 60
  }
]
```

---

### 9. **BUSCAR SERVIÇOS POR CATEGORIA**
```bash
curl -X GET http://localhost:3000/api/services/search/category/SKIN_CLEANING \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Limpeza de Pele Profunda",
    "currentPrice": 150.00,
    "duration": 60
  },
  {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Peeling Químico",
    "currentPrice": 200.00,
    "duration": 45
  }
]
```

---

### 10. **BUSCAR SERVIÇOS POR FAIXA DE PREÇO**
```bash
curl -X GET http://localhost:3000/api/services/search/price-range/100/200 \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Limpeza de Pele Profunda",
    "category": "SKIN_CLEANING",
    "currentPrice": 150.00,
    "duration": 60
  }
]
```

---

### 11. **BUSCAR SERVIÇOS POR DURAÇÃO MÁXIMA**
```bash
curl -X GET http://localhost:3000/api/services/search/duration/60 \
  -H "Authorization: Bearer {access_token}"
```

**Permissões:** `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` com permissão `services:read`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "cmf1tiw75007akw4cpb8rkowm",
    "name": "Limpeza de Pele Profunda",
    "category": "SKIN_CLEANING",
    "currentPrice": 150.00,
    "duration": 60
  }
]
```

---

## 🏷️ **CATEGORIAS DISPONÍVEIS**

```typescript
enum ServiceCategory {
  FACIAL_TREATMENT    // Tratamentos faciais
  BODY_TREATMENT      // Tratamentos corporais
  HAIR_REMOVAL        // Depilação
  SKIN_CLEANING       // Limpeza de pele
  AESTHETIC_PROCEDURE // Procedimentos estéticos
  CONSULTATION        // Consultas
  MAINTENANCE         // Manutenção
  OTHER               // Outros
}
```

## 🔑 **PERMISSÕES REQUERIDAS**

| Endpoint | Roles | Permissão |
|----------|-------|------------|
| **POST** `/services` | `ADMINISTRADOR` | `services:create` |
| **GET** `/services` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |
| **GET** `/services/:id` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |
| **PUT** `/services/:id` | `ADMINISTRADOR` | `services:update` |
| **DELETE** `/services/:id` | `ADMINISTRADOR` | `services:delete` |
| **PATCH** `/services/:id/toggle-status` | `ADMINISTRADOR` | `services:update` |
| **GET** `/services/stats/overview` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |
| **GET** `/services/search/name/:name` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |
| **GET** `/services/search/category/:category` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |
| **GET** `/services/search/price-range/:minPrice/:maxPrice` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |
| **GET** `/services/search/duration/:maxDuration` | `ADMINISTRADOR`, `MEDICO`, `RECEPCIONISTA` | `services:read` |

## 📝 **CAMPOS DO SERVIÇO**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ | Nome do serviço |
| `description` | string | ❌ | Descrição detalhada |
| `category` | ServiceCategory | ✅ | Categoria do serviço |
| `duration` | number | ✅ | Duração em minutos |
| `basePrice` | number | ✅ | Preço base |
| `currentPrice` | number | ✅ | Preço atual |
| `requiresProfessional` | boolean | ❌ | Se requer profissional (padrão: true) |
| `maxConcurrentClients` | number | ❌ | Máximo de clientes simultâneos (padrão: 1) |
| `preparationTime` | number | ❌ | Tempo de preparação em minutos |
| `recoveryTime` | number | ❌ | Tempo de recuperação em minutos |
| `contraindications` | string | ❌ | Contraindicações |
| `benefits` | string | ❌ | Benefícios do serviço |
| `notes` | string | ❌ | Observações gerais |
| `isActive` | boolean | ❌ | Status ativo (padrão: true) |

## ⚠️ **OBSERVAÇÕES**

- **IDs são CUIDs** (Collision-resistant Unique Identifier) válidos
- Todos os endpoints requerem autenticação
- Apenas administradores podem criar, atualizar e deletar serviços
- Médicos e recepcionistas podem visualizar e buscar serviços
- Serviços inativos não aparecem nas buscas por padrão
- Preços são armazenados como números decimais com 2 casas
- Duração é sempre em minutos
- Categorias são pré-definidas e não podem ser alteradas
- Serviços com agendamentos ativos não podem ser deletados
