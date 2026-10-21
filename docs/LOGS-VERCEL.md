# Xadrez 19.3.0 — Logs automáticos no GitHub e Vercel

Base confirmada: JairoSilvar/xadrez, main, bf7235540486803cdb46f5ef9bb7e4322c1a5183. O HTML da base coincide com a v19.0.0 enviada no chat. Esta branch integra coleta e Central DEV e substitui a proposta Oracle/SQLite por Vercel Functions + PostgreSQL Neon. Nenhuma instalação Oracle é necessária.

## O que entra nesta entrega

- `82=Nome` ativa DEV e abre a Central dentro do jogo. Repetir reabre; há botão separado para desativar. Os testes DEV anteriores continuam acessíveis.
- Coleta para todos os jogadores, independentemente de DEV, com fila local persistente de até 2 mil eventos, reenvio/ACK, lotes de até 20 eventos e 48 KB a cada 10 segundos. Sem conexão, fila permanece no navegador quando o armazenamento é permitido. Transbordo é contado; apagar dados ou bloquear armazenamento pode perder logs.
- Apelido e identificador aleatório local, sessão, ID da partida, horário do cliente e servidor, versão/modo/cor, adversário informado, dificuldade, relógios, navegador, resolução/orientação/fuso, FEN e histórico PGN. Nome não é identidade verificada.
- Jogadas com origem/destino, FEN antes/depois e casa real da captura. En passant recebe explicação no painel. Captura é observada após recordMoveHistoryPosition, sem alterar as regras do motor ou a busca interna da IA.
- Início/fim, solicitações/respostas IA, pedido de undo, presença, conectividade e categorias selecionadas de erro/diagnóstico. Não é gravação de tudo: Elo não é estruturado, mudanças fora do fluxo central podem aparecer apenas no snapshot e solicitação de undo não significa confirmação. Erros anteriores ao carregamento da telemetria não são capturados.
- Central: pendências, último envio, erros, filtros por nome exato/partida/tipo/período, eventos expansíveis, exportação TXT/JSON/PGN. Sem reconstrução visual do tabuleiro nesta entrega.
- Chave de leitura só em memória e apagada ao fechar; consultas canceladas. 82= é interface, não autenticação. Dados dinâmicos são mostrados como texto.
- API valida origem/formato/tamanho, remove campos sensíveis conhecidos, aplica rate limit persistente e usa parâmetros SQL. Guarda recebimento no servidor. Chave primária evita duplicatas de transporte; observações de dois clientes da mesma partida não são fundidas.
- Retenção padrão de 30 dias: registros expirados deixam de aparecer imediatamente nas consultas. Cron de produção remove até 10 mil registros expirados por dia e janelas de rate antigas. Volume maior requer aumentar frequência/lote conforme capacidade. Preview não executa o cron de produção.

## Configuração necessária na Vercel

1. Confirmar projeto `xadrez`, ligado a `JairoSilvar/xadrez`. Não mesclar/publicar esta alteração como se os logs estivessem ativos antes de configurar o banco.
2. Conectar um banco Neon PostgreSQL pelo Marketplace/Storage da Vercel. Verificar plano, região e custo antes de provisionar. Usar banco separado para Preview; não conectar testes/preview indiscriminadamente ao banco de produção.
3. Configurar em cada ambiente utilizado:
   - `DATABASE_URL`: conexão Neon, apenas no servidor.
   - `LOG_ADMIN_KEY`: segredo aleatório de pelo menos 32 caracteres, apenas no servidor.
   - `LOG_ALLOWED_ORIGINS`: origens HTTPS exatas do jogo, sem barra final, separadas por vírgula. Incluir a origem do preview se ele for testado. Não usar wildcard.
   - `LOG_RETENTION_DAYS`: 30 por padrão (faixa permitida: 1–365).
   - `CRON_SECRET`: outro segredo aleatório de pelo menos 32 caracteres, para autenticar o cron.
   Gere cada segredo localmente com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Não envie segredos no chat, não os coloque no HTML, no Git ou na URL.
4. Aplicar `migrations/001-logs.sql` no editor SQL do banco, ou executar `npm run logs:migrate` com DATABASE_URL já disponibilizada no ambiente local privado. O comando não carrega .env automaticamente. Não executar migração no build: ela deve ser uma ação explícita no banco correto. Migração é idempotente e não apaga tabelas existentes.
5. Publicar um preview e testar o fluxo abaixo. `telemetry-config.js` já aponta para `/api/telemetry`, no mesmo domínio.
6. Após a validação, mesclar e conferir o deploy de produção e a execução do cron. Versão visível: 19.3.0, com cache PWA novo. Atualização do PWA preserva o fluxo herdado de ativação.

## Aceite em produção

- Jogar partida real com apelido de teste, incluindo captura normal e de passagem quando possível.
- Abrir `82=Nome`: verificar último envio confirmado e pendências reduzidas.
- Informar a chave administrativa; consultar por nome/partida. Conferir nomes, horário, relógios, FEN anterior/posterior, resultado e ordem.
- Exportar TXT/JSON e PGN, conferir a sequência. Exportação geral limitada a 100 mil eventos; reduzir período se exceder.
- Desconectar, jogar alguns lances, reconectar e confirmar entrega sem duplicação.
- Fazer teste em PC e mobile e repetir em dois aparelhos para P2P.
- Confirmar que requisição GET sem chave retorna 401 e não revela dados. Sem configuração, API retorna 503 e o jogo continua funcionando com fila limitada.

## Segurança e limites operacionais

A API pública de ingestão é diagnóstico, não auditoria antifraude. Uma origem pode ser falsificada por clientes fora do navegador; CORS não autentica jogadores. Rate limit é de 120 lotes/minuto por hash do endereço encaminhado pela Vercel; não guarda IP bruto na tabela de eventos e pode agrupar pessoas atrás do mesmo NAT. Acrescentar limites no WAF conforme tráfego. O hash usa segredo para dificultar correlação externa e a janela de rate expira na limpeza. GET administrativo usa segredo longo e comparação de hash constante; implantar login individual se houver vários administradores.

Cada transação de ingestão usa lock transacional antes de atribuir cursor, mantendo a ordem entre lotes concorrentes. PGlite confirma execução do SQL, mas não substitui testes de concorrência/rede na Neon. Índices cobrem partida, apelido, tipo e recebimento. Monitorar custos/volume e backups do provedor. Fila e limites não garantem entrega de todos os eventos em qualquer condição.

PGN acima de 12 mil caracteres é truncado e marcado no cliente; a API exporta o último PGN não truncado, que pode ser anterior ao final. Os eventos individuais continuam disponíveis para reconstrução. Ao investigar, combinar partida, sessão e sequência; lacunas podem indicar perdas. Relógio do cliente pode estar incorreto: o servidor registra seu próprio recebimento em UTC e a Central exibe Brasília. Inputs de filtro usam o fuso do dispositivo.

A API não retorna credenciais e não grava chat/áudio por projeto; o scrub de campos conhecidos não substitui revisão caso novos tipos de dados sejam adicionados. O aviso de coleta está no menu. Atualizar informações de contato/retenção conforme a operação real.

## Validação desta branch

`npm test`: checagem estática, ensaio de telemetria em Node/VM, painel em DOM simulado, 13 testes de handler com armazenamento simulado e 1 ensaio SQL com PostgreSQL local PGlite (schema idempotente, JSONB, dedup, consulta parametrizada, filtros, cursores, rate e retenção).

Não foram executados: interface em navegador real (Chromium ausente), mobile físico, conexão real Neon, implantação Vercel, P2P real nesta branch. Os relatórios v19 preservados no repositório são históricos, não evidência de testes da 19.3.

A inspeção de variáveis do projeto Vercel foi recusada com 403 por falta de autorização ao escopo bahh. Nenhuma variável, banco ou deploy de produção foi alterado. É necessário liberar esse acesso ou configurar pelo painel da Vercel para concluir a ativação.
