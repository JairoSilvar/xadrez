XADREZ PRO v14.0.0 — GIT + VERCEL
=================================

Publicação oficial
------------------
1. Envie a pasta/projeto para o Git.
2. Importe/conecte o repositório na Vercel.
3. Configure no projeto Vercel UM destes pares de variáveis:
   KV_REST_API_URL + KV_REST_API_TOKEN
   ou
   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
4. Faça o deploy e abra a URL HTTPS da Vercel.

Salas compartilhadas
--------------------
- /api/rooms.js é o registro de descoberta/reserva.
- A cidade é escolhida automaticamente entre nomes livres.
- A reserva usa operação atômica SET NX no Redis/Upstash.
- Cada sala recebe roomInstanceId e hostToken.
- O nome volta a ficar disponível após encerramento/expiração.
- Não existe fallback invisível com Peer ID sufixado: uma sala lógica não cria uma cópia secreta.
- file:// pode abrir a interface para inspeção, mas NÃO possui /api/rooms e não cria salas compartilhadas.

DEV / TESTER
------------
- Ative pelo campo de nome usando 82=Nome.
- O botão DEV/TESTER aparece somente enquanto o modo está ativo.
- Teste completo mantém PASS/FAIL/TIMEOUT/NÃO TESTADO/REQUER INTERAÇÃO separados.
- Stress: 50, 100 ou 500 ciclos.
- A cada 5 ciclos há probe funcional com lances reais via interface; periodicamente PvE espera resposta real da IA e Bot-vs-Bot precisa produzir lance.
- O relatório continua persistente e exportável em JSON/TXT.

Observação
----------
P2P real, microfone, autoplay de rádio e espectador físico exigem hardware/permissões reais. O Tester não deve transformar esses casos em PASS sem execução real.

=== IMPORTANTE — GIT / VERCEL v14.0.1 ===
Os arquivos abaixo devem ficar NA RAIZ do repositório configurado como Root Directory na Vercel:
  index.html
  manifest.json
  sw.js
  vercel.json
  api/rooms.js

Não publique uma pasta-pai contendo outra pasta XadrezPro_v14.x como raiz do projeto. Se /api/rooms retornar 404, confirme primeiro que api/rooms.js está na raiz efetiva do deploy.
Depois do deploy, abra https://SEU-DOMINIO/api/rooms. O resultado esperado é JSON (200 se Redis configurado, ou 503 ROOM_REGISTRY_NOT_CONFIGURED se faltarem variáveis). 404 significa estrutura/root de deploy incorreta.
