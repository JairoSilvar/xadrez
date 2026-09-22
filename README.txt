XADREZ PRO v15.0.0 — INTERFACE RESPONSIVA

COMO PUBLICAR
1. Extraia o ZIP.
2. Copie o conteúdo extraído para a raiz do repositório ligado ao txadrez na Vercel.
3. Não crie uma pasta extra envolvendo index.html e api/.
4. Publique pelo seu fluxo normal do GitHub/Vercel.
5. Reabra o jogo e confirme v15.0 na tela inicial. Se a versão anterior continuar aparecendo, feche e reabra o aplicativo e atualize a página.

ARQUIVOS DO APLICATIVO ALTERADOS
- index.html: versão 15, inclusão da interface e proteção contra iniciar dois testes simultâneos.
- sw.js: versão do cache e inclusão dos dois arquivos novos.
- interface-v15.css: novo arquivo de apresentação responsiva.
- interface-v15.js: novo arquivo de organização dos menus, prévias, rádio e exportação de logs.
Os quatro devem ser publicados juntos.

PRESERVADOS
api/rooms.js, manifest.json, vercel.json e sw-v73.js foram mantidos da base. O motor e as regras de xadrez não foram substituídos. Nenhum recurso foi intencionalmente removido. Desistir e propor empate estão em Opções.

CONFIGURAÇÃO VERCEL
Mantenha as variáveis existentes do projeto. O registro de salas usa KV_REST_API_URL + KV_REST_API_TOKEN ou UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. Não coloque tokens nos arquivos do jogo.

MUDANÇAS VISUAIS
- Entrada com ação principal clara e modos secundários organizados.
- Botões de jogo maiores, com ícone e nome; placar discreto.
- Frases, reações e stand-up mais acessíveis. No computador, esses controles ficam compactos para não ocupar a área das mensagens.
- Painel da partida inteiro na altura do computador, sem rolagem externa; quando necessário, somente o histórico do chat rola.
- Campo de mensagem, microfone e Enviar compactos no computador, com uma área maior para as conversas.
- No celular, o tabuleiro mantém o tamanho máximo; os controles se compactam no espaço restante até o card do jogador.
- O tabuleiro e o painel se ajustam de forma líquida à largura e à altura disponíveis, no computador e no celular.
- No computador, o chat cresce para aproveitar todo o espaço livre até o card do jogador.
- Os seis botões superiores ficam com o mesmo tamanho no celular, inclusive a engrenagem.
- A prévia de áudio flutua sobre o chat e não desloca o placar, os jogadores ou os demais controles.
- Frases rápidas e stand-up usam um único botão ao lado do microfone no celular; a linha separada foi removida para ampliar o chat.
- Opções, reações e frases rápidas abrem em painéis sobrepostos com botão X, sem mover os outros cards.
- A engrenagem móvel mostra todas as opções, e as reações usam fundo sólido para manter os emojis legíveis.
- O painel de reações sobe na tela e reserva uma faixa exclusiva para o botão X.
- Os cinco níveis da IA permanecem inteiros na largura do celular, inclusive o nível 5.
- O botão DEV fica discreto no canto e desaparece enquanto menus sobrepostos estão abertos.
- Compartilhar diagnóstico usa o menu nativo do aparelho; se ele falhar, copia o log ou baixa o TXT.
- Configurações amplas com prévia nas quatro abas visuais e Aplicar sempre visível.
- As escolhas visuais continuam sendo salvas ao selecionar, como na base anterior; o X não desfaz a seleção.
- Rádios em lista com busca, seleção e controles no rodapé.
- Diagnóstico maior com Baixar TXT e Compartilhar, preservando copiar, e-mail e WhatsApp.
- Compartilhar usa as opções oferecidas pelo aparelho. Quando indisponível, orienta baixar/copiar.

VALIDAÇÃO
Sintaxe dos scripts conferida; nenhum ID duplicado no HTML. Verificados no navegador: entrada, configurações/prévia de estilo, partida local com e2-e4, frases móveis, seleção/busca de rádio, diagnóstico e acionamento do download TXT. Dimensões verificadas incluem 360x800, 392x735, 1024x768, 1366x768 e 1440x900; são simulações de viewport, não testes em todos esses aparelhos físicos.

APÓS PUBLICAR
Confira uma partida contra IA, uma partida online entre dois aparelhos, áudio, rádio, instalar/reabrir o aplicativo e compartilhar/abrir o TXT. P2P real, microfone, compartilhamento nativo físico e todas as transmissões de rádio não foram retestados nesta rodada. O teste de stress de 500 ciclos não foi repetido. AUDIT.json registra o escopo real desta validação.

REFERÊNCIAS DE INTERFACE
Hierarquia de ações e escolha progressiva de modo: https://support.chess.com/en/articles/8609779-how-do-i-start-a-game-on-chess-com
Princípios de interface: https://developer.apple.com/design/human-interface-guidelines
Compartilhamento nativo: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API

Base: JairoSilvar/termux-xadrez, revisão b0439ad358efb7e2e2d897e48a0e198e81e6a98c.
Este pacote não foi enviado ao GitHub nem publicado automaticamente.
