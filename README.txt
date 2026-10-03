XADREZ PRO v18.0.0 — CABEÇALHO RESPONSIVO E ESPECTADOR CORRIGIDO
Data: 28/09/2026
Base preservada: v17.0.0

OBJETIVO
Organizar a identificação da sala e os controles no computador sem reduzir o tabuleiro, eliminar sobreposições no modo espectador e corrigir o destaque de turno para quem assiste. A composição móvel aprovada na v17 foi preservada.

MUDANÇAS DA v18
- No PC, o cabeçalho lateral usa duas linhas: contexto da sala na primeira e seis controles iguais na segunda.
- Cidade/tema, quantidade de espectadores, estado “Só assistir” e Compartilhar ficam agrupados sem disputar espaço com os controles.
- O botão Compartilhar possui texto no PC e permanece compacto por ícone no celular.
- O modo espectador destaca o card correspondente à cor que realmente joga, independentemente da posição do card.
- Os metadados criados dinamicamente são recolocados automaticamente na área correta.
- O tabuleiro mantém o tamanho máximo já aprovado no PC e no celular.

RECURSOS PRESERVADOS
Motor e regras, IA em cinco níveis, Bot vs Bot, P2P, espectadores, salas-cidade, salas criadas, convites e compartilhamento, rádio sincronizado, áudio, reações, frases rápidas, stand-up, histórico, FEN/PGN, temas, tabuleiros, peças, conquistas, missões, diagnóstico, PWA, Gold/GOD e DEV/TESTER.

CÓDIGOS
- 81=Nome: Gold/GOD.
- 82=Nome: DEV/TESTER.
- Nenhum código 83 ou superior foi adicionado.

VALIDAÇÃO EXECUTADA
- Sintaxe dos três scripts internos, worker, interface-v18.js e sw.js.
- Chaves CSS equilibradas: 467 aberturas e 467 fechamentos.
- Nenhum ID HTML duplicado.
- Versão, build, cache, manifesto e arquivos carregados conferidos.
- Presença dos recursos principais e exclusividade dos códigos 81 e 82 conferidas.
- Comparação com a v17: somente versionamento e correções planejadas.

VALIDAÇÃO FÍSICA RECOMENDADA
- PC normal e espectador, verificando cabeçalho em duas linhas.
- Firefox e Chrome no celular com barra do navegador aberta e recolhida.
- PWA instalada.
- P2P em dois aparelhos e espectador em um terceiro.
- Compartilhamento nativo, microfone e rádio.
