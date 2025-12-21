-- Ver tamanho atual das URLs
SELECT 
  'Bebidas' as tabela,
  COUNT(*) as total_registros,
  AVG(LENGTH(imagem)) as media_tamanho_url,
  MAX(LENGTH(imagem)) as maior_url,
  MIN(LENGTH(imagem)) as menor_url
FROM bebidas
WHERE imagem IS NOT NULL

UNION ALL

SELECT 
  'Categorias' as tabela,
  COUNT(*) as total_registros,
  AVG(LENGTH(imagem)) as media_tamanho_url,
  MAX(LENGTH(imagem)) as maior_url,
  MIN(LENGTH(imagem)) as menor_url
FROM categorias
WHERE imagem IS NOT NULL;
