-- 1. BACKUP PRIMEIRO (caso precise voltar)
CREATE TABLE bebidas_backup AS SELECT * FROM bebidas;

-- 2. SUBSTITUIR URLs LONGAS POR PLACEHOLDERS CURTOS
UPDATE bebidas 
SET imagem = '/placeholder.svg?height=200&width=300&text=' || nome
WHERE LENGTH(imagem) > 100;

-- 3. VERIFICAR RESULTADO
SELECT id, nome, LENGTH(imagem) as tamanho_url, imagem 
FROM bebidas 
ORDER BY tamanho_url DESC;

-- 4. FAZER O MESMO PARA CATEGORIAS (se tiver imagens)
UPDATE categorias 
SET imagem = '/placeholder.svg?height=100&width=100&text=' || nome
WHERE imagem IS NOT NULL AND LENGTH(imagem) > 100;

-- 5. EXPORTAR DADOS COMPACTADOS
COPY (
  SELECT 
    id, nome, descricao, preco, categoria_id, 
    imagem, estoque, ativo, created_at
  FROM bebidas
  ORDER BY id
) TO STDOUT WITH CSV HEADER;
