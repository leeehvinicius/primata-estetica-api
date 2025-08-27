# Endpoint de Login - Primata Estética API

## **URL:** `POST /api/auth/login`

## **Headers:**
```
Content-Type: application/json
```

## **Body (JSON):**
```json
{
  "email": "admin@primata.com",
  "password": "admin123"
}
```

## **RESPOSTA RETORNADA:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHVkY2VudHJhbCIsImVtYWlsIjoiYWRtaW5AcHJpbWF0YS5jb20iLCJyb2xlIjoiQURNSU5JU1RSQURPUiIsImlhdCI6MTczNDgwMDAwMCwiZXhwIjoxNzM0ODA0MDAwfQ.example",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHVkY2VudHJhbCIsImVtYWlsIjoiYWRtaW5AcHJpbWF0YS5jb20iLCJyb2xlIjoiQURNSU5JU1RSQURPUiIsImlhdCI6MTczNDgwMDAwMCwiZXhwIjoxNzM0ODg2NDAwfQ.example"
}
```

## **DETALHES COMPLETOS DO QUE RETORNA:**

### **access_token:**
- **Tipo:** JWT Token (JSON Web Token)
- **Conteúdo decodificado:**
  ```json
  {
    "sub": "clucentral",           // ID do usuário
    "email": "admin@primata.com",  // Email do usuário
    "role": "ADMINISTRADOR",       // Role/perfil do usuário
    "iat": 1734800000,            // Timestamp de criação
    "exp": 1734804000             // Timestamp de expiração
  }
  ```
- **Validade:** 1 hora (configurável)
- **Uso:** Autenticar todas as requisições à API

### **refresh_token:**
- **Tipo:** JWT Token (JSON Web Token)
- **Conteúdo decodificado:**
  ```json
  {
    "sub": "clucentral",           // ID do usuário
    "email": "admin@primata.com",  // Email do usuário
    "role": "ADMINISTRADOR",       // Role/perfil do usuário
    "iat": 1734800000,            // Timestamp de criação
    "exp": 1734886400             // Timestamp de expiração
  }
  ```
- **Validade:** 24 horas (configurável)
- **Uso:** Renovar o access_token quando expirar

## **ROLES/PERFIS DISPONÍVEIS:**

```typescript
enum Role {
  ADMINISTRADOR    // Controle total sobre o sistema
  MEDICO          // Acesso completo aos históricos e registros médicos
  RECEPCIONISTA   // Atendimento inicial e agendamentos
  SERVICOS_GERAIS // Manutenção e organização das instalações
}
```

## **EXEMPLO DE USO COM CURL:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@primata.com",
    "password": "admin123"
  }'
```

## **EXEMPLO DE USO COM FETCH (JavaScript):**

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@primata.com',
    password: 'admin123'
  })
});

const tokens = await response.json();
console.log('Access Token:', tokens.access_token);
console.log('Refresh Token:', tokens.refresh_token);

// Decodificar o token para ver as informações
const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1]));
console.log('User Role:', tokenPayload.role);
console.log('User ID:', tokenPayload.sub);
console.log('Expires:', new Date(tokenPayload.exp * 1000));
```

## **USO DO TOKEN:**

Após receber o `access_token`, use-o no header `Authorization` para outras requisições:

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## **EXEMPLO DE DECODIFICAÇÃO DO TOKEN:**

```javascript
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

const tokenInfo = decodeJWT(tokens.access_token);
console.log('Token Info:', tokenInfo);
```

## **OUTROS ENDPOINTS DE AUTENTICAÇÃO:**

### **Refresh Token:**
- **URL:** `POST /api/auth/refresh`
- **Headers:** `Authorization: Bearer {refresh_token}`
- **Retorna:** Novos `access_token` e `refresh_token`
- **Uso:** Renovar tokens expirados

### **Logout:**
- **URL:** `POST /api/auth/logout`
- **Headers:** `Authorization: Bearer {access_token}`
- **Retorna:** `{ "success": true }`
- **Uso:** Invalidar tokens ativos

## **VALIDAÇÕES E ERROS:**

### **Erro 401 - Credenciais Inválidas:**
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "error": "Unauthorized"
}
```

### **Erro 401 - Usuário Inativo:**
```json
{
  "statusCode": 401,
  "message": "Usuário inativo ou sem perfil",
  "error": "Unauthorized"
}
```

### **Erro 400 - Validação:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

## **CONFIGURAÇÕES JWT:**

```typescript
// Configurações dos tokens (em .env)
JWT_ACCESS_SECRET=seu_secret_muito_seguro_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_muito_seguro_aqui
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=24h
```

## **NOTAS IMPORTANTES:**

- O `access_token` deve ser usado para todas as requisições autenticadas
- O `refresh_token` deve ser usado para renovar o `access_token` quando expirar
- Todos os endpoints autenticados requerem o header `Authorization: Bearer {token}`
- A API está configurada com CORS habilitado
- A documentação Swagger está disponível em `/docs`
- Os tokens contêm informações do usuário (ID, email, role)
- O sistema atualiza automaticamente o `lastLogin` do usuário
- Tokens expirados retornam erro 401 e devem ser renovados
- O logout invalida o refresh_token no banco de dados

## **EXEMPLO COMPLETO DE FLUXO:**

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@primata.com', password: 'admin123' })
});

const { access_token, refresh_token } = await loginResponse.json();

// 2. Usar access_token para requisições
const userResponse = await fetch('/api/users/me', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

// 3. Renovar token quando expirar
const refreshResponse = await fetch('/api/auth/refresh', {
  headers: { 'Authorization': `Bearer ${refresh_token}` }
});

const { access_token: newAccessToken } = await refreshResponse.json();

// 4. Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${newAccessToken}` }
});
```
