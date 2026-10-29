# Weather App — Especificação de Produto

> **Fonte:** [discovery.md](./discovery.md) (contexto, personas, decisões D-01 a
> D-05). Esta especificação é a fonte única da verdade para as fases de **Plan**,
> **Tasks**, **Code** e **Test**.
>
> **Rastreabilidade:** os IDs referenciam o discovery — RF/RNF (requisitos),
> D (decisões), S (suposições), R/RP (riscos).

---

## 1. Overview

### 1.1 Visão geral

Aplicação web responsiva (SPA) de previsão do tempo, sem cadastro e sem cobrança
direta ao usuário no MVP.
O usuário busca uma cidade pelo nome, visualiza as condições climáticas atuais
e a previsão de 5 dias (hoje + 4), podendo alternar entre Celsius e Fahrenheit.
A experiência é projetada mobile-first, com tema dark glassmorphism.

### 1.2 Objetivos do produto

- Para uma visita recorrente com cidade salva, apresentar clima atualizado em
  **menos de 10 segundos** no cenário de teste definido em AC-07.4 (persona Mariana).
- Garantir que o usuário sempre saiba **de qual cidade** está vendo o clima
  (desambiguação explícita — persona Ricardo).
- Ser legível e utilizável por usuários de baixa fluência digital, em celulares
  de entrada e redes instáveis (persona Cecília).

### 1.3 Público-alvo

Usuários gerais de língua portuguesa (pt-BR), acessando majoritariamente via
navegador mobile. Personas detalhadas na seção 2 do discovery.

### 1.4 Decisões de produto já fechadas

| ID   | Decisão                                                      |
| ---- | ------------------------------------------------------------- |
| D-01 | Fonte de dados: **Open-Meteo** (geocoding + forecast, sem API key) |
| D-02 | "5 dias" = **hoje + 4 dias**                                  |
| D-03 | Unidade padrão: **Celsius**                                   |
| D-04 | **Sem autenticação e sem persistência de servidor** (100% client-side) |
| D-05 | Idioma da UI: **pt-BR**                                       |

---

## 2. Functional Requirements

| ID    | Requisito                    | Descrição                                                                                                                                                                                                                 | Prioridade |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| FR-01 | Busca de cidades             | Buscar globalmente pelo nome da cidade. Remover espaços externos; iniciar busca após 2 pontos de código Unicode e 300 ms sem novas alterações; exibir no máximo 8 resultados na ordem retornada pelo geocoding. Ignorar respostas de consultas anteriores quando uma consulta mais recente já foi enviada. | Must |
| FR-02 | Desambiguação de cidades     | Cada resultado exibe o nome e região/estado e país quando fornecidos pelo geocoding; se ambos faltarem, exibe latitude/longitude com 2 casas decimais. Sempre exigir seleção explícita, inclusive quando houver apenas um resultado; nunca selecionar automaticamente. | Must |
| FR-03 | Clima atual                  | Após selecionar uma cidade, exibir temperatura atual, condição (texto pt-BR + ícone), sensação térmica, umidade relativa (%) e velocidade do vento (km/h). Exibir a data/hora de referência dos dados fornecida pelo provedor, no fuso da cidade; não rotular como horário de atualização do app. Ignorar respostas tardias de uma cidade que já foi substituída. | Must |
| FR-04 | Previsão diária              | Exibir exatamente hoje + 4 dias no fuso IANA retornado para a cidade: data, máxima, mínima e condição (texto pt-BR + ícone) por dia. A previsão é diária; não há detalhe por hora no MVP. | Must |
| FR-05 | Alternância de unidades      | Um controle acessível alterna as temperaturas atual, sensação, máxima e mínima entre °C e °F sem nova chamada de rede. Converter os valores não arredondados e arredondar apenas para apresentação; vento permanece em km/h no MVP. | Must |
| FR-06 | Estados de interface         | Exibir loading durante consultas, erro em pt-BR com retry manual apenas para falhas transitórias (rede, timeout, HTTP 408/429/5xx), erro sem retry para HTTP 400/401/403/404 e estado vazio quando o geocoding não retornar cidades. Nunca repetir automaticamente uma requisição falha. | Must |
| FR-07 | Persistência local           | Armazenar somente unidade e última cidade (latitude, longitude, nome, região/estado, país e fuso quando disponíveis) no armazenamento local do navegador. Ao reabrir, solicitar clima atualizado; nunca persistir forecast/clima. Sem backend ou sincronização entre dispositivos. | Should |
| FR-08 | Estado inicial               | Sem cidade salva, exibir boas-vindas, campo de busca e instrução curta em pt-BR. Não definir cidade padrão nem solicitar geolocalização no MVP. | Must |

> **Notas de rastreabilidade:**
> - FR-01/FR-02 derivam de RF-01/RF-05 do discovery; parâmetros operacionais
>   (debounce, mínimo de caracteres) promovidos de mitigação (R-02) a requisito.
> - FR-07 permanece *Should*: facilita o fluxo de Mariana, mas não é condição
>   para o uso básico do MVP.
> - FR-08 é novo: o discovery não definia o estado inicial do app (lacuna
>   apontada na crítica de arquitetura).

---

## 3. User Stories

> Formato: "Como [persona], quero [ação] para [valor]". Personas definidas na
> seção 2 do discovery: **Mariana** (planejadora do dia a dia), **Ricardo**
> (viajante a trabalho) e **Cecília** (organizadora de eventos ao ar livre).
> Cada story está conectada a um requisito funcional principal (e secundários,
> quando houver).

| ID    | User Story                                                                                                                                                           | FR principal | FRs secundários |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------- |
| US-01 | Como **Mariana**, quero que o app restaure minha última cidade e carregue o clima atualizado quando essa preferência estiver salva **para** decidir rapidamente se levo guarda-chuva ou casaco. | FR-07 | FR-03 |
| US-02 | Como **Mariana**, quero ver na primeira visita um campo de busca em destaque com instrução curta **para** encontrar minha cidade sem precisar de ajuda externa.           | FR-08        | FR-01           |
| US-03 | Como **Ricardo**, quero buscar qualquer cidade do mundo digitando o nome com sugestões automáticas **para** encontrar rapidamente o destino da minha próxima viagem.      | FR-01        | —               |
| US-04 | Como **Ricardo**, quero ver país e região em cada resultado de cidades homônimas **para** nunca consultar o clima da cidade errada ao fazer a mala.                       | FR-02        | FR-01           |
| US-05 | Como **Ricardo**, quero ver a previsão de 5 dias (hoje + 4) do meu destino **para** decidir que roupas levar na viagem.                                                   | FR-04        | —               |
| US-06 | Como **Ricardo**, quero alternar entre Celsius e Fahrenheit com um toque **para** interpretar as temperaturas no padrão do país que vou visitar.                          | FR-05        | FR-07           |
| US-07 | Como **Cecília**, quero ver a temperatura, a condição do tempo e o vento de forma legível e com bom contraste **para** decidir com confiança se mantenho meu evento ao ar livre. | FR-03   | FR-04           |
| US-08 | Como **Cecília**, quero receber uma mensagem clara e um botão "Tentar novamente" quando a internet falhar **para** não ficar perdida nem achar que o aplicativo quebrou.   | FR-06        | —               |

### Cobertura FR × Stories

| FR    | Stories que o exercitam |
| ----- | ----------------------- |
| FR-01 | US-03 (principal), US-02, US-04 |
| FR-02 | US-04                   |
| FR-03 | US-07 (principal), US-01 |
| FR-04 | US-05 (principal), US-07 |
| FR-05 | US-06                   |
| FR-06 | US-08                   |
| FR-07 | US-01 (principal), US-06 |
| FR-08 | US-02                   |

### Rastreabilidade User Story × Acceptance Criteria × NFR

| User Story | Acceptance Criteria relacionados | NFRs relevantes |
| ---------- | -------------------------------- | --------------- |
| US-01 — Mariana: restaurar cidade habitual e ver clima atualizado | AC-03.1, AC-03.2, AC-07.2, AC-07.3, AC-07.4 | NFR-03 (desempenho), NFR-04 (dados corretos), NFR-08 (privacidade), NFR-12 (locale/fuso) |
| US-02 — Mariana: encontrar a busca na primeira visita | AC-01.1, AC-01.2, AC-08.1 | NFR-01 (responsividade), NFR-02 (acessibilidade), NFR-12 (pt-BR) |
| US-03 — Ricardo: buscar cidades globais com sugestões | AC-01.1–AC-01.6 | NFR-02 (combobox/teclado), NFR-03 (tempo de renderização), NFR-07 (compatibilidade), NFR-11 (debounce/cache), NFR-12 (localização) |
| US-04 — Ricardo: distinguir cidades homônimas | AC-01.2, AC-02.1–AC-02.3 | NFR-01 (layout dos resultados), NFR-02 (teclado/semântica), NFR-07 (compatibilidade), NFR-12 (localização) |
| US-05 — Ricardo: consultar previsão de 5 dias | AC-04.1–AC-04.3 | NFR-01 (responsividade), NFR-02 (acessibilidade), NFR-03 (renderização), NFR-07 (compatibilidade), NFR-12 (locale/fuso) |
| US-06 — Ricardo: alternar °C/°F e reter preferência | AC-05.1–AC-05.4, AC-07.1, AC-07.3 | NFR-02 (controle acessível), NFR-08 (armazenamento local), NFR-12 (formatação) |
| US-07 — Cecília: ler os dados meteorológicos e previsão | AC-03.1–AC-03.5, AC-04.1–AC-04.3 | NFR-01 (leitura em mobile), NFR-02 (contraste/teclado), NFR-03 (desempenho), NFR-04 (integridade), NFR-07 (compatibilidade), NFR-12 (locale/fuso) |
| US-08 — Cecília: entender falha e tentar novamente | AC-06.1–AC-06.6 | NFR-02 (mensagens/controles acessíveis), NFR-04 (recuperação), NFR-09 (resiliência/timeout), NFR-11 (rede), NFR-13 (diagnóstico sem dados pessoais) |

> **NFR-05 (qualidade e gates de lint/build/test)** aplica-se
> transversalmente a todas as stories e critérios. NFRs listados por story são
> os que afetam diretamente seu comportamento ou sua validação.

---

## 4. Acceptance Criteria

> Formato **Gherkin (Given/When/Then)**, em pt-BR com palavras-chave em inglês
> (termos técnicos). Cada critério é objetivo e testável, com valores exatos —
> eles são a base direta dos testes automatizados (Vitest para unit/service,
> Playwright para E2E). A coluna "Teste-alvo" indica onde o critério será
> verificado.

### FR-01 — Busca de cidades

**AC-01.1 — Mínimo de caracteres** *(Teste-alvo: unit + E2E)*

```gherkin
Given o campo de busca está vazio
When o usuário digita exatamente 1 caractere ("S")
Then nenhuma requisição ao serviço de geocoding é disparada
And nenhuma lista de sugestões é exibida
```

**AC-01.2 — Autocomplete com resultados** *(Teste-alvo: E2E)*

```gherkin
Given o campo de busca está em foco
When o usuário digita exatamente 2 caracteres ("Os") e aguarda o debounce
Then uma lista de sugestões é exibida
And a lista contém no máximo 8 itens
And a lista aparece em até 1s após a resposta da API
```

**AC-01.3 — Debounce** *(Teste-alvo: unit)*

```gherkin
Given o campo de busca está em foco
When o usuário digita "Salvador" com intervalos menores que 300ms entre teclas
Then exatamente 1 requisição de geocoding é enviada
And ela ocorre somente 300ms após a última tecla
```

**AC-01.4 — Entrada Unicode segura** *(Teste-alvo: unit do service)*

```gherkin
Given o usuário digitou um nome de cidade com caracteres Unicode ou acentos
When a requisição de geocoding é enviada
Then o termo é tratado como texto e não como HTML ou código executável
And resultados retornados pelo provedor são exibidos sem alterar sua identidade
```

**AC-01.5 — Respostas fora de ordem** *(Teste-alvo: unit + E2E)*

```gherkin
Given uma busca por "São" foi enviada e ainda está pendente
When o usuário altera o termo para "Salvador" e a resposta de "Salvador"
  chega antes da resposta de "São"
Then a lista mostra somente resultados de "Salvador"
And a resposta tardia de "São" não altera a lista
```

**AC-01.6 — Limpar sugestões incompatíveis com o termo** *(Teste-alvo: E2E)*

```gherkin
Given sugestões de "Salvador" estão visíveis
When o usuário altera o termo para um caractere ou somente espaços
Then as sugestões anteriores são removidas
And nenhuma requisição de geocoding é enviada
```

### FR-02 — Desambiguação de cidades

**AC-02.1 — Resultados com país e região** *(Teste-alvo: E2E)*

```gherkin
Given o serviço de geocoding retorna resultados para "Santiago"
When a lista de sugestões é exibida
Then cada item mostra o nome
And mostra país e região/estado quando esses dados estiverem disponíveis
And se país e região/estado estiverem ausentes, mostra latitude e longitude
  com 2 casas decimais e rótulos acessíveis
And itens com o mesmo nome são distinguíveis pelos dados de localização disponíveis
```

**AC-02.2 — Seleção sempre explícita** *(Teste-alvo: E2E)*

```gherkin
Given a lista de sugestões está exibida com 1 ou mais resultados
When nenhum item é clicado nem confirmado com Enter
Then nenhuma requisição de forecast é disparada
And nenhum dado de clima é exibido
```

**AC-02.3 — Seleção por teclado** *(Teste-alvo: E2E)*

```gherkin
Given a lista de sugestões está exibida
When o usuário navega com as setas ↓/↑ e pressiona Enter em um item
Then o clima da cidade destacada é carregado
And o combobox expõe o item ativo com aria-activedescendant
And Escape fecha a lista sem selecionar uma cidade
```

### FR-03 — Clima atual

**AC-03.1 — Lista fechada de campos** *(Teste-alvo: unit + E2E)*

```gherkin
Given o usuário selecionou uma cidade válida
When os dados de clima atual são carregados
Then são exibidos: temperatura atual, condição (texto em pt-BR + ícone),
  sensação térmica, umidade relativa (%) e vento (km/h)
And nenhum campo exibe "undefined", "NaN" ou valor vazio
And se um campo obrigatório estiver ausente ou inválido, o app exibe erro
  de dados em vez de apresentar um cartão parcial como completo
```

**AC-03.2 — Identificação e frescor** *(Teste-alvo: E2E)*

```gherkin
Given o clima atual está exibido
When o usuário observa o cartão principal
Then o nome da cidade e os dados de localização fornecidos estão visíveis
And se país e região/estado estiverem ausentes, as coordenadas são exibidas
And a data/hora de referência dos dados fornecida pelo provedor está visível
And a data/hora é formatada em pt-BR no fuso da cidade selecionada
And a interface não apresenta essa referência como horário de atualização do app
```

**AC-03.3 — Mapeamento de código conhecido** *(Teste-alvo: unit)*

```gherkin
Given um código de condição listado na tabela meteorológica documentada
  pela Open-Meteo
When o código é convertido para exibição
Then existe um texto em pt-BR e um ícone correspondentes
```

**AC-03.4 — Fallback de código desconhecido** *(Teste-alvo: unit)*

```gherkin
Given um código de condição ausente da tabela de mapeamento do app
When o código é convertido para exibição
Then é exibido o texto "Condição meteorológica indisponível" com ícone neutro
And o código é registrado para diagnóstico sem incluir dados pessoais
```

**AC-03.5 — Não aplicar resposta de cidade substituída** *(Teste-alvo: unit + E2E)*

```gherkin
Given uma requisição de clima para a cidade A está pendente
When o usuário seleciona a cidade B e a resposta de B chega antes da resposta de A
Then os cartões exibem os dados da cidade B
And a resposta tardia de A não substitui os dados de B
```

### FR-04 — Previsão de 5 dias

**AC-04.1 — Janela de 5 dias** *(Teste-alvo: unit + E2E)*

```gherkin
Given o usuário selecionou uma cidade
When a previsão é exibida
Then há exatamente 5 entradas: hoje + 4 dias seguintes
And "hoje" é calculado no fuso horário da cidade consultada
```

**AC-04.2 — Conteúdo de cada dia** *(Teste-alvo: unit + E2E)*

```gherkin
Given a previsão de 5 dias está exibida
When o usuário observa cada entrada
Then cada dia mostra: dia da semana abreviado em pt-BR (ex.: "qua."),
  temperatura máxima, temperatura mínima e condição (texto + ícone)
And máxima é sempre maior ou igual à mínima
And a data de cada entrada é distinta e consecutiva no fuso da cidade
```

**AC-04.3 — Fuso horário da cidade** *(Teste-alvo: unit do service)*

```gherkin
Given o relógio do usuário está em America/Sao_Paulo às 22h
When ele consulta uma cidade em Asia/Tokyo (onde já é o dia seguinte)
Then o primeiro dia da previsão corresponde à data atual em Asia/Tokyo
And não à data atual no fuso do usuário
```

### FR-05 — Alternância de unidades

**AC-05.1 — Conversão total e imediata** *(Teste-alvo: E2E)*

```gherkin
Given o app exibe clima atual e previsão em °C
When o usuário aciona o controle de unidade
Then todas as temperaturas visíveis (atual, sensação térmica,
  máximas e mínimas dos 5 dias) passam a °F
And nenhuma nova requisição de rede é necessária para a conversão
And o vento permanece em km/h
```

**AC-05.2 — Estado do controle acessível** *(Teste-alvo: unit + E2E)*

```gherkin
Given o controle de unidade está renderizado
When seu estado é inspecionado
Then a unidade ativa é indicada visualmente
And o controle é um botão com aria-pressed igual a "true" para a unidade ativa
And o controle é acionável por teclado (Enter/Espaço)
```

**AC-05.3 — Padrão Celsius** *(Teste-alvo: E2E)*

```gherkin
Given um navegador sem preferência de unidade salva
When o primeiro clima é exibido
Then todas as temperaturas estão em °C
```

**AC-05.4 — Corretude e arredondamento da conversão** *(Teste-alvo: unit)*

```gherkin
Given valores em °C e °F incluindo negativos, zero e valores fracionários
When o usuário alterna de °C para °F e de volta para °C
Then a conversão segue F = C × 9/5 + 32 e C = (F − 32) × 5/9
And o cálculo usa o valor original não arredondado
And a interface arredonda somente no formato final para o inteiro mais próximo,
  com valores exatamente entre inteiros arredondados para longe de zero
And o valor de origem é recuperado dentro de 1°C após ida e volta
```

### FR-06 — Estados de interface

**AC-06.1 — Loading acessível** *(Teste-alvo: E2E)*

```gherkin
Given uma requisição de busca ou de clima está em andamento
When ela demora mais que 200ms
Then um indicador de carregamento é exibido
And o indicador possui texto acessível para leitores de tela
  (ex.: role="status" com rótulo)
```

**AC-06.2 — Erro com retry** *(Teste-alvo: unit + E2E com mock de falha)*

```gherkin
Given a requisição falha por erro de rede, timeout, HTTP 408, HTTP 429 ou HTTP 5xx
When a requisição falha
Then uma mensagem de erro em pt-BR, sem jargão técnico, é exibida
And um botão "Tentar novamente" está visível
And acionar o botão refaz exatamente a mesma requisição
And nenhuma repetição automática ocorre
And para HTTP 429, uma repetição manual respeita Retry-After quando presente
```

**AC-06.3 — Erro permanente** *(Teste-alvo: unit + E2E com mock)*

```gherkin
Given a API retorna HTTP 400, 401, 403 ou 404
When a requisição falha
Then é exibida uma mensagem em pt-BR sem detalhes técnicos
And o botão "Tentar novamente" não é exibido
And nenhum retry automático ocorre
```

**AC-06.4 — Estado vazio** *(Teste-alvo: E2E)*

```gherkin
Given o usuário digitou um termo sem correspondência (ex.: "xyzxyz")
When a resposta da API chega vazia
Then a mensagem "Nenhuma cidade encontrada. Verifique a grafia ou tente outra busca." é exibida
And nenhuma área em branco ou lista vazia silenciosa é mostrada
```

**AC-06.5 — Timeout** *(Teste-alvo: unit do service + E2E com mock)*

```gherkin
Given uma requisição à API está em andamento
When ela não responde em 10s
Then a requisição é abortada
And o estado de erro com retry (AC-06.2) é exibido
```

**AC-06.6 — Bloqueio de requisições duplicadas** *(Teste-alvo: unit)*

```gherkin
Given uma requisição de clima está em andamento (estado loading)
When o usuário aciona novamente a mesma ação (duplo clique no retry
  ou reseleção da mesma cidade)
Then nenhuma requisição duplicada é enviada
```

### FR-07 — Persistência de preferências

**AC-07.1 — Unidade lembrada** *(Teste-alvo: E2E)*

```gherkin
Given o usuário alternou a unidade para °F
When ele fecha e reabre o app
Then as temperaturas são exibidas em °F
```

**AC-07.2 — Última cidade lembrada** *(Teste-alvo: E2E)*

```gherkin
Given o usuário consultou "Salvador" na sessão anterior
When ele reabre o app
Then Salvador é carregada sem uma nova requisição de geocoding
And é enviada uma requisição de clima para obter dados atualizados
And o nome "Salvador" e os dados de região/país disponíveis estão visíveis
```

**AC-07.3 — Armazenamento indisponível** *(Teste-alvo: unit)*

```gherkin
Given o localStorage está indisponível ou contém dados corrompidos
When o app abre
Then ele se comporta como primeira visita (FR-08)
And nenhum erro é exibido ao usuário
```

**AC-07.4 — Meta de tempo para visita recorrente** *(Teste-alvo: E2E)*

```gherkin
Given uma cidade está salva e o app é iniciado em build de produção
And o serviço mockado está configurado para responder em até 2s após o request
When o usuário abre o app
Then os dados de clima atual e previsão aparecem em menos de 10s
```

### FR-08 — Estado inicial (primeira visita)

**AC-08.1 — Tela de boas-vindas** *(Teste-alvo: E2E)*

```gherkin
Given um navegador sem dados salvos do app
When o app abre
Then a tela de boas-vindas é exibida com o campo de busca em destaque
And uma instrução curta de uso em pt-BR está visível
And nenhuma requisição de clima é disparada
```

### Matriz de rastreabilidade AC × teste

| FR    | Critérios                              | Unit (Vitest)             | E2E (Playwright)                 |
| ----- | --------------------------------------- | ------------------------- | --------------------------------- |
| FR-01 | AC-01.1 … AC-01.6                       | 01.1, 01.3, 01.4, 01.5, 01.6 | 01.1, 01.2, 01.5, 01.6             |
| FR-02 | AC-02.1 … AC-02.3                       | —                         | 02.1, 02.2, 02.3                  |
| FR-03 | AC-03.1 … AC-03.5                       | 03.1, 03.3, 03.4, 03.5   | 03.1, 03.2, 03.5                  |
| FR-04 | AC-04.1 … AC-04.3                       | 04.1, 04.2, 04.3          | 04.1, 04.2                        |
| FR-05 | AC-05.1 … AC-05.4                       | 05.2, 05.4                | 05.1, 05.2, 05.3                  |
| FR-06 | AC-06.1 … AC-06.6                       | 06.2, 06.3, 06.5, 06.6   | 06.1, 06.2, 06.3, 06.4, 06.5      |
| FR-07 | AC-07.1 … AC-07.4                       | 07.3                      | 07.1, 07.2, 07.4                   |
| FR-08 | AC-08.1                                 | —                         | 08.1                              |

---

## 5. Non-Functional Requirements

| ID     | Categoria          | Requisito | Verificação |
| ------ | ------------------ | --------- | ----------- |
| NFR-01 | Responsividade     | Sem rolagem horizontal em larguras de 320, 360, 768 e 1280 CSS px; conteúdo e controles continuam utilizáveis em orientação retrato e paisagem; alvos interativos medem pelo menos 44×44 CSS px. | E2E nos quatro viewports e inspeção de alvos |
| NFR-02 | Acessibilidade     | WCAG 2.1 AA: controles nomeados, foco visível, operação por teclado, relações semânticas válidas e contraste de 4.5:1 para texto normal e 3:1 para texto grande/controles gráficos. | axe sem violações críticas/sérias + testes de teclado e contraste |
| NFR-03 | Desempenho         | Em build de produção e cache frio, Lighthouse Mobile: LCP ≤ 2.5 s e TBT ≤ 200 ms; JavaScript inicial ≤ 200 KiB gzip; após resposta bem-sucedida da API, resultados/dados são renderizados em ≤ 1 s. As métricas de rede da API não contam no limite de renderização. | Cinco execuções Lighthouse no mesmo ambiente; mediana reportada; teste de renderização com resposta mockada |
| NFR-04 | Confiabilidade     | Erros de rede, resposta inválida e exceção de renderização resultam em estado recuperável ou mensagem de erro, sem tela branca, valores `NaN`/`undefined` ou dados de outra cidade. | Testes unitários de parser e E2E com falhas mockadas |
| NFR-05 | Qualidade          | TypeScript strict; critérios de aceite cobertos por testes unitários e E2E; lint, build e testes passam antes de liberar. | `pnpm lint`, `pnpm build` e `pnpm test` |
| NFR-06 | Manutenibilidade   | Acesso à API isolado em serviços; dados externos validados antes de uso; strings visíveis centralizadas. | Revisão da arquitetura e busca de strings não centralizadas |
| NFR-07 | Compatibilidade    | Suporte às duas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari; em mobile, Chrome para Android e Safari para iOS nas duas versões principais mais recentes do sistema. | Playwright Chromium/Firefox/WebKit + verificação manual em Chrome Android e Safari iOS |
| NFR-08 | Privacidade        | Não coletar dados pessoais, não usar analytics/cookies de rastreamento. Enviar à Open-Meteo somente o termo pesquisado ou coordenadas da cidade selecionada e parâmetros meteorológicos necessários; não persistir dados meteorológicos. | Revisão de armazenamento local, requests, cookies e logs |
| NFR-09 | Resiliência        | Cada chamada à API tem timeout de 10 s; falhas transitórias podem ser repetidas manualmente; dados de cache expirados não são apresentados como atuais. Não há meta de disponibilidade até a hospedagem/SLA ser decidida (OQ-07). | Testes com timeout, indisponibilidade, retry e cache expirado |
| NFR-10 | Segurança          | Produção somente via HTTPS. CSP define `default-src 'self'`; `connect-src` permite apenas a origem própria, `https://geocoding-api.open-meteo.com` e `https://api.open-meteo.com`; usa `object-src 'none'`, `base-uri 'self'` e `frame-ancestors 'none'`, sem `unsafe-eval`. Dados externos são texto, nunca HTML; query e coordenadas não são gravadas em logs. | Verificação de headers no deploy e revisão de código |
| NFR-11 | Eficiência de rede | Busca usa debounce trailing de 300 ms; cache em memória por 600 s para respostas válidas de geocoding e previsão; falhas não são cacheadas; chamadas contêm somente parâmetros/campos necessários. | Testes unitários de timer, TTL, cache miss/hit e falha |
| NFR-12 | Localização        | Texto da interface em pt-BR; datas e números formatados com locale `pt-BR`; data/hora meteorológica usa o fuso IANA da cidade. Temperaturas são apresentadas sem casas decimais. | Testes unitários com locale e fuso fixados |
| NFR-13 | Observabilidade    | Exceções de UI e falhas de integração ficam identificáveis em ambiente de desenvolvimento; não enviar telemetria externa no MVP nem incluir query, coordenadas ou dados do usuário nos logs. | Revisão de logs e teste do error boundary |

### 5.1 Política de dados

> Consolida parâmetros que estavam dispersos no discovery (mitigações R-01/R-02).

| Parâmetro                       | Valor |
| ------------------------------- | ----- |
| Timeout                         | 10.000 ms a partir do início de cada request; abortar a chamada ao expirar |
| Debounce                        | 300 ms após a última alteração do termo; timer reinicia a cada alteração |
| Mínimo do termo                 | 2 pontos de código Unicode após remover espaços nas extremidades |
| Resultados                      | Máximo de 8, preservando a ordem retornada pelo geocoding |
| Cache                           | Memória da sessão, TTL de 600 s; somente respostas válidas; cache expirado não serve como fallback offline |
| Fuso horário                    | Fuso IANA da cidade retornado/confirmado pelo provedor; nunca usar o fuso do dispositivo para selecionar datas diárias |
| Conversão e arredondamento      | Converter o valor original; arredondar somente na apresentação para inteiro mais próximo; empate exato em 0,5 arredonda para longe de zero |
| Horário exibido                 | Data/hora de referência meteorológica fornecida pelo provedor, formatada no fuso local da cidade; não representa hora de fetch |
| Atualização                     | Sem polling; carregar ao selecionar/reabrir cidade salva e em retry manual |
| Persistência                    | Armazenamento local apenas para unidade e cidade selecionada; não persistir forecast/clima |

---

## 6. Edge Cases

| ID    | Cenário                                                             | Comportamento esperado                                                                              |
| ----- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| EC-01 | Termo vazio, apenas espaços ou com menos de 2 caracteres após trim | Não enviar request; limpar sugestões antigas para não sugerir resultado incompatível com o texto atual. |
| EC-02 | Busca sem resultados | Exibir o texto fixado em AC-06.4. |
| EC-03 | Acentos, caracteres especiais ou entrada recusada pelo provedor | Enviar como texto, sem interpretar HTML; exibir vazio ou erro conforme resposta, sem quebrar a UI. |
| EC-04 | Respostas de busca chegam fora de ordem | Aplicar apenas resposta correspondente ao termo atualmente ativo (AC-01.5). |
| EC-05 | Falha de rede/offline | Estado de erro transitório e retry manual (AC-06.2). |
| EC-06 | HTTP 408, 429 ou 5xx | Mensagem de erro transitório; retry manual; respeitar `Retry-After` se fornecido (AC-06.2). |
| EC-07 | HTTP 400, 401, 403 ou 404 | Mensagem de erro permanente sem botão de retry (AC-06.3). |
| EC-08 | Timeout superior a 10 s | Abortar request e exibir erro transitório (AC-06.5). |
| EC-09 | Payload incompleto, inválido ou com valores não numéricos | Não renderizar dados parciais como válidos; mensagem de erro de dados sem `NaN`/`undefined`. |
| EC-10 | Código meteorológico sem mapeamento | Condição genérica + ícone neutro; registrar apenas o código (AC-03.4). |
| EC-11 | Cidade homônima ou sem região fornecida | Exibir país e região quando disponíveis; seleção explícita; não inventar localização. |
| EC-12 | Fuso distante ou mudança de data perto da meia-noite | Dias calculados pelo fuso da cidade, inclusive em virada de dia/ano (AC-04.3). |
| EC-13 | localStorage bloqueado, indisponível ou corrompido | Continuar em modo não persistente, com Celsius e fluxo inicial; não lançar exceção visível (AC-07.3). |
| EC-14 | Cidade salva não é mais aceita pelo provedor | Exibir erro recuperável e oferecer busca manual; não repetir geocoding em loop. |
| EC-15 | Cliques repetidos durante loading | Uma única chamada concorrente para a mesma operação (AC-06.6). |
| EC-16 | Rotação/redimensionamento | Refluir conteúdo sem rolagem horizontal ou perda da seleção atual. |
| EC-17 | Temperaturas negativas, extremas ou fracionárias | Preservar sinal, converter antes de arredondar e mostrar unidade correta. |
| EC-18 | Cache expirado ou falha da API com cache expirado | Buscar novamente; não exibir valor expirado como atual nem apresentá-lo sem rótulo de obsolescência. |

---

## 7. Assumptions

> Herdadas do discovery, com status atualizado. Suposições não substituem as
> decisões pendentes listadas na seção 10.

| ID   | Suposição | Status |
| ---- | --------- | ------ |
| A-01 | O produto é uma SPA web responsiva, não um app distribuído em lojas. | Escopo baseado na stack do projeto; validar expectativa comercial antes do release (RP-01). |
| A-02 | Fonte de dados: Open-Meteo, sem API key. | Confirmada por D-01; termos de uso ainda precisam de verificação (OQ-09). |
| A-03 | Busca global; geocoding limitado à cobertura do provedor; resultados exibidos na ordem retornada. | Escopo definido em FR-01; política de ranking customizada não incluída. |
| A-04 | Previsão diária para hoje + 4 dias; sem granularidade horária no MVP. | Confirmada pelo FR-04 e Out of Scope. |
| A-05 | Celsius padrão; a unidade pode ser salva localmente. | Celsius confirmada por D-03; persistência local é Should (FR-07). |
| A-06 | Sem autenticação, backend próprio ou sincronização entre dispositivos. | Confirmada por D-04. |
| A-07 | UI em pt-BR. | Confirmada por D-05. |
| A-08 | Geolocalização, favoritos, alertas e modo offline não fazem parte do MVP. | Fechado para este escopo; qualquer inclusão exige mudança aprovada. |
| A-09 | Sem analytics nem coleta de dados pessoais no MVP. | Escopo definido por NFR-08 e Out of Scope. |
| A-10 | Os campos do clima atual definidos em FR-03 atendem ao produto. | Provisória; aprovação do stakeholder é gate antes de congelar a spec (OQ-04). |

---

## 8. Risks

> Riscos do discovery que afetam decisões ou validações desta spec.

| ID    | Risco | Tratamento/validação |
| ----- | ----- | -------------------- |
| R-01  | Indisponibilidade da Open-Meteo | Timeout, erros transitórios e retry manual (FR-06, NFR-09, EC-05–08). |
| R-02  | Rate limiting | Debounce, limite de resultados, cache e tratamento HTTP 429 (FR-01, NFR-11, AC-06.2). |
| R-03  | Contrato de API, timezone e códigos meteorológicos | Validar endpoints, campos e códigos documentados antes de congelar o plano técnico. |
| R-04  | Cidade homônima selecionada incorretamente | Seleção explícita e contexto geográfico (FR-02, AC-02.1–02.3). |
| R-05  | Performance em redes/dispositivos móveis | Metas e condições de medição definidos em NFR-03. |
| R-06  | Dados antigos apresentados como atuais | Cache expirado não é fallback; distinguir horário de referência de hora de fetch (NFR-09, política de dados). |
| R-07  | Regressões nos fluxos principais | Critérios vinculados a testes, matriz de cobertura e gates NFR-05. |
| R-08  | Acessibilidade descoberta tarde | WCAG 2.1 AA, testes de teclado e axe (NFR-02). |
| RP-01 | Expectativa de aplicativo nativo | Confirmar canal de distribuição antes de produção (A-01). |
| RP-02 | Geolocalização considerada implícita | Fora do MVP; sem permissão de localização ou chamada de geolocalização. |
| RP-05 | Campos do clima divergentes da expectativa | Aprovação da lista FR-03 requerida em OQ-04 antes do congelamento da spec. |
| RP-07 | Uso incompatível com os termos do provedor | Validar licença, limites, atribuição e uso comercial em OQ-09 antes do release. |

---

## 9. Out of Scope

Explicitamente **fora** do MVP (congelamento de escopo — mitigação do RP-03):

- Geolocalização automática ("clima de onde estou") — candidato nº 1 do backlog
  futuro.
- Lista de cidades favoritas / múltiplas cidades salvas.
- Detalhamento horário da previsão.
- Alertas e notificações meteorológicas.
- Mapas, radar e imagens de satélite.
- Histórico climático e comparativos.
- Modo offline / PWA instalável.
- Autenticação, contas de usuário e sincronização entre dispositivos.
- Internacionalização além de pt-BR (strings centralizadas preparam, mas não
  entregam, i18n).
- Conversão de unidades além de temperatura (vento fixo em km/h no MVP).
- Analytics e telemetria de uso.
- Polling/atualização automática em segundo plano.

---

## 10. Open Questions

> As decisões marcadas como **bloqueantes** devem ser resolvidas antes de
> aprovar esta spec ou liberar produção. As demais ficam registradas como
> escolhas de produto para releases futuros.

| ID    | Pergunta | Suposição vigente | Prioridade | Impacto se divergir |
| ----- | -------- | ----------------- | ---------- | ------------------- |
| OQ-01 | É necessário priorizar cidades brasileiras no ranking, embora a busca seja global? | Ordem recebida do provedor; sem ranking próprio | Não bloqueante para MVP | Muda o ordenamento dos resultados, não a cobertura global. |
| OQ-02 | Há intenção aprovada de adicionar previsão horária após o MVP? | Não; previsão diária apenas no MVP | Backlog futuro | Acrescenta dados, UX e testes; não altera o contrato atual. |
| OQ-03 | O tema dark glassmorphism atende à marca ou há guia visual obrigatório? | Tema do projeto | Não bloqueante para iniciar Plan; resolver antes da aprovação visual | Pode exigir ajuste de paleta e identidade visual. |
| OQ-04 | O stakeholder aprova como conjunto final temperatura, sensação térmica, umidade, vento e condição atual? | Lista FR-03 | **Bloqueante para congelar a spec** | Campos omitidos causam alteração do layout e contrato de dados. |
| OQ-05 | Quais métricas de resultado serão usadas para avaliar o produto? | Objetivos de UX da seção 1; sem analytics no MVP | Definir antes do ship | Sem métrica não se avalia sucesso de produto; telemetria não está autorizada no MVP. |
| OQ-06 | Há plano aprovado para PWA/offline em release próximo? | Fora do MVP | Backlog futuro | Se promovido, muda política de cache e instalação. |
| OQ-07 | Qual hospedagem será usada e existe SLO/SLA de disponibilidade esperado? | Hosting estático ainda não escolhido; nenhuma meta de disponibilidade prometida | **Bloqueante para produção** | Define monitoramento, custo, domínio, CSP e responsabilidade operacional. |
| OQ-08 | O produto será distribuído somente como web responsiva ou também em lojas? | Web SPA conforme stack | **Bloqueante para produção** | Distribuição nativa muda plataforma, testes, publicação e requisitos operacionais. |
| OQ-09 | Os termos atuais da Open-Meteo permitem o uso previsto, e quais limites/atribuições devem ser respeitados? | Não confirmado | **Bloqueante para produção** | Risco de indisponibilidade, violação de termos ou necessidade de trocar fornecedor. |

---

**Próximo passo do pipeline SDD:** aprovar a lista de campos (OQ-04) para
congelar a spec; depois, na fase **Plan**, validar o contrato real da
Open-Meteo (R-03) antes de detalhar as tasks. Hospedagem e disponibilidade
(OQ-07), canal de distribuição (OQ-08) e termos/atribuição do provedor
(OQ-09) são gates antes de produção.
