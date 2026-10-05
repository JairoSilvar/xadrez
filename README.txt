XADREZ v19 — DIAMANTE

Base: v18.0.0. Leia RELATORIO-TECNICO.md e AUDIT.json.

PRÉVIA LOCAL
Com Node.js instalado: node tests/serve.cjs
Abra http://127.0.0.1:8877/
A prévia local não implementa o registro público de salas.

TESTES
node tests/verify.cjs
http://127.0.0.1:8877/__tests
http://127.0.0.1:8877/__advanced
Os testes alteram apenas o armazenamento do endereço de teste. Use um perfil separado.

PUBLICAÇÃO
Preserve index.html, scripts, estilos, vendor, icons, manifest.json, sw.js, sw-v73.js, api/rooms.js e vercel.json.
Após atualizar uma PWA existente, feche as abas/instâncias antigas e reabra para ativar o worker novo.

PÓS-PARTIDA
Undo não reabre resultado liquidado. Use Revisão/Sandbox ou Novo jogo.
Neon: Configurações > Cores peças > brancas/pretas.
