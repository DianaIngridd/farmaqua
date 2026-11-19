# Testes automatizados do Farmaqua

Copie o conteúdo de `src/back/` desta pasta para `src/back/` do projeto (substituindo `server.js` e `package.json`
ou mesclando as mudanças — veja `refatoracao-antes-depois.md`).

## 1. Instalar
```bash
cd src/back
npm install
```
Dependências de teste (já em `devDependencies`): `jest`, `supertest`, `selenium-webdriver`
e `sweetalert2`/`bootstrap`/`chart.js` (só para o modo offline dos E2E).

## 2. Rodar
| Comando | O que roda | Precisa de |
|---|---|---|
| `npm run test:unit` | 10 testes unitários (CT-U01…U10) | nada |
| `npm run test:api` | 10 testes de integração da API (CT-API01…10), banco em memória | nada |
| `npm test` | unitários + integração | nada |
| `npm run test:e2e` | 10 testes funcionais Selenium (CT-E01…E10) | Google Chrome instalado |

Os E2E sobem sozinhos um servidor de teste na porta 3100 **com banco em memória**: nenhum dado é gravado no
MongoDB Atlas. Para testar um servidor seu (ex.: MongoDB local), inicie-o e informe o endereço:
```bash
export MONGODB_URI=mongodb://localhost:27017/farmaqua_teste
npm start                                   # terminal 1
BASE_URL=http://localhost:3000 npm run test:e2e   # terminal 2
```

Opções úteis dos E2E: `HEADLESS=0` (ver o Chrome abrindo), `OFFLINE_CDN=1` (sem internet),
`CHROMEDRIVER_PATH=/caminho/chromedriver` (se o Selenium Manager não conseguir baixar o driver).

## 3. Importante
- `server.js` agora lê `MONGODB_URI` do ambiente (a string do Atlas **não** fica mais no código). Defina a variável
  antes de `npm start`. **Troque a senha do usuário do Atlas**: a anterior está no histórico do GitHub.
- Testes que **falham** são defeitos reais do sistema (ver relatório de defeitos), não erros da suíte.

## 4. Estrutura
```
src/back/
├─ utils/calculos.js            regras extraídas do server.js (refatoração)
├─ jest.config.js               unit + api
├─ jest.e2e.config.js           suíte Selenium
└─ tests/
   ├─ unit/                     calculos.test.js, models.test.js
   ├─ api/                      api.integration.test.js (supertest)
   ├─ e2e/                      *.e2e.js (Selenium) + helpers/driver.js + global-setup/teardown
   └─ support/                  memory-db.js (banco em memória), start-test-server.js
```
