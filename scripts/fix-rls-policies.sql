-- =====================================================
-- 🔓 FIX: LIBERAR ACESSO ÀS TABELAS (RLS POLICIES)
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- para permitir acesso público de leitura
-- =====================================================

-- 1️⃣ TABELA CATEGORIAS - PERMITIR LEITURA PÚBLICA
DROP POLICY IF EXISTS "Allow public read access to categorias" ON categorias;
CREATE POLICY "Allow public read access to categorias"
ON categorias
FOR SELECT
TO public
USING (true);

-- 2️⃣ TABELA BEBIDAS - PERMITIR LEITURA PÚBLICA
DROP POLICY IF EXISTS "Allow public read access to bebidas" ON bebidas;
CREATE POLICY "Allow public read access to bebidas"
ON bebidas
FOR SELECT
TO public
USING (true);

-- 3️⃣ TABELA PEDIDOS - PERMITIR INSERÇÃO E LEITURA PÚBLICA
DROP POLICY IF EXISTS "Allow public insert to pedidos" ON pedidos;
CREATE POLICY "Allow public insert to pedidos"
ON pedidos
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to pedidos" ON pedidos;
CREATE POLICY "Allow public read access to pedidos"
ON pedidos
FOR SELECT
TO public
USING (true);

-- 4️⃣ VERIFICAR SE RLS ESTÁ ATIVADO (DEVE ESTAR)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE bebidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ✅ PRONTO! As bebidas agora vão aparecer no app!
-- =====================================================
-- 📋 O que fizemos:
-- • Permitimos leitura pública (SELECT) em categorias
-- • Permitimos leitura pública (SELECT) em bebidas
-- • Permitimos inserção pública (INSERT) em pedidos
-- • Permitimos leitura pública (SELECT) em pedidos
-- =====================================================
-- 🔒 SEGURANÇA:
-- • Mantemos RLS ativo para proteção
-- • Apenas leitura/inserção são públicas
-- • UPDATE e DELETE continuam protegidos
-- =====================================================
