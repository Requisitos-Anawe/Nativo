# API: Aplicativo tradutor de línguas indígenas

É necessário ter a chave json do firebase na pasta credentials

É necessário configurar o .env com o bucket do firestore e JWT secret

``` bash
pip install -r requirements.txt
.\.venv\Scripts\activate # source .venv/bin/activate
python run.py
``` 

## Seeds

``` bash
python -m app.seeds.seed
``` 

## Testes

> unittest.TestCase

Exemplo:

``` bash
python -m unittest tests/test_discurso_route.py
``` 

## Rotas

### Usuario

#### ➕ Criar Usuário

`POST /usuarios`

Cria um novo usuário no sistema.

##### 🔑 Autenticação

* Requer envio de **JWT Token** válido no header:

```
Authorization: Bearer <seu_token>
```

##### 📥 Request Body

```json
{
  "email": "joao@email.com",
  "senha": "senhaSegura123!",
  "data_nascimento": "1998-06-12",
  "nome": "João da Silva",
  "perfil": "perfil/1"
}
```

* `perfil` deve ser o caminho/referência ao documento de perfil no Firestore (ex: `"perfil/1"`).

##### 📤 Response (201 – Sucesso)

```json
{
  "id": "abc123",
  "email": "joao@email.com",
  "senha": "senhaSegura123!",
  "data_nascimento": "1998-06-12",
  "nome": "João da Silva",
  "data_criacao": "2025-08-28T14:30:00-03:00",
  "perfil": "perfil/1"
}
```

##### ⚠️ Possíveis Erros

* **400** – Erros de validação (exemplo):

```json
{
  "email": ["Formato inválido"],
  "senha": ["A senha deve conter letras maiúsculas, minúsculas e caracteres especiais"]
}
```

* **401** – `{"erro": "Token inválido ou ausente"}`
* **500** – `{"erro": "Erro interno no servidor"}`

#### 📋 Listar Usuários

`GET /usuarios`

Retorna a lista de todos os usuários cadastrados.

##### 🔑 Autenticação

* **Obrigatória** → enviar token JWT no header `Authorization: Bearer <token>`.

##### 📤 Response (200 – Sucesso)

```json
[
  {
    "id": "abc123",
    "email": "joao@email.com",
    "data_nascimento": "1998-06-12",
    "nome": "João da Silva",
    "data_criacao": "2025-08-28T14:30:00-03:00",
    "perfil": {
      "id": "1",
      "descricao": "Administrador"
    }
  },
  {
    "id": "xyz789",
    "email": "maria@email.com",
    "data_nascimento": "1995-04-20",
    "nome": "Maria Souza",
    "data_criacao": "2025-08-20T10:15:00-03:00",
    "perfil": {
      "id": "2",
      "descricao": "Usuário Comum"
    }
  }
]
```

##### ⚠️ Possíveis Respostas Especiais

* Se o perfil do usuário não existir no Firestore:

```json
{
  "perfil": "Perfil não encontrado"
}
```

* Se o campo `perfil` não for uma referência válida:

```json
{
  "perfil": "Perfil indefinido"
}
```

##### 📤 Response (401 – Não autorizado)

```json
{
  "erro": "Token inválido ou ausente"
}
```

#### 🔍 Buscar Usuário por ID

`GET /usuarios/<usuario_id>`

Retorna os dados de um usuário específico.

##### 🔑 Autenticação

* **Obrigatória** → enviar token JWT no header `Authorization: Bearer <token>`.

##### 📥 Parâmetros de URL

* `usuario_id` → ID do documento do usuário no Firestore.

##### 📤 Response (200 – Sucesso)

```json
{
  "id": "abc123",
  "email": "joao@email.com",
  "data_nascimento": "1998-06-12",
  "nome": "João da Silva",
  "data_criacao": "2025-08-28T14:30:00-03:00",
  "perfil": {
    "id": "1",
    "descricao": "Administrador"
  }
}
```

##### 📤 Response (404 – Não encontrado)

```json
{
  "erro": "Usuário não encontrado"
}
```

##### 📤 Response (401 – Não autorizado)

```json
{
  "erro": "Token inválido ou ausente"
}
```

#### Atualizar Perfil do Usuário

`PUT /usuario/<usuario_id>/perfil`

Atualiza o perfil de um usuário específico. Apenas administradores podem executar esta operação.
Não é permitido alterar o perfil de usuários com perfil "admin".

##### Headers

| Header        | Tipo   | Obrigatório | Descrição                             |
| ------------- | ------ | ----------- | ------------------------------------- |
| Authorization | string | Sim         | Token JWT no formato `Bearer <token>` |

##### Parâmetros de URL

| Parâmetro   | Tipo   | Obrigatório | Descrição                                 |
| ----------- | ------ | ----------- | ----------------------------------------- |
| usuario\_id | string | Sim         | ID do usuário cujo perfil será atualizado |

##### Corpo da Requisição (JSON)

```json
{
  "perfil_id": "string"
}
```

| Campo      | Tipo   | Obrigatório | Descrição                                    |
| ---------- | ------ | ----------- | -------------------------------------------- |
| perfil\_id | string | Sim         | ID do novo perfil a ser atribuído ao usuário |

##### Respostas

**200 OK**
Perfil atualizado com sucesso.

```json
{
  "mensagem": "Perfil do usuário atualizado com sucesso"
}
```

**400 Bad Request**
ID do perfil não fornecido.

```json
{
  "erro": "ID do novo perfil não fornecido"
}
```

**403 Forbidden**
Tentativa de alterar perfil de usuário administrador.

```json
{
  "erro": "Não é permitido alterar o perfil de um administrador"
}
```

**404 Not Found**
Usuário ou perfil não encontrado.

```json
{
  "erro": "Usuário não encontrado"
}
```

ou

```json
{
  "erro": "Perfil não encontrado"
}
```

**500 Internal Server Error**
Erro inesperado ao atualizar o perfil.

```json
{
  "erro": "Erro ao atualizar perfil: <mensagem do erro>"
}
```

### Upload de Arquivo

`POST /upload`

Faz upload de um arquivo para o storage do aplicativo e retorna a URL pública do arquivo enviado.

##### Headers

| Header        | Tipo   | Obrigatório | Descrição                             |
| ------------- | ------ | ----------- | ------------------------------------- |
| Authorization | string | Sim         | Token JWT no formato `Bearer <token>` |

##### Corpo da Requisição (multipart/form-data)

| Campo | Tipo    | Obrigatório | Descrição             |
| ----- | ------- | ----------- | --------------------- |
| file  | arquivo | Sim         | Arquivo a ser enviado |

##### Respostas

**200 OK**
Upload realizado com sucesso.

```json
{
  "message": "Arquivo enviado com sucesso",
  "url": "https://storage.googleapis.com/<bucket>/<nome_do_arquivo>"
}
```

**400 Bad Request**
Nenhum arquivo enviado.

```json
{
  "error": "Nenhum arquivo enviado"
}
```

**500 Internal Server Error**
Erro inesperado durante o upload.

```json
{
  "error": "Erro ao enviar arquivo: <mensagem do erro>"
}
```

### Discurso

#### Buscar Discurso

`POST /discurso/buscar`

Busca um discurso e suas traduções pelo texto. É possível filtrar por idioma.

##### Headers

| Header        | Tipo   | Obrigatório | Descrição                                                               |
| ------------- | ------ | ----------- | ----------------------------------------------------------------------- |
| Authorization | string | Opcional    | Token JWT no formato `Bearer <token>` se houver autenticação necessária |

##### Corpo da Requisição (JSON)

| Campo  | Tipo   | Obrigatório | Descrição                                      |
| ------ | ------ | ----------- | ---------------------------------------------- |
| texto  | string | Sim         | Texto do discurso a ser buscado                |
| idioma | string | Não         | ID ou código do idioma para filtrar resultados |

##### Respostas

**200 OK**
Discurso encontrado. Retorna os dados do discurso e traduções.

```json
{
  "id": "discurso_id",
  "texto": "Texto do discurso",
  "idioma": {
    "id": "idioma_id",
    "nome": "Português",
    "data_criacao": "15/08/2025 15:13"
  },
  "data_criacao": "15/08/2025 15:13",
  "traducao": [
    {
      "id": "traducao_id",
      "texto": "Texto traduzido",
      "idioma": {
        "id": "idioma_id",
        "nome": "Inglês",
        "data_criacao": "15/08/2025 15:13"
      },
      "usuario": "Nome do usuário",
      "data_criacao": "15/08/2025 15:13"
    }
  ]
}
```

**400 Bad Request**
Campo obrigatório não fornecido.

```json
{
  "erro": "Campo 'texto' é obrigatório no corpo da requisição."
}
```

**404 Not Found**
Discurso não encontrado.

```json
{
  "erro": "Discurso não encontrado."
}
```

### Traducao

#### **Buscar Tradução por ID**

**Endpoint:** `GET /traducao/<traducao_id>`
**Permissões:** Professor
**Descrição:** Retorna a tradução e o discurso associado, incluindo idiomas e categoria.

**Parâmetros da URL:**

* `traducao_id` (string) — ID da tradução.

**Exemplo de Requisição:**

```http
GET /traducao/abc123
Authorization: Bearer <token_jwt>
```

**Exemplo de Resposta (200 OK):**

```json
{
  "id": "abc123",
  "texto": "Texto da tradução",
  "usuario": "usuario_id",
  "idioma": {
    "id": "idioma_id",
    "nome": "Português"
  },
  "discurso": {
    "id": "discurso_id",
    "texto": "Texto original do discurso",
    "data_criacao": "2025-08-28T10:00:00",
    "idioma": {
      "id": "idioma_id",
      "nome": "Munduruku"
    },
    "discurso_categoria": {
      "id": "categoria_id",
      "nome": "Religião"
    },
    "usuario": "usuario_id"
  }
}
```

---

#### **Editar Tradução e Discurso (completo)**

**Endpoint:** `PUT /traducao/discurso/edit-completo/<traducao_id>`
**Permissões:** Professor
**Descrição:** Permite atualizar o texto, idioma e categoria da tradução e do discurso. Apenas campos fornecidos são atualizados.

**Parâmetros da URL:**

* `traducao_id` (string) — ID da tradução a ser editada.

**Corpo da Requisição (JSON):**

```json
{
  "texto_traducao": "Novo texto da tradução",
  "idioma_traducao_id": "novo_idioma_traducao_id",
  "texto_discurso": "Novo texto do discurso",
  "idioma_discurso_id": "novo_idioma_discurso_id",
  "discurso_categoria_id": "nova_categoria_id"
}
```

**Respostas:**

* **200 OK:** Atualização realizada com sucesso.

```json
{"mensagem": "Tradução e discurso atualizados com sucesso"}
```

* **400 Bad Request:** Dados inválidos ou conflito de idiomas.
* **500 Internal Server Error:** Erro inesperado.

---

#### **Listar Traduções de um Usuário**

**Endpoint:** `POST /traducao/usuario/<usuario_id>`
**Permissões:** Professor
**Descrição:** Retorna todas traduções de um usuário, filtrando por texto do discurso e idioma.

**Parâmetros da URL:**

* `usuario_id` (string) — ID do usuário.

**Corpo da Requisição (opcional):**

```json
{
  "textoDiscurso": "palavra-chave",
  "idiomaDiscurso": "idioma_id"
}
```

**Resposta (200 OK):**

```json
[
  {
    "id": "traducao_id",
    "texto": "Texto da tradução",
    "discurso": "Texto do discurso",
    "idioma": "Português",
    "usuario": "usuario_id",
    "data_criacao": "28/08/2025 10:00"
  }
]
```

---

#### **Cadastrar Tradução**

**Endpoint:** `POST /traducao/cadastrar`
**Permissões:** Professor
**Descrição:** Cadastra um novo discurso e tradução.

**Corpo da Requisição (JSON):**

```json
{
  "discurso_texto": "Texto do discurso",
  "traducao_texto": "Texto da tradução",
  "idioma_discurso_id": "id_idioma_discurso",
  "idioma_traducao_id": "id_idioma_traducao",
  "discurso_categoria_id": "id_categoria"
}
```

**Respostas:**

* **201 Created:** Tradução cadastrada com sucesso.
* **400 Bad Request:** Campos obrigatórios ausentes ou idiomas iguais.
* **500 Internal Server Error:** Erro ao cadastrar.

---

#### **Listar Traduções com Paginação**

**Endpoint:** `GET /traducao`
**Permissões:** Autenticado
**Parâmetros da Query String (opcional):**

* `pagina` (int, default=1)
* `limite` (int, default=10)

**Resposta (200 OK):**

```json
{
  "total_paginas": 5,
  "total_registros": 50,
  "pagina": 1,
  "limite": 10,
  "traducoes": [
    {
      "id": "traducao_id",
      "texto": "Texto da tradução",
      "data_criacao": "28/08/2025 10:00",
      "usuario": "Nome do usuário",
      "idioma": {"id": "idioma_id", "nome": "Português"},
      "discurso": {
        "id": "discurso_id",
        "texto": "Texto do discurso",
        "data_criacao": "28/08/2025 09:00",
        "idioma": {"id": "idioma_id", "nome": "Munduruku"},
        "discurso_categoria": {"id": "categoria_id", "nome": "Religião"}
      }
    }
  ]
}
```

---

#### **Apagar Tradução**

**Endpoint:** `DELETE /traducao/<traducao_id>`
**Permissões:** Autenticado
**Parâmetros da URL:**

* `traducao_id` (string) — ID da tradução.

**Resposta (200 OK):**

```json
{"mensagem": "Tradução excluída com sucesso"}
```

**Erros:**

* **404 Not Found:** Tradução não encontrada.
* **500 Internal Server Error:** Erro inesperado ao excluir.

### Auth

Este módulo fornece rotas para autenticação e cadastro de usuários.

#### 🔑 **Login**

`POST /auth/login`

##### 📥 Request Body

```json
{
  "email": "usuario@exemplo.com",
  "senha": "sua_senha"
}
```

##### 📤 Response (200 – Sucesso)

```json
{
  "token": "jwt_token_aqui",
  "usuario": {
    "id": "abc123",
    "nome": "João da Silva",
    "email": "usuario@exemplo.com",
    "data_nascimento": "1999-05-20",
    "perfil": "Usuário Comum"
  }
}
```

##### ⚠️ Possíveis Erros

* **400** – `{"erro": "Email e senha obrigatórios"}`
* **404** – `{"erro": "Email ou senha incorretos"}`
* **401** – `{"erro": "Email ou senha incorretos"}`

---

#### 📝 **Cadastro**

`POST /auth/cadastro`

##### 📥 Request Body

```json
{
  "email": "novo@exemplo.com",
  "senha": "SenhaSegura123!",
  "nome": "Maria Oliveira",
  "data_nascimento": "2000-08-15"
}
```

##### 📤 Response (201 – Sucesso)

```json
{
  "mensagem": "Usuário cadastrado com sucesso"
}
```

##### ⚠️ Possíveis Erros

* **400** – `{"erro": "Todos os campos são obrigatórios"}`
* **400** – `{"erro": "Campo 'data_nascimento' deve ser um datetime válido."}`
* **400** – `{"erro": "E-mail inválido."}`
* **400** – `{"erro": "Senha inválida", "detalhes": [...]}`
* **400** – `{"erro": "Email já cadastrado"}`

---

#### 📌 Observações

* O login retorna um **JWT Token** válido por **12 horas**.
* O cadastro atribui por padrão o perfil com `id = 1`.
* O campo `senha` é armazenado criptografado com **bcrypt**.

### Categoria

#### 🔍 Listar Categorias

`GET /categorias`

Retorna todas as categorias de discursos cadastradas no sistema, ordenadas por descrição.

##### 🔑 Autenticação

* Requer envio de **JWT Token** válido no header:

```
Authorization: Bearer <seu_token>
```

##### 📤 Response (200 – Sucesso)

```json
[
  {
    "id": "abc123",
    "descricao": "Saudação",
    "data_criacao": "2025-07-15T10:30:00"
  },
  {
    "id": "def456",
    "descricao": "Despedida",
    "data_criacao": "2025-07-16T14:10:00"
  }
]
```

##### ⚠️ Possíveis Erros

* **401** – `{"erro": "Token inválido ou ausente"}`
* **500** – `{"erro": "Erro interno no servidor"}`

### Idioma

#### 🔍 Listar Idiomas

`GET /idiomas`

Retorna todos os idiomas cadastrados no sistema, ordenados pelo campo **nome**.

##### 🔑 Autenticação

* Requer envio de **JWT Token** válido no header:

```
Authorization: Bearer <seu_token>
```

##### 📤 Response (200 – Sucesso)

```json
[
  {
    "id": "abc123",
    "nome": "Português",
    "data_criacao": "2025-07-10T09:15:00"
  },
  {
    "id": "def456",
    "nome": "Inglês",
    "data_criacao": "2025-07-11T11:45:00"
  }
]
```

##### ⚠️ Possíveis Erros

* **401** – `{"erro": "Token inválido ou ausente"}`
* **500** – `{"erro": "Erro interno no servidor"}`

### Perfil

#### 🔍 Listar Perfis

`GET /perfis`

Retorna todos os perfis cadastrados no sistema, ordenados pela **descrição**.

##### 🔑 Autenticação

* Requer envio de **JWT Token** válido no header:

```
Authorization: Bearer <seu_token>
```

##### 📤 Response (200 – Sucesso)

```json
[
  {
    "id": "abc123",
    "descricao": "Administrador",
    "data_criacao": "2025-07-10T09:15:00"
  },
  {
    "id": "def456",
    "descricao": "Usuário",
    "data_criacao": "2025-07-11T11:45:00"
  }
]
```

##### ⚠️ Possíveis Erros

* **401** – `{"erro": "Token inválido ou ausente"}`
* **500** – `{"erro": "Erro interno no servidor"}`
