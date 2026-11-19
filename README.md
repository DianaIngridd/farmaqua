<div align="center">

# 💧 Farmaqua

**Controle inteligente do consumo de água da farmácia de manipulação Oliboti**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Jest](https://img.shields.io/badge/Testes-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Selenium](https://img.shields.io/badge/E2E-Selenium-43B02A?logo=selenium&logoColor=white)](https://www.selenium.dev/)

*Trabalho Interdisciplinar · Sistemas de Informação · PUC Minas (Betim)*
*Disciplina: Teste e Manutenção de Software*

</div>

---

## 📖 Sobre o projeto

O **Farmaqua** é um sistema web para acompanhar o consumo de água da farmácia de manipulação **Oliboti** (Betim – MG).

O funcionário lança a leitura do hidrômetro e o sistema faz o resto: calcula o consumo em litros, compara com as metas, destaca os dias acima da média (**450 L/dia**), gera relatórios em PDF, registra a fatura da Copasa e restringe as funções administrativas ao perfil de gerência.

## ✨ Funcionalidades

| Módulo | O que faz |
|---|---|
| 🔐 **Login e usuários** | Acesso por e-mail e senha, perfis `admin` e `func`, cadastro de colaboradores e menu adaptado ao perfil |
| 🚰 **Lançamento do hidrômetro** | Registro de leitura com data, valor em m³, foto de evidência e tipo de atividade (Normal, Limpeza, Manutenção, Vazamento ou Outro). Edição e exclusão de lançamentos |
| 📊 **Dashboard** | Consumo da última leitura, status (Normal ou Acima), gráfico de linha e as 6 leituras mais recentes |
| 🎯 **Metas e alertas** | Meta mensal em m³ com barra de progresso por faixa, e-mail de alerta e guia de inspeção |
| 📄 **Relatórios** | Download de relatório em PDF por período |
| 💰 **Fatura e financeiro** | Registro da fatura da Copasa, gasto acumulado, previsão e simulador de economia (5%, 10% e 20%) |

### 📐 Regras de negócio principais

- **Consumo (L)** = (leitura atual − leitura anterior) × 1000. Sem leitura anterior, ou com leitura menor, o consumo é `0 L`.
- Consumo acima de **450 L/dia** é destacado em vermelho.
- **Uma meta por mês.** Faixas da barra: `< 75%` 🟢 · `75–89%` 🟡 · `90–100%` 🔴 · `> 100%` ⛔ alerta crítico.
- **Custo** = consumo em m³ × tarifa de **R$ 8,50/m³**.
- Somente `admin` acessa cadastro de usuários, metas, relatórios e fatura.

## 🛠️ Tecnologias

**Front-end:** HTML · Bootstrap 5 · SweetAlert2 · Chart.js
**Back-end:** Node.js 18+ · Express 5 · Multer · PDFKit
**Banco de dados:** MongoDB (Mongoose 9)
**Testes:** Jest · Supertest · Selenium WebDriver

## 🗂️ Estrutura do repositório

```
.
├── src/
│   └── back/
│       ├── server.js            # Servidor Express e rotas
│       ├── utils/
│       │   └── calculos.js      # Regras de negócio extraídas (refatoração)
│       └── tests/
│           ├── unit/            # Testes unitários (Jest)
│           ├── api/             # Testes de integração (Jest + Supertest)
│           ├── e2e/             # Testes funcionais (Selenium + Jest)
│           └── support/         # Banco em memória e servidor de teste
└── docs/                        # Plano do Projeto de Testes
```

> Ajuste a árvore acima caso a organização das pastas do repositório seja diferente.

## 🚀 Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (verificado com Node 22)
- [Google Chrome](https://www.google.com/chrome/) (necessário para os testes E2E)
- MongoDB local ou um cluster separado. **Nunca use o banco de produção para testes.**

### Rodando o sistema

```bash
# 1. Clone o repositório
git clone https://github.com/ICEI-PUC-Minas-PBE-SI-TI/2026-1-p5-tias-grupo-4.git
cd 2026-1-p5-tias-grupo-4/src/back

# 2. Instale as dependências
npm install

# 3. Configure a conexão com o banco
export MONGODB_URI=mongodb://localhost:27017/farmaqua_teste

# 4. Inicie o servidor
npm start
```

> 🔒 A string de conexão **não** fica mais no código: o servidor lê a variável de ambiente `MONGODB_URI`.

## 🧪 Testes

O plano de testes cobre os requisitos funcionais **RF-001 a RF-012** e os requisitos de segurança **RNF-002** e **RNF-007**.

```bash
cd src/back

npm run test:unit   # 10 testes unitários            (CT-U01 a CT-U10)
npm run test:api    # 10 testes de integração de API (CT-API01 a CT-API10)
npm run test:e2e    # 10 testes Selenium             (CT-E01 a CT-E10)
```

| Tipo | Qtd | Técnica | Ferramenta |
|---|:---:|---|---|
| Unitário | 10 | Caixa-branca, automatizada | Jest |
| Funcional automatizado | 10 | Caixa-preta, automatizada | Selenium WebDriver + Jest |
| Funcional manual | 10 | Caixa-preta, manual, com prints | Google Chrome + DevTools |
| Integração de API (apoio) | 10 | Caixa-cinza, automatizada | Jest + Supertest |

**Observações**

- Os testes automatizados usam **banco em memória**. Nenhum MongoDB é necessário para rodá-los.
- Os testes E2E precisam de internet para carregar Bootstrap, SweetAlert2 e Chart.js pelos CDNs (ou defina `OFFLINE_CDN=1`).
- Os testes de API existem para confirmar defeitos do servidor. Os **5 testes de API e o CT-E03 que falham são defeitos reais do sistema** (D01 a D06), não erros da suíte.

### 📋 Situação atual

Dos **20 casos automatizados** (unitários e Selenium) executados, **19 passaram e 1 falhou** (CT-E03, defeito D05). Os 10 casos manuais (CT-M01 a CT-M10) foram executados e **6 passaram e 4 falharam**.

## 🐞 Defeitos encontrados

Foram registrados **15 defeitos**, cada um com proposta de solução (detalhes no plano de testes).

| Situação | Qtd | Defeitos |
|---|:---:|---|
| ✅ Corrigido por refatoração | 2 | D07, D08 |
| ✅ Corrigido no código | 1 | D09 (credenciais do banco) |
| ❌ Confirmado por teste automatizado | 6 | D01 a D06 |
| ✅ Confirmado na execução manual | 6 | D10 a D15 |

**Os mais críticos (severidade Alta):**

- **D01.** O servidor não autentica nem autoriza. O perfil vem do cliente (URL e `localStorage`).
- **D02.** A recuperação de senha não existe no servidor, e a tela exibe uma senha fixa.
- **D03.** O cálculo de custo financeiro soma a leitura absoluta do visor em vez do consumo.
- **D09.** A string de conexão do MongoDB Atlas estava exposta no código e no histórico do Git. A conexão agora vem de `MONGODB_URI`, mas **a senha do usuário ainda precisa ser trocada no Atlas**.
- **D10.** As senhas são guardadas e comparadas em texto puro. Recomendação: `bcrypt`.

## 🔧 Refatorações

Dois métodos foram refatorados e agora têm testes de apoio:

1. **Cálculo de consumo duplicado** (`POST /Leitura/Salvar` e `PUT /api/leituras/:id`) virou a função `calcularConsumoLitros`. Elimina a duplicação e o ruído de ponto flutuante (D07). Coberto por `CT-U01` a `CT-U04`.
2. **Período do relatório** (`POST /Relatórios/Gerar`) virou a função `parsePeriodo`. Corrige a exclusão do último dia do mês final e o estouro de fevereiro para março (D08). Coberto por `CT-U10`.

## 🚫 Fora do escopo

Integração com sensores IoT, testes de carga e a infraestrutura do MongoDB Atlas.

## 👥 Equipe

| Nome |
|---|
| Carolina Ambrosia dos Santos |
| Diana Ingrid do Carmo Almeida |
| Guilherme Setragni Freitas |
| Gustavo Lacerda dos Santos Barbosa |
| João Vítor Santos Oliveira |
| Milena Carlos da Silva |
| Natália Silva Oliveira |

**Professora orientadora:** Roselene Henrique Pereira Costa

---

<div align="center">

Pontifícia Universidade Católica de Minas Gerais · Sistemas de Informação · Betim, 2026

</div>
