# Discovery — Weather App

> Análise de discovery produzida a partir do briefing de negócio, na perspectiva
> de um Business Analyst sênior. Este documento alimenta a fase de **Spec**
> (`specs/weather-app-spec.md`).

## 1. Contexto

A empresa solicitou uma aplicação de **previsão do tempo** voltada a usuários
finais. O briefing indica um produto de consulta rápida: o usuário busca uma
cidade, visualiza as condições climáticas atuais e a previsão para os próximos
dias, com suporte a diferentes unidades de temperatura e uso em dispositivos
móveis.

- **Problema de negócio:** oferecer acesso simples e rápido a informações
  meteorológicas confiáveis, sem fricção (sem cadastro ou configuração prévia).
- **Público-alvo presumido:** usuários gerais, acessando majoritariamente via
  navegador em dispositivos móveis e desktop.
- **Proposta de valor:** busca de cidade + clima atual + previsão de 5 dias em
  uma interface responsiva e acessível.
- **Contexto técnico do projeto:** aplicação web SPA (React + Vite +
  TypeScript), consumindo a API pública **Open-Meteo** (geocoding + forecast,
  sem necessidade de API key).

## 2. Personas

> Personas propostas para orientar decisões de UX e priorização. Devem ser
> validadas com o stakeholder (relacionam-se com as perguntas em aberto nº 1 e
> nº 9 e com os riscos RP-02 e RP-04).

### Persona 1 — Mariana, a planejadora do dia a dia

| Atributo                | Descrição                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Perfil**              | 34 anos, analista administrativa em Salvador. Sai de casa cedo, usa transporte público, leva o filho à escola.       |
| **Objetivo principal**  | Decidir **em segundos**, antes de sair de casa: "levo guarda-chuva? casaco? vai dar para estender roupa?"            |
| **Contexto de uso**     | **~90% mobile**, em pé, com uma mão, entre 6h30 e 7h30. Rede 4G variável. Consulta quase sempre a mesma cidade.      |
| **Comportamento-chave** | Abre o app → quer a resposta na primeira tela, sem digitar nada. A última cidade consultada precisa estar lembrada.  |
| **Métrica de sucesso**  | Da abertura do app até a decisão "levo/não levo guarda-chuva" em **< 10 segundos**, sem nenhum toque além de abrir.  |
| **Frustração fatal**    | Ter que buscar a própria cidade toda manhã; loading lento no 4G; dados desatualizados.                               |

### Persona 2 — Ricardo, o viajante a trabalho

| Atributo                | Descrição                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Perfil**              | 42 anos, gerente comercial que viaja 2–3 vezes por mês entre capitais brasileiras e, ocasionalmente, para o exterior.|
| **Objetivo principal**  | Saber **como fazer a mala**: previsão de 5 dias da cidade de destino, dias antes da viagem.                          |
| **Contexto de uso**     | **Misto**: desktop no escritório (planejando a semana), mobile no aeroporto. Busca cidades **diferentes** a cada uso, incluindo homônimas (ex.: "Santiago" — Chile ou RS?). |
| **Comportamento-chave** | Usuário mais intenso da **busca** e da **desambiguação** (R-04): precisa ver país/região nos resultados. Em viagens aos EUA, usa o toggle **°C/°F** de verdade. |
| **Métrica de sucesso**  | Encontrar a cidade certa (não a homônima) e ver os 5 dias em **≤ 3 interações** (digitar, selecionar, ler). Zero malas erradas por informação ambígua. |
| **Frustração fatal**    | Selecionar "Santiago" e receber o clima da cidade errada sem perceber; busca que não acha cidades internacionais.    |

### Persona 3 — Dona Cecília, a organizadora de eventos ao ar livre

| Atributo                | Descrição                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Perfil**              | 58 anos, organiza feiras de bairro e eventos comunitários aos fins de semana. Menor fluência digital; usa fonte grande no celular. |
| **Objetivo principal**  | Decidir com antecedência (3–5 dias) se **mantém, adapta ou adia** um evento ao ar livre, monitorando a previsão diariamente conforme a data se aproxima. |
| **Contexto de uso**     | **Mobile (celular Android de entrada)**, tela pequena, às vezes sob sol forte (contraste importa). Rede instável.    |
| **Comportamento-chave** | Usa intensamente a **previsão de 5 dias** e repete a mesma consulta por vários dias. É a persona que mais depende de **acessibilidade** (RNF-01/RNF-02) e de **estados de erro claros** (RF-06). |
| **Métrica de sucesso**  | Conseguir ler a previsão do sábado sem zoom e sem ajuda; confiar na informação para uma decisão que afeta dezenas de pessoas. |
| **Frustração fatal**    | Texto pequeno/baixo contraste; mensagens de erro técnicas; previsão que "some" quando a rede falha.                  |

### Implicações para o backlog

1. **Mariana** eleva a prioridade do **RF-07 (persistência da última cidade)** —
   hoje *Could*, mas para a persona de uso mais frequente é quase *Must*.
   Também reforça a pergunta aberta sobre geolocalização (RP-02).
2. **Ricardo** confirma a criticidade da **desambiguação (RF-05/R-04)** e
   justifica o toggle °C/°F com um caso de uso real — e levanta a questão do
   idioma dos resultados de cidades internacionais.
3. **Cecília** transforma acessibilidade e estados de erro de "checklist
   técnico" em **requisito de negócio**: sem eles, a persona não consegue usar
   o produto.
4. **Conflito saudável:** Mariana quer velocidade e zero fricção; Ricardo quer
   busca poderosa; Cecília quer clareza e legibilidade. A primeira tela precisa
   servir às três — critério de design para a fase de Spec.

## 3. Requisitos Funcionais

| ID    | Requisito                     | Descrição                                                                                                   | Prioridade |
| ----- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| RF-01 | Busca de cidades              | O usuário pode buscar uma cidade pelo nome e selecionar o resultado desejado entre as opções retornadas.     | Must       |
| RF-02 | Clima atual                   | Exibir as condições atuais da cidade selecionada: temperatura, condição (ex.: ensolarado), e dados básicos como sensação térmica, umidade e vento. | Must       |
| RF-03 | Previsão de 5 dias            | Exibir a previsão para os próximos 5 dias, com no mínimo temperaturas máxima/mínima e condição por dia.      | Must       |
| RF-04 | Alternância de unidades       | Permitir alternar a exibição de temperaturas entre **Celsius** e **Fahrenheit**, refletindo em toda a UI.    | Must       |
| RF-05 | Desambiguação de cidades      | Quando houver cidades homônimas, exibir informações de desambiguação (país/região) para o usuário escolher.  | Should     |
| RF-06 | Estados de interface          | Tratar explicitamente os estados de **carregando**, **erro** (falha de rede/API, com opção de tentar novamente) e **vazio** (sem resultados de busca). | Must       |
| RF-07 | Persistência de preferências  | Lembrar a unidade de temperatura escolhida (e, opcionalmente, a última cidade consultada) entre sessões.     | Could      |

> **Nota:** "uso em dispositivos móveis" foi reclassificado como requisito
> **não-funcional** (responsividade é atributo de qualidade, não uma função) e
> consolidado no RNF-01.

## 4. Requisitos Não-Funcionais

| ID     | Categoria       | Requisito                                                                                                       |
| ------ | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Responsividade  | Interface responsiva (mobile-first), utilizável de ~320px até desktop, alvos de toque ≥ 44×44px, tema dark glassmorphism. |
| RNF-02 | Acessibilidade  | Conformidade com **WCAG 2.1 nível AA**: roles/labels semânticos, navegação por teclado, contraste adequado.       |
| RNF-03 | Desempenho      | Metas mensuráveis: LCP < 2,5s em 4G; TTI < 3s; bundle inicial < 200KB (gzip); resultados de busca/previsão renderizados em < 1s após retorno da API, com feedback de loading imediato. |
| RNF-04 | Confiabilidade  | Robustez diante de falhas da API: nenhuma falha de rede resulta em tela quebrada ou estado inconsistente (o comportamento de erro/retry é o RF-06). |
| RNF-05 | Qualidade       | Código TypeScript em modo strict, com testes unitários (Vitest) e E2E (Playwright) cobrindo os critérios de aceite. |
| RNF-06 | Manutenibilidade| Separação de responsabilidades: componentes (`src/components/`), serviços de dados (`src/services/`), hooks (`src/hooks/`), tipos (`src/types/`). |
| RNF-07 | Compatibilidade | Suporte aos navegadores modernos (evergreen) em mobile e desktop.                                                 |
| RNF-08 | Privacidade     | Nenhum dado pessoal coletado; se geolocalização for adotada no futuro, deve ser opt-in explícito.                 |
| RNF-09 | Disponibilidade | App estático servido via CDN com disponibilidade alvo de ~99,9%; diante de indisponibilidade da Open-Meteo, degradar graciosamente (exibir último dado em cache com indicação de "desatualizado"); timeout de requisição de 10s. |
| RNF-10 | Segurança       | Servir exclusivamente via HTTPS; Content-Security-Policy restritiva; sanitização da entrada de busca; sem injeção de HTML dinâmico. |
| RNF-11 | Eficiência de rede | Cache de respostas de geocoding/forecast (TTL ~10 min); debounce de busca (~300ms); payloads mínimos — relevante em redes móveis e para respeitar rate limits da API. |
| RNF-12 | Localização     | Formatos de data, número e nomes de dias da semana conforme locale **pt-BR**, mesmo com UI monolíngue no MVP.     |
| RNF-13 | Observabilidade | Erros de runtime e falhas de API capturados de forma estruturada (error boundary + logging em console), facilitando diagnóstico. |

## 4.1 Restrições

| ID    | Restrição                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------ |
| RT-01 | Fonte de dados: API **Open-Meteo** (geocoding + forecast), sem API key e sem custos; nenhum segredo no front-end.    |
| RT-02 | Stack definida pelo projeto: TypeScript strict, React + Vite, Tailwind CSS, pnpm, Biome, Vitest e Playwright.        |

## 5. Riscos

### 5.1 Riscos Técnicos

| ID   | Risco | Probabilidade | Impacto | Mitigação |
| ---- | ----- | :-----------: | ------- | --------- |
| R-01 | **Indisponibilidade/instabilidade da API Open-Meteo** (única fonte de dados, sem SLA contratual) | Baixa | **Alto** — app inteiro fica sem função; tela de erro para todos os usuários | Timeout definido (10s); mensagens de erro claras com retry manual; exibir último dado em cache marcado como "desatualizado"; isolar acesso em `src/services/` para facilitar troca de provider. |
| R-02 | **Rate limiting da API** por busca a cada tecla digitada (autocomplete) | Média | **Médio** — buscas falham intermitentemente; UX degradada em horários de pico | Debounce (~300ms); disparo só com ≥ 2 caracteres; cache de respostas de geocoding/forecast (TTL ~10 min). |
| R-03 | **Contrato da API divergente do esperado** — "5 dias" vs. granularidade/formato real do forecast; WMO weather codes a mapear para ícones/texto | Média | **Médio** — retrabalho na camada de serviço e nos tipos; atraso na fase Code | Validar o contrato real da Open-Meteo na fase **Plan** (spike curto); tipar respostas em `src/types/`; testes de contrato no service. |
| R-04 | **Geocoding ambíguo** (cidades homônimas) retornando resultado errado silenciosamente | Alta | **Médio** — usuário vê clima da cidade errada sem perceber; mina confiança | Exibir sempre país/região nos resultados; exigir seleção explícita; nunca "auto-selecionar" o primeiro resultado. |
| R-05 | **Performance ruim em redes móveis lentas** (público é mobile-first) | Média | **Médio** — abandono; metas do RNF-03 (LCP < 2,5s) não cumpridas | Bundle enxuto (< 200KB gzip); evitar bibliotecas pesadas; loading states imediatos; medir com Lighthouse no CI. |
| R-06 | **Dados obsoletos exibidos como "atuais"** (aba aberta por horas, sem política de refresh) | Média | **Médio** — informação enganosa com aparência de correta | Definir política de frescor na spec (ex.: refetch ao focar a aba; timestamp "atualizado às HH:MM" visível). |
| R-07 | **Regressões por falta de cobertura** nos fluxos críticos (busca → seleção → exibição → toggle °C/°F) | Média | **Médio** — bugs chegam à revisão/produção; retrabalho | Testes derivados dos critérios de aceite (Vitest + Playwright); checklist `pnpm lint/build/test` antes de concluir cada tarefa. |
| R-08 | **Acessibilidade descoberta tarde** (combobox de busca é padrão ARIA notoriamente difícil) | Média | **Médio** — retrabalho de UI; exclusão de usuários de teclado/leitor de tela | WCAG 2.1 AA como critério de aceite desde a spec; usar padrão ARIA combobox documentado; testes de teclado no Playwright. |

### 5.2 Riscos de Produto

| ID    | Risco | Probabilidade | Impacto | Mitigação |
| ----- | ----- | :-----------: | ------- | --------- |
| RP-01 | **Expectativa implícita de app nativo** — stakeholder lê "usar em dispositivos móveis" como app de loja, não web responsivo | Baixa | **Crítico** — invalida stack e arquitetura inteiras | Confirmar a suposição S-01 com o stakeholder **antes** da fase Plan; registrar a decisão por escrito na spec. |
| RP-02 | **Geolocalização presumida como implícita no MVP** ("por que o app não sabe onde estou?") | Alta | **Alto** — MVP percebido como incompleto na demo | Decidir explicitamente na spec (dentro ou fora do MVP); se fora, comunicar como item nº 1 do backlog futuro. |
| RP-03 | **Scope creep** — favoritos, mapas, alertas, radar, histórico surgindo durante o desenvolvimento | Média | **Alto** — atraso; MVP nunca "fecha" | Congelar escopo na spec; todo extra vai para backlog com priorização separada; critério de pronto definido por fase. |
| RP-04 | **Ausência de métricas de sucesso** — ninguém sabe o que significa "deu certo" | Alta | **Médio** — impossível priorizar trade-offs ou declarar o produto pronto | Definir 1–2 métricas com o stakeholder no kickoff (ex.: tarefa "buscar e ver clima" completada em < 10s). |
| RP-05 | **Dados mínimos do "clima atual" divergem da expectativa** (stakeholder esperava UV/chuva/vento; MVP entrega só temperatura + condição) | Média | **Médio** — redesign da tela principal após demo | Validar o conjunto de dados com wireframe/protótipo de baixo custo antes de implementar. |
| RP-06 | **Idioma/localização errados para o público** (UI pt-BR vs. público internacional; app abrindo em °F para público BR) | Baixa | **Médio** — produto percebido como descuidado; retrofit de i18n custa ~3× mais | Confirmar idioma e unidade padrão na spec; centralizar strings desde o início para baratear i18n futura. |
| RP-07 | **Uso comercial fora dos termos da Open-Meteo gratuita** (limites de uso não comercial) | Baixa | **Alto** — risco legal/operacional; necessidade de migrar de provider às pressas | Verificar termos de uso na fase Plan; camada de serviço isolada (R-01) já reduz o custo de troca. |

> **Top 3 para atacar primeiro:** RP-01 (barato de confirmar, catastrófico se
> errado), RP-02 (alta probabilidade + alto impacto na percepção do MVP) e
> R-04 (alta probabilidade e corrói a confiança no produto silenciosamente).

## 6. Perguntas em Aberto

1. **Idioma da UI:** a interface deve ser em pt-BR, en-US ou multilíngue?
   → **Resolvida pela D-05** (pt-BR).
2. **Escopo da busca:** a busca deve cobrir cidades do mundo todo ou há foco
   regional (ex.: Brasil)?
3. **Clima atual — dados mínimos:** além da temperatura e condição, quais dados
   são obrigatórios (umidade, vento, sensação térmica, índice UV, chance de
   chuva)?
4. **Previsão de 5 dias:** deve incluir apenas resumo diário (máx/mín/condição)
   ou também detalhamento por hora?
   → **Parcialmente resolvida pela D-02** (janela = hoje + 4 dias); a
   granularidade (diária vs. horária) segue em aberto, coberta pela S-04.
5. **Unidade padrão:** qual unidade inicial — Celsius (padrão BR) com detecção
   por locale, ou fixa?
   → **Resolvida pela D-03** (Celsius fixa como padrão).
6. **Persistência:** é desejado lembrar última cidade e preferência de unidade
   entre visitas (localStorage)?
   → **Parcialmente resolvida pela D-04** (sem servidor; persistência local via
   localStorage permanece possível e segue como RF-07, prioridade Could).
7. **Geolocalização:** detectar automaticamente a cidade do usuário está no
   escopo do MVP ou é evolução futura?
8. **Identidade visual:** existe guia de marca/paleta da empresa a seguir, além
   do tema dark glassmorphism definido tecnicamente?
9. **Métricas de sucesso:** como o negócio medirá o sucesso (uso, retenção,
   NPS)? Há necessidade de analytics?
10. **Offline/PWA:** há expectativa de funcionamento offline ou instalação como
    PWA?

## 7. Suposições

> Válidas até que as perguntas em aberto sejam respondidas; devem ser
> confirmadas ou revisadas na fase de Spec.

- **S-01:** O produto é uma **aplicação web responsiva** (SPA), não um app
  nativo — "usar em dispositivos móveis" significa mobile web.
- **S-02:** A fonte de dados é a **Open-Meteo** (geocoding + forecast), sem API
  key e sem custos, conforme stack definida no projeto.
- **S-03:** A busca é **global** (qualquer cidade do mundo), com resultados
  desambiguados por país/região.
- **S-04:** "Previsão de 5 dias" significa **resumo diário** (máx/mín e
  condição) dos próximos 5 dias, sem granularidade horária no MVP.
- **S-05:** A unidade padrão inicial é **Celsius**, com alternância manual para
  Fahrenheit; a preferência pode ser persistida localmente.
- **S-06:** Não há autenticação, cadastro de usuários nem backend próprio no
  MVP; todo o estado vive no cliente.
- **S-07:** O idioma da interface é **pt-BR** (alinhado às convenções do
  projeto), com termos técnicos em inglês quando aplicável.
- **S-08:** Geolocalização automática, favoritos, alertas meteorológicos e
  modo offline estão **fora do escopo do MVP** (backlog futuro).
- **S-09:** Não há requisitos de analytics ou coleta de dados pessoais no MVP.

## 8. Decisões

> Decisões fechadas com o stakeholder em 2026-10-29 para destravar a fase de
> **Spec**. Cada decisão referencia o que resolve nas Perguntas em Aberto
> (seção 6) e nas Suposições (seção 7).

| ID   | Decisão                                                        | Justificativa                                                                                                                                     | O que resolve                                                                                                   |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D-01 | **Fonte de dados: Open-Meteo** (geocoding + forecast, sem API key) | Sem custo, sem gestão de segredos no front-end e sem cadastro — elimina fricção operacional; alinhada à stack do projeto.                           | Confirma a S-02 e a restrição RT-01; reduz o risco RP-07 (ainda exige verificar termos de uso na fase Plan).     |
| D-02 | **"5 dias" = hoje + 4 dias**                                    | O dia atual é o mais consultado (personas Mariana e Cecília); janela "hoje + 4" entrega valor imediato e simplifica o contrato com a API.           | Elimina a ambiguidade de contagem apontada no risco R-03; responde parcialmente a pergunta nº 4.                 |
| D-03 | **Unidade padrão: Celsius**                                     | Público-alvo primário é brasileiro (UI em pt-BR); Fahrenheit fica a um toque de distância via toggle (RF-04).                                        | Responde a pergunta nº 5; confirma a S-05; mitiga o risco RP-06 (app abrindo em °F para público BR).             |
| D-04 | **Sem autenticação e sem persistência de servidor**             | MVP 100% client-side: menos superfície de ataque, zero custo de backend, deploy estático simples (CDN — RNF-09). Preferências locais via localStorage seguem possíveis (RF-07). | Confirma a S-06; responde parcialmente a pergunta nº 6; simplifica os RNF-08 (privacidade) e RNF-10 (segurança). |
| D-05 | **Idioma da UI: pt-BR**                                         | Alinhado ao público-alvo e às convenções do projeto; strings centralizadas desde o início baratearão i18n futura (RNF-12).                           | Responde a pergunta nº 1; confirma a S-07; mitiga o risco RP-06.                                                 |

> **Ainda em aberto para a fase de Spec:** escopo geográfico da busca (nº 2),
> dados mínimos do clima atual (nº 3), granularidade da previsão (nº 4),
> geolocalização no MVP (nº 7), identidade visual (nº 8), métricas de sucesso
> (nº 9) e offline/PWA (nº 10).
