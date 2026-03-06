# Guia de Execucao Autonoma — Claude Code + AIOX

> **Data:** 2026-02-11
> **Autor:** Orion (AIOX Master)
> **Objetivo:** Maximizar trabalho autonomo sem intervencao humana
> **Status:** Pronto para uso

---

## Sumario Executivo

Este documento descreve **todas as tecnicas disponiveis** para fazer o Claude Code trabalhar de forma autonoma — enquanto voce dorme, por exemplo. Combinamos os recursos nativos do Claude Code com o que ja existe no framework AIOX para criar um setup de produtividade maxima.

**As 5 camadas de autonomia:**

1. **YOLO Mode (AIOX)** — desenvolvimento autonomo de stories com decision logging
2. **Subagents/Task Tool** — delegacao paralela dentro de uma sessao
3. **Custom Agents (.claude/agents/)** — agentes especializados reutilizaveis
4. **Headless Mode (claude -p)** — execucao nao-interativa em scripts
5. **Sessoes Paralelas (Git Worktrees)** — multiplas instancias isoladas

---

## Indice

1. [Setup Rapido — Comece Hoje](#1-setup-rapido)
2. [YOLO Mode (AIOX)](#2-yolo-mode-aiox)
3. [Subagents e Task Tool](#3-subagents-e-task-tool)
4. [Custom Agents](#4-custom-agents)
5. [Headless Mode](#5-headless-mode)
6. [Sessoes Paralelas com Git Worktrees](#6-sessoes-paralelas-com-git-worktrees)
7. [Fan-Out: Processamento em Lote](#7-fan-out-processamento-em-lote)
8. [Receitas Prontas (Copy-Paste)](#8-receitas-prontas)
9. [Configuracoes de Permissao](#9-configuracoes-de-permissao)
10. [Retomando o Trabalho ao Acordar](#10-retomando-o-trabalho)
11. [Custos e Otimizacao](#11-custos-e-otimizacao)
12. [Fontes](#12-fontes)

---

## 1. Setup Rapido

### Passo 1: Configurar permissoes para autonomia

```json
// .claude/settings.json (no projeto)
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git *)",
      "Bash(node *)",
      "Bash(mkdir *)",
      "Bash(ls *)",
      "Bash(cat *)"
    ]
  }
}
```

### Passo 2: Preparar o CLAUDE.md para autonomia

Adicionar no CLAUDE.md do projeto:

```markdown
## Autonomous Execution Rules
- When in YOLO mode, make decisions autonomously and log them
- Run tests after every implementation change
- If tests fail 3 times, stop and log the issue in the decision log
- Commit after each completed task with conventional commit messages
- Never skip linting or type checking
```

### Passo 3: Nomear sessoes para facilitar retomada

```bash
# Ao iniciar trabalho, sempre nomeie a sessao
claude
> /rename feature-auth-oauth
```

---

## 2. YOLO Mode (AIOX)

O YOLO Mode e o modo autonomo primario do AIOX. Ja esta implementado e pronto para uso.

### Como Funciona

- **0-1 prompts do usuario** — execucao quase totalmente autonoma
- **Decision logging automatico** — toda decisao registrada em `.ai/decision-log-{story-id}.md`
- **CodeRabbit self-healing** — corrige issues CRITICAL automaticamente (max 2 iteracoes)
- **Formato ADR** — log compativel com Architecture Decision Records

### Ativar

```bash
# Ativar agente dev
@dev

# Executar story em YOLO mode
*develop-yolo docs/stories/story-2.5.md
```

### O Que Fica Registrado

| Tipo | Exemplos |
|------|----------|
| Decisoes de biblioteca | "Escolhi Axios por compatibilidade com interceptors" |
| Decisoes de arquitetura | "REST over GraphQL - API simples, sem nested queries" |
| Decisoes de teste | "Jest com coverage minimo de 80%" |
| Arquivos modificados | Lista completa de criados/alterados/deletados |
| Resultados de testes | passed/failed/duration por suite |
| Hash do commit | Para rollback se necessario |

### Condicoes de Parada Automatica (Seguranca)

Mesmo em YOLO, o agente PARA e registra se:
- Dependencia nao-aprovada necessaria
- Requisitos ambiguos apos checar story
- 3 falhas consecutivas tentando implementar/corrigir
- Configuracao faltando
- Testes de regressao falhando

### Selecao de Modo por Complexidade

| Complexidade | Tempo | Modo Recomendado |
|---|---|---|
| Trivial | < 2h | YOLO |
| Simples | 2-4h | YOLO ou Interactive |
| Moderada | 4-8h | Interactive |
| Complexa | 8-16h | Interactive ou Pre-Flight |
| Muito Complexa | > 16h | Pre-Flight |

---

## 3. Subagents e Task Tool

Subagents rodam em **context window proprio** e retornam apenas o resultado resumido.

### Tipos Built-in

| Subagent | Modelo | Ferramentas | Uso |
|---|---|---|---|
| **Explore** | Haiku (rapido) | Read-only | Busca e analise de codebase |
| **Plan** | Herda do pai | Read-only | Pesquisa para planejamento |
| **General-purpose** | Herda do pai | Todas | Tarefas complexas multi-step |

### Execucao Paralela

Subagents podem rodar em paralelo quando sao independentes:

```
Research the authentication, database, and API modules
in parallel using separate subagents
```

Claude spawna 3 subagents simultaneos, cada um explorando um modulo.

### Foreground vs Background

| Modo | Comportamento |
|---|---|
| **Foreground** | Bloqueia conversa principal ate completar |
| **Background** | Roda em paralelo, voce continua trabalhando |

```
# Rodar em background
Use a subagent in the background to run all tests and report failures

# Ou pressione Ctrl+B para backgroundar tarefa em andamento
```

### Padrao: Writer/Reviewer

Usar subagents para auto-revisao:

```
1. Use a subagent to implement the feature
2. Use another subagent to review the implementation for edge cases
3. Synthesize and apply the review feedback
```

### Encadear Subagents

```
Use the code-reviewer subagent to find performance issues,
then use the optimizer subagent to fix them
```

### Resumir Subagents

Subagents podem ser retomados com contexto completo:

```
Continue that code review and now analyze the authorization logic
```

---

## 4. Custom Agents

Crie agentes especializados reutilizaveis em `.claude/agents/`.

### Estrutura

```
.claude/agents/
├── aiox-dev.md          # Dev agent do AIOX como subagent
├── aiox-qa.md           # QA agent do AIOX como subagent
├── security-reviewer.md # Revisor de seguranca
├── test-runner.md       # Executor de testes
└── story-implementer.md # Implementador autonomo de stories
```

### Exemplo: Story Implementer Autonomo

```markdown
---
name: story-implementer
description: Implements user stories autonomously following AIOX patterns. Use proactively for story development.
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
permissionMode: acceptEdits
memory: project
---

You are an autonomous story implementer following Synkra AIOX methodology.

When invoked with a story file:
1. Read the complete story file and acceptance criteria
2. Analyze the codebase for existing patterns
3. Implement each task sequentially
4. Run tests after each task
5. Log all decisions to .ai/decision-log-{story-id}.md
6. Run linting and type checking
7. Commit with conventional commit messages
8. Report completion status

Decision logging format:
- Type: library-choice | architecture | testing-strategy | etc
- Priority: critical | high | medium | low
- Decision + rationale + alternatives considered

Safety: Stop after 3 consecutive failures on the same task.
```

### Exemplo: QA Reviewer Autonomo

```markdown
---
name: qa-reviewer
description: Reviews code for quality, security, and test coverage. Use proactively after code changes.
tools: Read, Grep, Glob, Bash
model: sonnet
memory: project
---

You are a senior QA engineer. Review code thoroughly.

When invoked:
1. Run git diff to see recent changes
2. Check test coverage for modified files
3. Review for security vulnerabilities (OWASP Top 10)
4. Check for performance issues
5. Validate error handling
6. Report findings by severity: CRITICAL > HIGH > MEDIUM > LOW

Always provide specific line references and suggested fixes.
```

### Persistent Memory para Subagents

```yaml
memory: project  # ou "user" para cross-project
```

Com memory habilitada:
- Subagent lembra padroes do codebase entre sessoes
- Acumula conhecimento sobre convencoes do projeto
- `MEMORY.md` automatico no diretorio de memory

---

## 5. Headless Mode

O modo `claude -p` permite execucao nao-interativa — perfeito para scripts e automacao.

### Basico

```bash
# Query simples
claude -p "What does the auth module do?"

# Com output estruturado
claude -p "List all API endpoints" --output-format json

# Streaming em tempo real
claude -p "Analyze this log file" --output-format stream-json
```

### Com Auto-Approve de Ferramentas

```bash
# Permite leitura + edicao + bash
claude -p "Run tests and fix failures" \
  --allowedTools "Bash,Read,Edit"

# Permite apenas git commands especificos
claude -p "Create a commit for staged changes" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git commit *)"
```

### YOLO Total (Cuidado!)

```bash
# Bypassa TODAS as permissoes - usar com cuidado
claude --dangerously-skip-permissions -p "Implement the feature in story-2.5.md"
```

> **AVISO:** `--dangerously-skip-permissions` permite qualquer operacao sem confirmacao.
> Idealmente usar em container Docker sem internet. Ou com `--allowedTools` restrito.

### Continuar Conversas

```bash
# Primeira execucao
claude -p "Review this codebase for performance issues"

# Continuar a mais recente
claude -p "Now focus on database queries" --continue

# Capturar session ID para retomar especifica
session_id=$(claude -p "Start review" --output-format json | jq -r '.session_id')
claude -p "Continue review" --resume "$session_id"
```

### System Prompt Customizado

```bash
# Adicionar instrucoes ao system prompt padrao
claude -p "Review auth module" \
  --append-system-prompt "You are a security engineer. Focus on vulnerabilities."

# Ou substituir completamente
claude -p "Analyze code" \
  --system-prompt "You are a performance optimization specialist."
```

### Subagents via CLI

```bash
# Definir subagents inline para uma sessao
claude -p "Review and fix the auth module" --agents '{
  "security-checker": {
    "description": "Checks for security vulnerabilities",
    "prompt": "You are a security expert. Find OWASP Top 10 issues.",
    "tools": ["Read", "Grep", "Glob"],
    "model": "sonnet"
  },
  "fixer": {
    "description": "Fixes identified issues",
    "prompt": "Fix security issues found by the checker.",
    "tools": ["Read", "Edit", "Write", "Bash"],
    "model": "opus"
  }
}'
```

---

## 6. Sessoes Paralelas com Git Worktrees

Cada worktree = diretorio isolado = sessao Claude Code independente.

### Setup

```bash
# Criar worktrees para trabalho paralelo
git worktree add ../churchify-feature-auth -b feature/auth
git worktree add ../churchify-feature-payments -b feature/payments
git worktree add ../churchify-bugfix-login -b bugfix/login
```

### Executar em Paralelo

```bash
# Terminal 1: Feature auth
cd ../churchify-feature-auth
claude --dangerously-skip-permissions -p "Implement OAuth2 login following the story in docs/stories/story-3.1.md"

# Terminal 2: Feature payments
cd ../churchify-feature-payments
claude --dangerously-skip-permissions -p "Implement payment integration following docs/stories/story-3.2.md"

# Terminal 3: Bugfix
cd ../churchify-bugfix-login
claude --dangerously-skip-permissions -p "Fix the login timeout bug described in issue #42"
```

### Script de Automacao

```bash
#!/bin/bash
# run-parallel-stories.sh
# Executa multiplas stories em paralelo usando worktrees

STORIES=("story-3.1" "story-3.2" "story-3.3")
BASE_DIR=$(pwd)
REPO_NAME=$(basename "$BASE_DIR")

for story in "${STORIES[@]}"; do
  WORKTREE_DIR="../${REPO_NAME}-${story}"
  BRANCH="feature/${story}"

  # Criar worktree se nao existe
  if [ ! -d "$WORKTREE_DIR" ]; then
    git worktree add "$WORKTREE_DIR" -b "$BRANCH"
    # Instalar dependencias no novo worktree
    (cd "$WORKTREE_DIR" && npm install)
  fi

  # Executar Claude em background
  (
    cd "$WORKTREE_DIR"
    claude --dangerously-skip-permissions -p \
      "Implement the story in docs/stories/${story}.md using YOLO mode.
       Log all decisions to .ai/decision-log-${story}.md.
       Run tests after each task. Commit with conventional commits.
       Stop after 3 consecutive failures on the same task." \
      --allowedTools "Read,Write,Edit,Bash,Grep,Glob" \
      --output-format json > "../logs/${story}-output.json" 2>&1
    echo "[$story] COMPLETED at $(date)" >> "../logs/parallel-execution.log"
  ) &

  echo "Started $story in $WORKTREE_DIR (PID: $!)"
done

echo ""
echo "All stories started in parallel!"
echo "Monitor: tail -f ../logs/parallel-execution.log"
echo "Check individual: cat ../logs/story-X.X-output.json | jq '.result'"

wait
echo "All stories completed!"
```

### Cleanup

```bash
# Listar worktrees
git worktree list

# Remover quando terminar
git worktree remove ../churchify-feature-auth
```

---

## 7. Fan-Out: Processamento em Lote

Para migracoes ou refatoracoes em escala.

### Padrao Basico

```bash
# 1. Gerar lista de arquivos
claude -p "List all Python files that need migrating from v2 to v3 API" \
  --output-format json | jq -r '.result' > files.txt

# 2. Processar cada arquivo em paralelo
cat files.txt | xargs -P 4 -I {} \
  claude -p "Migrate {} from v2 to v3 API. Run tests after." \
    --allowedTools "Read,Edit,Bash(npm test *)"
```

### Fan-Out com Controle

```bash
#!/bin/bash
# fan-out-migration.sh
MAX_PARALLEL=4

migrate_file() {
  local file=$1
  echo "[START] $file"
  claude -p "Migrate $file from React class components to hooks. Return OK or FAIL." \
    --allowedTools "Read,Edit,Bash(npm test *)" \
    --output-format json | jq -r '.result'
  echo "[DONE] $file"
}

export -f migrate_file

# Executar com controle de paralelismo
cat files-to-migrate.txt | xargs -P $MAX_PARALLEL -I {} bash -c 'migrate_file "$@"' _ {}
```

---

## 8. Receitas Prontas

### Receita 1: "Vou dormir, implemente esta story"

```bash
# Setup: criar worktree isolado
git worktree add ../churchify-overnight -b feature/overnight-work

cd ../churchify-overnight
npm install

# Executar autonomamente
claude --dangerously-skip-permissions -p "
You are working autonomously overnight. Follow these steps:

1. Read the story: docs/stories/story-3.5.md
2. Analyze the codebase for existing patterns
3. Implement each acceptance criterion
4. After each task:
   - Run: npm test
   - Run: npm run lint
   - If tests pass, commit with conventional commit
   - If tests fail 3 times, log the issue and move to next task
5. Log all decisions to .ai/decision-log-overnight.md
6. When all tasks complete, create a summary in .ai/overnight-summary.md

IMPORTANT:
- Follow existing code patterns exactly
- Never modify files outside the story scope
- Commit frequently (after each task)
- Stop completely if you encounter ambiguous requirements
" --output-format json > ../logs/overnight-$(date +%Y%m%d).json 2>&1 &

echo "Overnight work started! PID: $!"
echo "Check progress: tail -f ../logs/overnight-$(date +%Y%m%d).json"
echo "Good night! 🌙"
```

### Receita 2: "Vou dormir, revise todo o codigo"

```bash
claude --dangerously-skip-permissions -p "
Perform a comprehensive code review of the entire src/ directory.

For each file:
1. Check for security vulnerabilities
2. Check for performance issues
3. Check test coverage
4. Check error handling
5. Check naming conventions

Generate a report at docs/qa/full-review-$(date +%Y%m%d).md with:
- Summary of findings
- Issues by severity (CRITICAL/HIGH/MEDIUM/LOW)
- Specific file:line references
- Suggested fixes

Use subagents to parallelize the review across modules.
" --allowedTools "Read,Grep,Glob,Bash(npm test *),Write" \
  --output-format json > ../logs/review-$(date +%Y%m%d).json 2>&1 &
```

### Receita 3: "Implemente 3 stories em paralelo"

```bash
#!/bin/bash
# overnight-parallel.sh

STORIES=("story-3.1" "story-3.2" "story-3.3")

for story in "${STORIES[@]}"; do
  git worktree add "../churchify-${story}" -b "feature/${story}" 2>/dev/null

  (
    cd "../churchify-${story}"
    npm install --silent

    claude --dangerously-skip-permissions -p "
    Implement docs/stories/${story}.md completely.
    Run tests after each task. Commit after each task.
    Log decisions to .ai/decision-log-${story}.md.
    Create summary at .ai/summary-${story}.md when done.
    " --output-format json > "../logs/${story}-$(date +%Y%m%d).json" 2>&1

    echo "[DONE] ${story} at $(date)" >> "../logs/overnight-status.log"
  ) &
done

echo "3 stories running in parallel!"
echo "Monitor: tail -f ../logs/overnight-status.log"
wait
echo "All done! Check ../logs/ for results."
```

### Receita 4: "Continue de onde parei"

```bash
# Ao acordar, retomar trabalho
claude --continue   # retoma a ultima conversa

# Ou retomar uma sessao especifica
claude --resume feature-auth-oauth

# Ou ver todas as sessoes disponiveis
claude --resume   # abre picker interativo
```

---

## 9. Configuracoes de Permissao

### Niveis de Autonomia

| Nivel | Config | Quando Usar |
|---|---|---|
| **Conservador** | Permissoes padrao | Trabalho interativo normal |
| **Moderado** | `--allowedTools "Read,Edit,Bash(...)"` | Tarefas especificas com escopo limitado |
| **Autonomo** | `permissionMode: acceptEdits` | Subagents autonomos |
| **Total** | `--dangerously-skip-permissions` | Overnight/container isolado |

### Setup Recomendado para Trabalho Noturno

```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(npm run *)",
      "Bash(npm test *)",
      "Bash(npx *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(node *)",
      "Bash(mkdir *)",
      "Bash(ls *)"
    ],
    "deny": [
      "Bash(git push *)",
      "Bash(git checkout main)",
      "Bash(git merge *)",
      "Bash(rm -rf *)",
      "Bash(npm publish *)"
    ]
  }
}
```

Isso permite trabalho autonomo mas **bloqueia acoes destrutivas e push**.

---

## 10. Retomando o Trabalho

### Ao Acordar — Checklist

```bash
# 1. Ver status dos logs
cat ../logs/overnight-status.log

# 2. Ver decision logs
cat .ai/decision-log-*.md

# 3. Ver resumo do trabalho
cat .ai/overnight-summary.md

# 4. Retomar sessao se necessario
claude --continue

# 5. Revisar commits feitos
git log --oneline -20

# 6. Rodar testes completos
npm test

# 7. Se tudo ok, merge as branches
git checkout main
git merge feature/overnight-work
```

### Se Algo Deu Errado

```bash
# Ver onde parou
git log --oneline -5

# Reverter ultimo commit se necessario
git revert HEAD

# Ou voltar para estado anterior
git reset --soft HEAD~3  # volta 3 commits mantendo mudancas

# Retomar com contexto
claude --continue -p "Review what was done overnight and fix any issues"
```

---

## 11. Custos e Otimizacao

### Estimativas de Token por Cenario

| Cenario | Tokens | Custo Aprox |
|---|---|---|
| Story simples (YOLO) | ~200k | ~$3-5 |
| Story + 3 subagents | ~440k | ~$7-10 |
| Review completo do projeto | ~300-500k | ~$5-10 |
| 3 stories paralelas (worktrees) | ~600k total | ~$10-15 |
| Fan-out migracao (10 arquivos) | ~500k | ~$8-12 |

### Dicas de Otimizacao

1. **Use Haiku para subagents de pesquisa** — 10x mais barato que Opus
2. **Use Sonnet para reviews** — bom equilibrio custo/qualidade
3. **Reserve Opus para implementacao** — melhor qualidade de codigo
4. **Plan first (barato), execute depois (caro)** — evita retrabalho
5. **Scope estreito** — quanto mais focada a task, menos tokens
6. **`/clear` entre tarefas** — evita context pollution

### Modelo por Tipo de Tarefa

```markdown
# .claude/agents/
research-agent.md    → model: haiku    # Pesquisa rapida e barata
review-agent.md      → model: sonnet   # Review equilibrado
implement-agent.md   → model: opus     # Implementacao de qualidade
```

---

## 12. Fontes

| Fonte | URL |
|-------|-----|
| Claude Code Docs — Subagents | https://code.claude.com/docs/en/sub-agents |
| Claude Code Docs — Headless Mode | https://code.claude.com/docs/en/headless |
| Claude Code Docs — Common Workflows | https://code.claude.com/docs/en/common-workflows |
| Claude Code Docs — Best Practices | https://code.claude.com/docs/en/best-practices |
| Claude Code — Git Worktrees Parallel | https://medium.com/@dtunai/mastering-git-worktrees-with-claude-code-for-parallel-development-workflow-41dc91e645fe |
| parallel-cc (Autonomous Multi-Session) | https://github.com/frankbria/parallel-cc |
| Auto Claude (Multi-Session) | https://github.com/ruizrica/auto-claude |
| Claude Code Batch Processing Guide | https://smartscope.blog/en/generative-ai/claude/claude-code-batch-processing/ |
| Safe YOLO Mode Guide | https://pasqualepillitteri.it/en/news/141/claude-code-dangerously-skip-permissions-guide-autonomous-mode |
| Anthropic — Enabling Autonomous Work | https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously |

---

*Documento gerado por Orion (AIOX Master) — Synkra AIOX Framework*
*Churchify Project — 2026-02-11*
