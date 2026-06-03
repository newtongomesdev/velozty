-- ====================================================================================
-- SCRIPT DE ATUALIZAÇÃO SUPABASE - PAINEL ADMIN E DENÚNCIAS
-- ====================================================================================

-- 1. CRIAR A TABELA DE DENÚNCIAS (REPORTS)
CREATE TABLE IF NOT EXISTS public.social_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'volt', 'profile')),
    target_id UUID NOT NULL, -- ID do post, comment, volt ou profile que foi denunciado
    reason TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acted', 'dismissed')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GARANTIR A COLUNA IS_ADMIN NA TABELA PROFILES
-- Caso a coluna já exista, este comando não causará erro fatal se for adaptado,
-- mas a forma mais segura de adicionar caso não exista é via DO block:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. POLÍTICAS DE SEGURANÇA (RLS) PARA SOCIAL_REPORTS
ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

-- Usuários podem inserir denúncias
CREATE POLICY "Users can create reports"
    ON public.social_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Admins podem ver todas as denúncias
-- Considerando que admins possuem is_admin = TRUE na tabela profiles
CREATE POLICY "Admins can view all reports"
    ON public.social_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins podem atualizar denúncias (resolver/ignorar)
CREATE POLICY "Admins can update reports"
    ON public.social_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 4. ADICIONAR ADMINS MANUALMENTE (OPCIONAL)
-- Rode este update substituindo pelo ID correto do usuário para promover sua primeira conta.
-- UPDATE public.profiles SET is_admin = true WHERE email = 'egeohub101@gmail.com';
-- UPDATE public.profiles SET is_admin = true WHERE email = 'ngfilho@gmail.com';
