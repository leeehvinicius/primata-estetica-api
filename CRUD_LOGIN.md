# CRUD de Autenticação e Login - Primata Estética API

## **📋 ENDPOINTS**

### **1. LOGIN - Autenticar Usuário**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@primata.com", "password": "admin123"}'
```
**Retorna:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **2. REFRESH - Renovar Token**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer {refresh_token}"
```
**Retorna:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **3. LOGOUT - Encerrar Sessão**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "success": true
}
```

### **4. PERFIL - Dados do Usuário Logado**
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer {access_token}"
```
**Retorna:**
```json
{
  "id": "clucentral",
  "email": "admin@primata.com",
  "profile": {
    "id": "profile123",
    "name": "Administrador",
    "role": "ADMINISTRADOR",
    "isActive": true
  }
}
```
