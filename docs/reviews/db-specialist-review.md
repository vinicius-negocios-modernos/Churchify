# Database Specialist Review -- Churchify

**Reviewer:** Dara (@data-engineer)
**Date:** 2026-03-06
**Status:** REVIEWED

---

## Debitos Validados

| ID | Debito | Severidade (Original -> Ajustada) | Horas | Complexidade | Dependencias | Notas |
|----|--------|----------------------------------|-------|-------------|-------------|-------|
| DB-001 | No data persistence -- all results lost on refresh | Critical -> **Critical** | 28h | Complex | DB-003, SYS-001 | Estimativa original 24-32h realista. 28h considera schema design (4h), CRUD service layer (12h), migration de state para Firestore/Supabase (8h), testes (4h) |
| DB-002 | Firebase config usa placeholder credentials | Critical -> **High** | 1h | Simple | Nenhuma | Rebaixado: e config, nao vulnerabilidade. Trocar placeholders por env vars e trivial. Deduplicado com SYS-001 |
| DB-003 | No firebase.json -- projeto nao inicializado | High -> **High** | 1h | Simple | Nenhuma | Confirmado. Bloqueador para DB-004, DB-005. Se migrar para Supabase, este debt desaparece |
| DB-004 | No Firestore Security Rules | High -> **Critical** (se Firebase) | 8h | Medium | DB-003, DB-001 (schema) | Elevado para Critical: sem rules, dados ficam abertos ou inacessiveis. Precisa do schema definido antes de escrever rules |
| DB-005 | No Storage Security Rules | High -> **High** | 4h | Medium | DB-003, DB-004 | Confirmado. Pode ser feito junto com DB-004 |
| DB-006 | Dashboard usa mock data hardcoded | High -> **Medium** | 6h | Medium | DB-001 | Rebaixado: so e viavel DEPOIS de DB-001. Queries de agregacao simples |
| DB-007 | Images base64 em memoria | Medium -> **Medium** | 6h | Medium | DB-001, SYS-014 | Upload para Storage + salvar URLs no banco. 6h mais realista que 8h |
| DB-008 | No user profile collection | Medium -> **High** | 6h | Medium | DB-001 | Elevado: sem perfil de usuario nao ha como associar dados. E pre-requisito para quase tudo |
| DB-009 | No multi-tenancy / church isolation | Medium -> **Medium** | 20h | Complex | DB-001, DB-008 | Estimativa original 16-24h. 20h considerando modelo de tenant, RLS/rules, migracao |
| DB-010 | No per-user API key management | Medium -> **Medium** | 8h | Medium | SYS-002 (backend proxy) | Confirmado. Depende do proxy backend existir primeiro |
| DB-011 | No data export/backup strategy | Low -> **Low** | 3h | Simple | DB-001 | Firebase: scheduled export. Supabase: pg_dump nativo. Menos que 4h |
| DB-012 | No offline support | Low -> **Low** | 2h | Simple | DB-001 | Firebase: enableIndexedDbPersistence. Supabase: precisa lib extra. Adiavel para pos-MVP |

---

## Debitos Adicionados

| ID | Debito | Severidade | Horas | Complexidade | Notas |
|----|--------|-----------|-------|-------------|-------|
| DB-013 | No data validation at database level | **High** | 6h | Medium | Nem Firebase Rules nem Supabase CHECK constraints validam formato de dados. AnalysisResult e salvo sem schema enforcement. Risco de dados corrompidos |
| DB-014 | No audit trail / activity log | **Medium** | 8h | Medium | Nenhum registro de quem criou/editou episodios. Necessario para multi-tenancy e compliance |
| DB-015 | No migration strategy defined | **High** | 4h | Medium | Projeto nao tem mecanismo de schema evolution. Firebase: sem migrations. Supabase: tem migrations nativo |
| DB-016 | analysisResult stored as nested map (Firestore) or JSONB (Supabase) | **Medium** | 4h | Medium | O objeto AnalysisResult tem arrays aninhados (keyMoments, tags, etc). Em Firestore, maps profundos dificultam queries. Em Supabase, JSONB resolve mas precisa de indexes GIN |
| DB-017 | No rate limiting at database level | **Medium** | 4h | Simple | Sem limites de escrita por usuario/igreja. Um usuario pode gerar custos ilimitados de Gemini API |

---

## Respostas ao Architect

### 1. Schema proposto em DB-AUDIT.md e adequado?

O schema `users/{uid}` + `churches/{churchId}/episodes/{episodeId}` e **adequado para Firestore**, mas tem limitacoes:

- **Problema de subcollections:** Em Firestore, nao e possivel fazer query cross-collection facilmente (ex: "todos os episodios de TODAS as igrejas" para admin dashboard). Precisaria de Collection Group Queries.
- **analysisResult como map:** O objeto AnalysisResult e grande e complexo. Em Firestore, armazenar como subcampos de um documento funciona, mas limita queries por campos internos.
- **Recomendacao:** O schema esta correto para MVP. Para escala, considerar desnormalizar contadores (total episodios, horas economizadas) em `churches/{churchId}` para evitar aggregation queries.

### 2. Security Rules: user-scoped ou church-scoped?

**Church-scoped com role-based access.** Modelo recomendado:

```
match /churches/{churchId}/episodes/{episodeId} {
  allow read: if request.auth != null
    && exists(/databases/$(database)/documents/churches/$(churchId)/members/$(request.auth.uid));
  allow write: if request.auth != null
    && get(/databases/$(database)/documents/churches/$(churchId)/members/$(request.auth.uid)).data.role in ['admin', 'editor'];
}
```

- Leitura: qualquer membro da igreja
- Escrita: admin ou editor
- Isolamento: uma igreja nao ve dados de outra

Se Supabase: RLS nativo faz isso com menos codigo e melhor performance.

### 3. Multi-tenancy: subcollections vs top-level com churchId?

| Abordagem | Pros | Contras |
|-----------|------|---------|
| **Subcollections** (`churches/{id}/episodes/...`) | Isolamento natural, rules mais simples, reads escoped | Collection Group Queries para cross-church analytics, harder to flatten |
| **Top-level** (`episodes` com `churchId` field) | Queries globais faceis, flat structure | Rules mais complexas, precisa indexar `churchId`, risco de vazamento se rule errada |

**Recomendacao:** Subcollections para Firestore (isolamento natural). Top-level para Supabase/PostgreSQL (onde RLS resolve o isolamento e queries SQL sao flexiveis).

### 4. DB-001 estimativa 24-32h e realista?

**Sim, 28h e realista.** Breakdown:
- Schema design e documentacao: 4h
- Service layer (CRUD operations): 12h
- Refactor de React state para usar persistence: 8h
- Testes de integracao: 4h

Isso assume UMA plataforma (Firebase OU Supabase). Se precisar migrar de Firebase para Supabase, adicionar +8h.

### 5. Firestore vs Supabase?

Ver secao completa abaixo (Firebase vs Supabase Assessment).

### 6. DB-007 (images): Firebase Storage ou Cloud Storage direto?

- **Firebase Storage** (que e um wrapper sobre Cloud Storage) e suficiente e mais simples
- **Limites:** 5GB gratuito/mes. Imagens AI sao ~100KB-1MB cada. Com 2 imagens por episodio, teria ~5000 episodios gratuitos
- **Se Supabase:** Supabase Storage usa S3-compatible backend. Mesma facilidade, custos similares
- **Recomendacao:** Usar o Storage da plataforma escolhida (Firebase Storage ou Supabase Storage). Nao usar Cloud Storage direto -- adiciona complexidade sem beneficio

---

## Firebase vs Supabase Assessment

| Criterio | Firebase | Supabase | Recomendacao |
|----------|----------|----------|-------------|
| **Auth** | JA IMPLEMENTADO (Google Sign-In funciona) | Precisa reimplementar (~8h). Suporta Google OAuth nativamente | Firebase VENCE (custo de migracao) |
| **Database** | Firestore (NoSQL). Sem schema enforcement, queries limitadas, sem JOINs | PostgreSQL (SQL). Schema tipado, JOINs, views, functions | **Supabase VENCE** -- dados relacionais (users-churches-episodes) sao melhor modelados em SQL |
| **Security** | Rules DSL proprietaria, verbose, dificil de testar | RLS nativo do PostgreSQL. Policies declarativas, testavel com SQL | **Supabase VENCE** -- RLS e mais robusto e mais facil de auditar |
| **Real-time** | onSnapshot nativo, simples | Realtime via WebSockets, funcional | Empate |
| **Storage** | Firebase Storage (5GB free) | Supabase Storage (1GB free, S3-based) | Firebase tem mais storage gratuito |
| **Migrations** | NAO existe. Schema e implicit | Migrations nativas (`supabase migration new`) | **Supabase VENCE** -- essencial para evolucao de schema |
| **Local dev** | Emulators (funciona mas pesado) | Docker compose (`supabase start`) | Supabase e mais leve |
| **Hosting** | Firebase Hosting gratuito | Precisa de Vercel/Railway separado | Firebase VENCE |
| **Custo (MVP)** | Spark plan gratuito (generoso) | Free tier: 500MB DB, 1GB storage, 50K MAU | Empate para MVP |
| **Vendor lock-in** | Alto (APIs proprietarias) | Baixo (PostgreSQL padrao, pode migrar) | **Supabase VENCE** |
| **Complexidade de migracao** | Zero (ja esta no projeto) | 16-20h (reescrever auth + implementar DB) | Firebase VENCE |
| **Fit com .env.example** | Nao listado no .env.example do AIOX | `SUPABASE_URL`, `SUPABASE_ANON_KEY` ja presentes | Supabase VENCE (padrao AIOX) |

### Veredicto: MIGRAR PARA SUPABASE

**Justificativa:**
1. O projeto NAO USA Firestore -- so Auth esta ativo. A "divida de migracao" e apenas Auth (~8h), nao dados
2. Os dados sao inerentemente relacionais: users -> churches -> episodes -> results. PostgreSQL modela isso nativamente; Firestore luta com JOINs
3. RLS do PostgreSQL e vastamente superior a Firestore Rules para multi-tenancy (DB-009)
4. Migrations nativas resolvem DB-015 automaticamente
5. `.env.example` do AIOX ja tem Supabase configurado -- e o padrao do ecossistema
6. DB-004, DB-005, DB-013 sao todos resolvidos de forma mais robusta com PostgreSQL constraints + RLS
7. Menor vendor lock-in para o futuro

**Custo da migracao:**
- Reimplementar Auth com Supabase: 8h
- Remover Firebase SDK + config: 2h
- Total overhead: ~10h
- Economia: DB-003 (1h), DB-004 (-8h Firebase rules, substituido por RLS mais simples ~4h), DB-005 (Storage policies mais simples ~2h)
- **Custo liquido: ~6h extra**, mas resultado final muito superior

---

## Recommended Resolution Order (DB Perspective)

### Phase 0 -- Decision (2h)
1. **Decidir Firebase vs Supabase** -- Recomendo Supabase (ver assessment acima)

### Phase 1 -- Foundation (16h)
2. **Setup Supabase project** -- `supabase init`, conectar ao projeto, configurar env vars (2h)
3. **Auth migration** -- Substituir Firebase Auth por Supabase Auth com Google OAuth (8h)
4. **DB-008: User profiles table** -- `CREATE TABLE profiles` com trigger on auth.users insert (2h)
5. **Remove Firebase SDK** -- Limpar `lib/firebase.ts`, remover dependencias (2h)
6. **DB-015: Migration strategy** -- Ja resolvido com `supabase migration` (2h incluido no setup)

### Phase 2 -- Core Persistence (20h)
7. **DB-001: Schema + persistence layer** -- Criar tabelas `churches`, `episodes`, `analysis_results` + service layer (16h)
8. **DB-013: Data validation** -- CHECK constraints, NOT NULL, tipos corretos nas tabelas (2h, junto com schema)
9. **DB-004 equivalent: RLS policies** -- Row-level security para isolamento church-scoped (4h, junto com schema)

### Phase 3 -- Storage + Images (8h)
10. **DB-007: Image persistence** -- Supabase Storage buckets + URLs no banco (6h)
11. **DB-005 equivalent: Storage policies** -- Bucket policies para upload scoped (2h)

### Phase 4 -- Features (14h)
12. **DB-006: Dashboard com dados reais** -- Queries SQL para stats reais (6h)
13. **DB-010: API key proxy** -- Edge Function para proxy Gemini + usage tracking (8h)

### Phase 5 -- Growth (20h)
14. **DB-009: Multi-tenancy completo** -- Roles, convites, isolamento total (16h)
15. **DB-014: Audit trail** -- Tabela de audit com triggers (4h)

### Phase 6 -- Polish (9h)
16. **DB-017: Rate limiting** -- Limites por usuario/igreja (4h)
17. **DB-011: Backups** -- pg_dump scheduled (3h)
18. **DB-012: Offline/caching** -- Service worker + cache strategy (2h)
19. **DB-016: JSONB indexes** -- GIN indexes para queries em analysisResult (incluido em Phase 2)

---

## Schema Proposal (Supabase/PostgreSQL)

```sql
-- ============================================
-- Churchify Database Schema (Supabase)
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'viewer', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, photo_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Churches (tenants)
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Church Members (many-to-many with roles)
CREATE TABLE public.church_members (
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (church_id, user_id)
);

-- 4. Episodes (sermon analyses)
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  preacher_name TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  analysis_result JSONB,  -- stores full AnalysisResult object
  thumbnail_url TEXT,      -- Supabase Storage URL
  artwork_url TEXT,        -- Supabase Storage URL
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. API Usage Tracking
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  endpoint TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_episodes_church_id ON public.episodes(church_id);
CREATE INDEX idx_episodes_status ON public.episodes(status);
CREATE INDEX idx_episodes_created_at ON public.episodes(created_at DESC);
CREATE INDEX idx_church_members_user_id ON public.church_members(user_id);
CREATE INDEX idx_api_usage_church_id ON public.api_usage(church_id);
CREATE INDEX idx_api_usage_created_at ON public.api_usage(created_at DESC);
-- GIN index for JSONB queries on analysis_result
CREATE INDEX idx_episodes_analysis_gin ON public.episodes USING GIN (analysis_result);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Churches: members can read their church
CREATE POLICY "Members can view their church" ON public.churches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.church_members WHERE church_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Owners can update their church" ON public.churches
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Authenticated users can create churches" ON public.churches
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Church Members: members can see other members of same church
CREATE POLICY "Members can view church members" ON public.church_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.church_members cm WHERE cm.church_id = church_members.church_id AND cm.user_id = auth.uid())
  );
CREATE POLICY "Admins can manage members" ON public.church_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.church_members cm WHERE cm.church_id = church_members.church_id AND cm.user_id = auth.uid() AND cm.role = 'admin')
  );

-- Episodes: church members can read, editors/admins can write
CREATE POLICY "Members can view church episodes" ON public.episodes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.church_members WHERE church_id = episodes.church_id AND user_id = auth.uid())
  );
CREATE POLICY "Editors can create episodes" ON public.episodes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.church_members WHERE church_id = episodes.church_id AND user_id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "Editors can update episodes" ON public.episodes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.church_members WHERE church_id = episodes.church_id AND user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- API Usage: admins can view church usage
CREATE POLICY "Admins can view church usage" ON public.api_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.church_members WHERE church_id = api_usage.church_id AND user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "System can insert usage" ON public.api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Storage Buckets
-- ============================================
-- Create via Supabase Dashboard or migration:
-- Bucket: episode-images (public read, auth write)
-- Path pattern: {church_id}/{episode_id}/{filename}
```

---

## Estimativa Total

| Fase | Horas | Descricao |
|------|-------|-----------|
| Phase 0 | 2h | Decision |
| Phase 1 | 16h | Foundation (Supabase setup + auth migration + profiles) |
| Phase 2 | 20h | Core persistence (schema + CRUD + RLS) |
| Phase 3 | 8h | Storage + images |
| Phase 4 | 14h | Dashboard + API proxy |
| Phase 5 | 20h | Multi-tenancy + audit |
| Phase 6 | 9h | Polish (rate limiting, backups, offline) |
| **TOTAL** | **89h** | |

- **MVP (Phases 0-3):** 46h -- app funcional com persistencia, auth, storage
- **Production (+ Phase 4):** 60h -- dashboard real, API segura
- **Full (all phases):** 89h -- multi-tenancy completo, audit, polish
- **Risco:** Medium -- migracao de Auth e o maior risco tecnico (8h). Mitigar com spike de 2h antes

---

*Revisao completa. Recomendacao principal: migrar para Supabase antes de implementar persistencia. O custo extra de ~6h e amplamente compensado pela qualidade superior do resultado final.*
