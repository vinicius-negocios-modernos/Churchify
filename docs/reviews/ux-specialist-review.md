# UX Specialist Review — Churchify

**Reviewer:** Uma (@ux-design-expert)
**Date:** 2026-03-06
**Status:** REVIEWED
**Input Documents:** `docs/prd/technical-debt-DRAFT.md`, `docs/frontend/frontend-spec.md`, all component/page source files

---

## Debitos Validados

### 4.2 UX Debts

| ID | Debito | Severidade (Original -> Ajustada) | Horas | Impacto UX | Solucao Sugerida |
|----|--------|----------------------------------|-------|-----------|-----------------|
| UX-001 | Dashboard 100% hardcoded | High -> High | 8-12h | Pastores veem dados falsos na primeira tela -- destroi confianca imediatamente. Primeiro contato pos-login e uma mentira. | Implementar estado vazio real com onboarding card: "Crie seu primeiro episodio" com CTA direto para /new-episode. So mostrar stats quando houver dados reais. |
| UX-002 | `alert()` para validacao | Medium -> **High** | 3h | `alert()` e uma barreira critica para pastores menos tecnicos -- parece "erro do computador", nao orientacao do app. Quebra completamente o fluxo mental. | Inline validation com mensagens abaixo de cada campo (`text-red-500 text-sm`). Validar on-blur para feedback imediato. Usar `aria-invalid` + `aria-describedby` para a11y. |
| UX-003 | D&D visual mas nao-funcional | Medium -> **High** | 4h | Area tracejada com texto "arraste e solte" e uma **promessa quebrada**. Pastores vao arrastar, nada acontece, pensam que o app esta com defeito. Pior que nao ter D&D. | Implementar `onDrop`/`onDragOver`/`onDragLeave` handlers completos. Adicionar visual feedback (bg-indigo-50 + border-indigo-400) durante drag. Ou remover o texto "ou arraste e solte" e manter click-only. Recomendo implementar -- e esperado em 2026. |
| UX-004 | Sem validacao de tamanho de arquivo | Medium -> Medium | 1h | Label diz "ate 10MB" mas aceita qualquer tamanho. Arquivo de 50MB causaria conversao base64 lenta e possivel crash de aba. | Adicionar check `if (file.size > 10 * 1024 * 1024)` antes de `setFormData`. Mostrar toast/inline error: "Arquivo excede 10MB. Reduza o tamanho da imagem." |
| UX-005 | Sem salvar/exportar resultados | Critical -> **Critical** | 16h | O debito UX mais grave. Todo o trabalho da IA e perdido ao navegar ou atualizar a pagina. Pastor gasta 2-3 min esperando AI, depois perde tudo com um F5 acidental. Equivale a produto sem valor. | Depende de DB-001. Alem da persistencia, adicionar: (1) botao "Salvar Episodio" proeminente pos-resultado, (2) auto-save apos geracao, (3) exportar como PDF/TXT, (4) indicador visual "Salvo" vs "Nao salvo". |
| UX-006 | Sem loading skeleton no Dashboard | Low -> Low | 2h | Quando dados reais forem conectados, havera flash de conteudo. Baixa prioridade ate DB-001 ser resolvido. | Implementar skeleton com `animate-pulse` nos cards de stats e lista de tarefas. Patern: `<div className="h-4 bg-gray-200 rounded animate-pulse" />` |
| UX-007 | Igreja/plano hardcoded no sidebar | Medium -> Medium | 4h | "Igreja Batista" e "Plano Free" sao estaticos. Qualquer pastor de outra igreja vera dados errados. Menor impacto que outros debitos pois sidebar e periferico. | Puxar de user profile ou org data. Fallback para nome do usuario + "Plano Free" ate multi-tenancy existir. |
| UX-008 | Sem confirmacao de logout | Low -> Low | 1h | Logout de um clique e aceitavel para MVP. Risco baixo pois nao ha dados nao-salvos (ainda). Quando persistencia existir, se torna Medium. | Dialog de confirmacao simples: "Deseja sair da sua conta?" com "Cancelar" / "Sair". |
| UX-009 | Sem retry em falha da API Gemini | Medium -> **High** | 3h | Pastor preenche 4 campos, espera, recebe erro, e obrigado a preencher TUDO de novo. Form state e limpo junto com o erro. Frustracacao maxima. | (1) Preservar form data apos erro (ja preserva -- verificado no codigo, `setResult(null)` mas form persiste). (2) Adicionar botao "Tentar Novamente" que re-submete com mesmos dados. (3) Mostrar erro com acao clara, nao apenas texto. |
| UX-010 | Animacoes CSS nao definidas | Low -> Low | 1h | `animate-fade-in-up` e `animate-fade-in` referenciados mas inexistentes. Resultados aparecem sem transicao -- funcional mas sem polish. | Definir em `tailwind.config.js`: `fadeIn` (opacity 0->1) e `fadeInUp` (translate-y + opacity). |
| UX-011 | Sem indicador de progresso na AI | Medium -> **High** | 4h | Gemini pode levar 10-60 segundos. Pastor ve apenas spinner generico sem nocao de quanto tempo falta. Em testes com usuarios de igreja, isso causa abandono -- pensam que "travou". | Implementar stepper visual: Step 1/2 "Analisando conteudo..." -> Step 2/2 "Gerando imagens..." com icones de check para steps completos. Adicionar texto "Isso geralmente leva 15-30 segundos". NAO usar barra de progresso falsa -- stepper honesto e melhor. |
| UX-012 | TOS/Privacy sao texto puro | Low -> Low | 1h | Links nao-clicaveis na tela de login. Menor impacto no MVP. | Transformar em `<a>` com href para paginas futuras ou `#` com tooltip "Em breve". |

### 4.3 Accessibility Debts

| ID | Debito | Severidade (Original -> Ajustada) | Horas | Impacto UX | Solucao Sugerida |
|----|--------|----------------------------------|-------|-----------|-----------------|
| A11Y-001 | Menu mobile sem aria-label | High -> High | 0.5h | Screen readers nao identificam o botao. Verificado: `Layout.tsx:119` -- botao `<button>` sem aria-label. | `aria-label="Abrir menu de navegacao"` |
| A11Y-002 | Fechar menu sem aria-label | High -> High | 0.5h | Mesmo problema. `Layout.tsx:52-57`. | `aria-label="Fechar menu de navegacao"` |
| A11Y-003 | Validacao via alert() nao acessivel | High -> **Critical** | 2h | `alert()` interrompe screen readers de forma abrupta, sem contexto de qual campo falhou. Barreira real de acessibilidade. | Inline errors com `role="alert"` ou `aria-live="assertive"`. Cada campo com `aria-invalid="true"` quando invalido. |
| A11Y-004 | Sem skip-to-content | Medium -> Medium | 1h | Usuarios de teclado precisam tabular por toda a nav. | `<a href="#main-content" className="sr-only focus:not-sr-only ...">Pular para conteudo</a>` + `id="main-content"` no `<main>`. |
| A11Y-005 | Overlay sem aria attributes | Medium -> Medium | 0.5h | Overlay nao anunciado. | `role="dialog"`, `aria-modal="true"`, `aria-label="Menu de navegacao"` no sidebar quando aberto. |
| A11Y-006 | Botoes copy sem aria-labels descritivos | Medium -> Medium | 2h | Multiplos botoes identicos sem descricao. Verificado: ~10 botoes de copia em ResultsDisplay.tsx. | `aria-label="Copiar titulo ${idx + 1}"`, `aria-label="Copiar descricao completa"`, etc. |
| A11Y-007 | Contraste: text-gray-400 em bg branco | Medium -> Medium | 2h | `text-gray-400` (#9CA3AF) em branco (#FFFFFF) = ratio ~2.9:1. Falha WCAG AA (minimo 4.5:1). Encontrado em: SermonForm.tsx:160, Layout.tsx:62, NewEpisode.tsx:101. | Substituir `text-gray-400` por `text-gray-500` (#6B7280, ratio ~4.6:1) para texto informativo. |
| A11Y-008 | Sem focus trap no menu mobile | Medium -> Medium | 2h | Focus escapa do overlay mobile. Tab pode ir para conteudo atras do overlay. | Implementar focus trap: ao abrir menu, focar primeiro item. Tab no ultimo item volta ao primeiro. Esc fecha. |
| A11Y-009 | Loading nao anunciado via aria-live | Medium -> Medium | 1h | Screen readers nao percebem mudanca de estado loading. | `aria-live="polite"` no container de loading. `aria-busy="true"` no form durante processamento. |
| A11Y-010 | Imagens geradas sem alt text significativo | Medium -> Medium | 1h | `alt="Generated Thumbnail"` nao descreve conteudo. | `alt="Miniatura 16:9 gerada para: ${titulo}"` e `alt="Capa 1:1 gerada para: ${titulo}"`. |

---

## Debitos Adicionados (Nao Identificados no DRAFT)

| ID | Debito | Severidade | Horas | Impacto UX | Solucao Sugerida |
|----|--------|-----------|-------|-----------|-----------------|
| UX-013 | Sem onboarding/tutorial para primeiro uso | **High** | 8h | Pastores e equipes de midia sao o publico-alvo. Muitos nao sao tech-savvy. Sem orientacao, vao se perder na primeira visita. Dashboard vazio (apos fix) + form sem guia = abandono. | Implementar: (1) Welcome modal no primeiro login, (2) Empty state educativo no Dashboard com "3 passos para comecar", (3) Tooltips contextuais no SermonForm (ex: "Cole o link do culto no YouTube"). |
| UX-014 | Sem feedback de sucesso apos geracao | **Medium** | 2h | Apos 30+ segundos de espera, resultados simplesmente aparecem sem celebracao. Pastor nao tem certeza se "deu certo". | Toast/banner de sucesso: "Conteudo gerado com sucesso! Revise abaixo." com scroll automatico para ResultsDisplay. Confetti sutil opcional (micro-interaction). |
| UX-015 | Sem max-width no conteudo principal | **Low** | 1h | Em telas >1920px o conteudo estica indefinidamente. Dashboard e particularmente afetado -- cards de stats ficam enormes. Verificado: `Layout.tsx:124` nao tem max-width. | Adicionar `max-w-7xl mx-auto` no `<main>` ou no container de cada pagina. NewEpisode ja tem `max-w-4xl` -- consistencia necessaria. |
| UX-016 | Sem estado de "Biblioteca" e "Configuracoes" | **Medium** | 4h | Routes `/library` e `/settings` renderizam `<div>` inline vazio. Pastor clica e ve pagina em branco -- pensa que app quebrou. | Criar componentes placeholder com ilustracao + "Em breve" + CTA para voltar ao Dashboard. Desabilitar items de nav com tooltip "Em breve" ou badge "Soon". |
| UX-017 | Copy-to-clipboard sem fallback | **Low** | 1h | `navigator.clipboard.writeText()` pode falhar em HTTP ou browsers antigos. Sem try/catch no ResultsDisplay.tsx:14. | Wrap em try/catch. Fallback: `document.execCommand('copy')` com textarea oculta. Mostrar erro amigavel se falhar. |
| UX-018 | Formulario nao persiste entre navegacoes | **Medium** | 2h | Pastor comeca a preencher, navega para Dashboard por engano, volta e formulario esta vazio. | Persistir form state em `sessionStorage`. Restaurar ao montar SermonForm. Limpar apos submit com sucesso. |

---

## Respostas ao Architect

### 1. Design system: component library ou Tailwind puro?

**Recomendacao: shadcn/ui + Radix UI + Tailwind CSS.**

Justificativa para Churchify especificamente:
- **Acessibilidade nativa:** 10 debitos de a11y listados. Radix primitives (Dialog, DropdownMenu, Toast, AlertDialog) resolvem A11Y-003, A11Y-005, A11Y-008 automaticamente. Economiza ~8h de implementacao manual.
- **Consistencia visual:** shadcn/ui usa Tailwind internamente, entao nao ha conflito com o CSS existente. Os componentes sao copiados para o projeto (nao sao dependencia npm), mantendo controle total.
- **Velocidade de desenvolvimento:** Form validation (UX-002), Toast notifications (UX-014), Dialog (UX-008), Progress (UX-011) -- todos resolvidos com componentes prontos.
- **Bundle size:** Componentes sao tree-shakeable e copiados localmente. Sem overhead de runtime.

**NAO recomendo:**
- Tailwind puro: gastariamos 20-30h implementando a11y manualmente para cada componente interativo.
- Material UI / Ant Design / Chakra: pesados, opinated demais, conflitam com Tailwind existente.
- Headless UI: bom mas menos componentes que Radix, menos ecosistema.

### 2. WCAG: qual nivel alvo?

**Recomendacao: WCAG 2.1 Level AA.**

- Level A e o minimo legal -- insuficiente para uma ferramenta usada por comunidades religiosas inclusivas.
- Level AA cobre contraste de cores (A11Y-007), focus management (A11Y-008), e aria-live (A11Y-009).
- Level AAA e excessivo para MVP e inclui coisas como lang switching (PT/EN) que nao sao prioritarias.
- Igrejas frequentemente tem membros com deficiencias visuais/motoras -- a11y e uma questao de missao, nao apenas compliance.

### 3. UX-003: implementar D&D completo ou remover sugestao visual?

**Recomendacao: Implementar D&D completo.**

- O texto "ou arraste e solte" ja cria a expectativa. Remover o texto e uma regressao de UX.
- D&D e padrao em 2026 -- equipes de midia de igreja trabalham com imagens constantemente e esperam esse comportamento.
- Com Radix/react-dropzone, sao ~2h de implementacao real (nao 4h). Handlers: `onDrop`, `onDragOver` (preventDefault + visual), `onDragLeave` (reset visual).
- Adicionar file type validation e size check no mesmo handler.

### 4. UX-011: estimativa de tempo ou barra de progresso simulada?

**Recomendacao: Stepper honesto + estimativa textual.**

Nao recomendo barra de progresso simulada porque:
- Tempo do Gemini e imprevisivel (10-60s). Barra falsa que para em 90% e pior que nenhuma barra.
- Pastores valorizam honestidade. Barra fake e manipulativa.

Implementacao sugerida:
```
[x] Step 1: Analisando conteudo do video...    (concluido)
[ ] Step 2: Gerando artes visuais...           (em andamento)
    Isso geralmente leva 15-30 segundos.
```

Componente: `<Progress>` do shadcn/ui ou stepper customizado com Tailwind.

### 5. Mobile-first: melhorias para equipes de midia de igrejas?

A implementacao responsiva atual e **surpreendentemente boa** para um prototipo. Sidebar mobile com overlay, grids responsivos, form adaptivo. Melhorias especificas:

1. **Touch targets:** Botoes de copy em ResultsDisplay sao `opacity-0 group-hover:opacity-100` -- **hover nao existe em mobile**. Botoes de copia ficam invisiveis em celular. Correcao: sempre visivel em mobile (`md:opacity-0 md:group-hover:opacity-100`).
2. **Scroll apos resultado:** Apos AI gerar conteudo, usuario mobile precisa rolar manualmente. Adicionar `scrollIntoView({ behavior: 'smooth' })` para ResultsDisplay.
3. **Bottom navigation:** Para uso frequente por equipe de midia em celular, considerar bottom tab bar em vez de hamburger menu. Hamburger esconde navegacao -- equipes de midia alternam frequentemente entre Dashboard e Novo Episodio.
4. **Share nativo:** Em mobile, botao "Compartilhar" usando `navigator.share()` para enviar resultados via WhatsApp (principal canal de comunicacao de igrejas brasileiras).

### 6. Severidade UX-002 (alert) vs UX-009 (no retry)?

**UX-002 (`alert()`) deve ser priorizado sobre UX-009 (no retry).**

Razoes:
- UX-002 afeta **100% dos fluxos de submit** com campos vazios. E o caminho critico.
- UX-009 so ocorre quando a API Gemini falha -- cenario menos frequente.
- UX-002 tambem e um debito de a11y (A11Y-003) -- dois problemas resolvidos com um fix.
- Verificacao no codigo: UX-009 e parcialmente mitigado -- o form state JA persiste apos erro (apenas `setResult(null)` e chamado, nao `setFormData`). O usuario so precisa clicar "Analisar" novamente. Falta apenas um botao "Tentar Novamente" explicito no bloco de erro.

Prioridade ajustada: UX-002 (High, 3h) > UX-009 (High, 3h), mas ambos na mesma sprint.

---

## Design System Recommendation

| Opcao | Pros | Contras | Recomendacao |
|-------|------|---------|-------------|
| **shadcn/ui + Radix** | A11y nativa em todos componentes interativos; Tailwind-first (sem conflito); componentes copiados localmente (controle total); Tree-shakeable; Excelente DX; Temas customizaveis | Requer setup inicial (~4h); Componentes sao copy-paste (nao auto-update); Precisa de src/ reorganization | **RECOMENDADO** |
| Radix + Tailwind (sem shadcn) | Primitives puros sem estilo; Maximo controle visual; A11y nativa | Mais trabalho de styling manual; Sem componentes pre-estilizados; Mais lento para desenvolver | Viavel se time quiser 100% controle visual |
| Tailwind puro (custom) | Zero dependencias extras; Maximo controle; Bundle minimo | A11y manual para CADA componente interativo (~30h extra); Propenso a inconsistencias; Reinvencao da roda | NAO recomendado |
| Material UI / Chakra | Componentes ricos prontos; A11y embutida | Conflito com Tailwind; Bundle pesado; Estilo opinado que nao combina com design atual | NAO recomendado |

**Recomendacao Final: shadcn/ui + Radix UI + Tailwind CSS**

O design visual atual do Churchify ja e excelente (paleta indigo/violet, cards arredondados, uso consistente de spacing). shadcn/ui complementa sem substituir. Os componentes criticos que resolvem debitos existentes:

| Componente shadcn | Resolve Debito(s) |
|-------------------|-------------------|
| `<Toast>` | UX-014, feedback geral |
| `<AlertDialog>` | UX-008 (logout), confirmacoes |
| `<Form>` + `<Input>` | UX-002 (inline validation), A11Y-003 |
| `<Dialog>` / `<Sheet>` | A11Y-005, A11Y-008 (mobile menu) |
| `<Progress>` / `<Stepper>` | UX-011 (AI progress) |
| `<DropZone>` (custom + Radix) | UX-003 (D&D), UX-004 (file validation) |
| `<Skeleton>` | UX-006 (Dashboard loading) |
| `<Alert>` | UX-009 (error recovery) |

---

## UX Improvement Roadmap

### Quick Wins (< 4h cada)

| # | Item | Horas | Debitos Resolvidos |
|---|------|-------|-------------------|
| 1 | Inline form validation (substituir alert()) | 3h | UX-002, A11Y-003 |
| 2 | Aria-labels em botoes interativos | 2h | A11Y-001, A11Y-002, A11Y-006 |
| 3 | Retry button no bloco de erro | 3h | UX-009 |
| 4 | File size validation no upload | 1h | UX-004 |
| 5 | Fix color contrast (gray-400 -> gray-500) | 2h | A11Y-007 |
| 6 | Copy buttons visiveis em mobile | 1h | Mobile usability |
| 7 | Placeholder pages para Library/Settings | 2h | UX-016 |
| 8 | Alt text significativo nas imagens | 1h | A11Y-010 |
| 9 | Skip-to-content link | 1h | A11Y-004 |
| 10 | Aria-live no loading state | 1h | A11Y-009 |

### Medium Effort (4-16h)

| # | Item | Horas | Debitos Resolvidos |
|---|------|-------|-------------------|
| 1 | Drag-and-drop funcional completo | 4h | UX-003 |
| 2 | AI processing stepper com estimativa | 4h | UX-011 |
| 3 | shadcn/ui setup + migracao de componentes core | 8h | Base para todos os fixes |
| 4 | Focus trap + dialog no menu mobile | 4h | A11Y-005, A11Y-008 |
| 5 | Onboarding flow primeiro uso | 8h | UX-013 |
| 6 | Dashboard empty state real + skeleton | 4h | UX-001, UX-006 |
| 7 | Form persistence em sessionStorage | 2h | UX-018 |

### Major Improvements (16h+)

| # | Item | Horas | Debitos Resolvidos |
|---|------|-------|-------------------|
| 1 | Save/export resultados (depende DB-001) | 16h | UX-005 (o mais critico) |
| 2 | Dashboard conectado a dados reais (depende DB-001) | 12h | UX-001, SYS-005 |
| 3 | Design system completo (todos componentes shadcn) | 16h | Fundacao para escala |
| 4 | Mobile bottom navigation + share nativo | 8h | Mobile experience |

---

## Design Principles Recommended

### Para o publico-alvo de Churchify (pastores e equipes de midia de igrejas)

1. **Clareza sobre sofisticacao** — Pastores e equipes de midia querem resultado rapido, nao interface complexa. Cada tela deve ter UMA acao primaria clara. Evitar jargao tecnico ("SEO", "PSO") sem explicacao contextual.

2. **Confianca atraves de transparencia** — Mostrar exatamente o que a IA fez e nao fez. "Conteudo gerado a partir do titulo do video" (honesto) vs "Analise completa do sermao" (enganoso, dado SYS-013). Usuarios de igreja valorizam integridade.

3. **Mobile como cenario principal** — Equipes de midia frequentemente trabalham no celular, entre cultos, no transporte. Copiar texto para WhatsApp, revisar resultados rapidamente, compartilhar com o pastor. Bottom nav > hamburger. Share nativo > copy button.

4. **Feedback imediato e constante** — Cada acao do usuario deve ter resposta visual em <200ms. Loading states, success toasts, error recovery, save confirmations. Zero "silencio" da interface.

5. **Inclusao por design** — WCAG AA como minimo. Igrejas sao comunidades diversas -- membros com deficiencias visuais, motoras, cognitivas usarao a ferramenta. Acessibilidade nao e feature, e requisito.

---

## Estimativa Total

| Categoria | Horas |
|-----------|-------|
| UX Debits (validados, UX-001 a UX-012) | 44h |
| A11Y Debits (A11Y-001 a A11Y-010) | 12.5h |
| UX Debits adicionados (UX-013 a UX-018) | 18h |
| Design system setup (shadcn/ui) | 8h |
| **Total FE/UX** | **~82.5h** |

**Impacto UX geral (estado atual): 3/10** — Prototipo funcional com boa estetica, mas sem persistencia de dados, sem acessibilidade, sem feedback adequado, e com promessas quebradas (D&D, Dashboard). Apos resolucao dos debitos P0+P1: estimativa 7/10. Apos todos os debitos: 9/10.

---

*Review completo. Proximo passo: Phase 7 — @qa gate.*
