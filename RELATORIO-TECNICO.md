# Xadrez v19 — Diamante

Entrega de 5 de outubro de 2026, baseada no ZIP original da v18.0.0 encontrado na entrega anterior. O caminho /mnt/data indicado pertence ao ambiente antigo; esta execução usou a cópia local com nome correspondente.

SHA-256 da base: `cc5600b90bfd6b7c4624d2f0b005df29e809503abc26639270569a68b09c0004`.

## Alterações implementadas

- **Final de partida:** detecção central cobre xeque-mate, afogamento, repetição tripla, material insuficiente e 50 lances, com prioridade para mate. A decisão ocorre após lances locais, IA e remotos e em sincronizações. Foi removido o rótulo genérico “Empate Técnico”. Não há adjudicação por avaliação equilibrada, quantidade arbitrária de lances ou tempo de processamento da IA. Aceites de empate remotos exigem oferta atual válida.
- **Regras de empate:** preservou-se a adjudicação automática por três repetições/50 lances existente no motor/base. Isso não constitui implementação do procedimento de reivindicação de torneios FIDE. Não se removeu nenhuma dessas condições para prolongar artificialmente uma partida.
- **Painel e idempotência:** o resultado essencial aparece antes dos efeitos auxiliares. A finalização invalida respostas pendentes da IA, interrompe relógio/bots e limpa promoção/seleção. Duplicatas não repetem Elo nem estatísticas. Falhas auxiliares são registradas sem esconder o painel. Elo possui proteção adicional por partida.
- **Undo:** cancela IA pendente e retorna ao turno humano no PvE, desfazendo um ou dois meios-lances conforme necessário. Atualiza histórico, FEN, indicadores e sincronização. Após resultado liquidado, a partida permanece encerrada: usa-se Revisão/Sandbox ou nova partida, evitando recalcular Elo sobre o mesmo resultado. Undo remoto usa lances reais do histórico e valida o FEN resultante; não substitui silenciosamente o histórico por um FEN isolado.
- **P2P:** listeners não são instalados duas vezes na mesma conexão. Lances transportam ID, sequência, hash da posição anterior/final e identificador compartilhado de partida quando negociado pela v19. ACK e repetição limitada de envio tratam mensagens perdidas; duplicatas são ignoradas. Mensagens de outra partida são rejeitadas. O hash é verificação de consistência, não autenticação criptográfica.
- **Ressincronização:** replay legal preserva o histórico completo; conflitos não sobrescrevem a posição local. Jogadores só aceitam uma extensão compatível com o turno remoto. Espectadores podem reconstruir a partida em andamento. Snapshot inicial carrega histórico; revanche limpa estado terminal do espectador. Clientes legados continuam aceitando/enviando lances legais, sem as garantias completas do protocolo v19.
- **Telemetria e reações:** logs remotos incluem origem, casas, sequência, ID e hash; ACK/resync/rejeições possuem categorias próprias. Valores desconhecidos como net=a4g são normalizados para unknown, sem inventar tipo de conexão. Cooldown local e remoto de 1,2 s.
- **PWA:** chess.js 0.10.3 e PeerJS 1.5.2, as mesmas versões referenciadas na v18, foram incluídas localmente com licenças. Precache é atômico, cache possui escopo/versionamento, API não é armazenada e respostas HTTP de erro não substituem recursos válidos. Atualizações não forçam a ativação durante a partida. Manifesto usa caminhos relativos e ícones de 192/512 px. O worker histórico encaminha para o atual.
- **Personalização:** neon independente para brancas e pretas, oito cores por lado, cor personalizada, aplicação imediata, persistência e restauração. Alteram-se variáveis de glow; SVGs, modelos, materiais e transformações existentes são preservados. Os cinco estilos foram exercitados.
- **Interface:** composição mobile da base e cabeçalho PC da v18 preservados, assim como cidade, espectadores, Só assistir, compartilhamento e seis controles. Branding visível passa a Xadrez; chaves internas de armazenamento e IDs históricos permanecem para compatibilidade. Uma chave CSS excedente herdada do bloco de treino foi corrigida.

## Validação executada

**27 testes funcionais aprovados**, no navegador integrado Chromium, incluindo worker IA real e transporte WebRTC DataChannel real entre dois contextos. A lista integral está em AUDIT.json.

| Checagem | Resultado |
|---|---|
| Scripts internos | 3 analisados sem erro sintático |
| Scripts externos e bibliotecas | 6 analisados sem erro sintático |
| Worker IA | Compilado e executado com lance real |
| API de salas | Sintaxe conferida; implantação externa não exercitada |
| IDs HTML estáticos | 145, sem duplicatas |
| CSS | 5 blocos/arquivos com chaves equilibradas; interface inspecionada no navegador |
| PC 1440 × 900 | Tabuleiro 884 × 884, seis controles, sem overflow horizontal |
| Mobile 390 × 844 | Tabuleiro 378 × 378, sem overflow horizontal |
| Neon | Independência, restauração, cinco estilos e persistência após recarga confirmadas |
| Finalização | Mate local/IA/remoto, empates, duplicatas e proteção de Elo aprovados |
| P2P local | DataChannel real: posições convergiram até o mate, ACKs recebidos, duplicata ignorada |
| Offline | Recarga com servidor indisponível e início de partida local confirmados |

O Chrome via executor de testes foi bloqueado por permissão de processo; os testes funcionais foram executados pelo navegador integrado. A inspeção final de um lance após recarga offline não foi concluída: a revisão automática informou limite de uso; após a retomada autorizada, o navegador retornou timeout. Não foi marcada como aprovada.

## Limites e reteste recomendado

- Dois aparelhos em redes diferentes, broker PeerJS e condições reais de NAT/TURN; terceiro aparelho como espectador. O DataChannel local não substitui esse ensaio.
- Registro de salas em produção depende da hospedagem e configuração já exigidas pela API herdada. O servidor de prévia não implementa essa API.
- Instalação física da PWA, microfone, rádios externos, compartilhamento nativo, Firefox/Safari e orientação horizontal em dispositivos reais.
- O Elo continua local, como na base; não é um ranking autenticado por servidor.
- Regras específicas de arbitragem de torneios, incluindo reivindicações de empate e adjudicação geral de posições mortas, não foram ampliadas além do motor herdado.

## Como testar

1. Extraia o ZIP. Abra index.html para uma verificação local básica ou use a prévia HTTP abaixo.
2. Com Node.js instalado, execute `node tests/serve.cjs` dentro da pasta extraída e abra `http://127.0.0.1:8877/`. Não é necessário instalar pacotes.
3. Execute `node tests/verify.cjs` para validação estática.
4. Abra `http://127.0.0.1:8877/__tests` e `http://127.0.0.1:8877/__advanced` para repetir os ensaios. Use um perfil de navegador de teste: os ensaios criam partidas e modificam preferências/Elo desse endereço local.
5. Para PWA, prefira localhost ou HTTPS. Para salas públicas, publique os arquivos mantendo api/rooms.js e vercel.json conforme a configuração anterior.

Capturas PC/mobile/neon acompanham a entrega externa. Nenhum arquivo de dados de usuário foi incorporado ao ZIP.
