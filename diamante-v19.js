/* Xadrez v19 — Diamante. Protocol compatibility: legacy legal moves remain accepted. */
let xpWireEpoch=null;
function xpScheduleAI(delay,turn){
    const match=xpMatchId,fen=chess.fen(),mode=gameMode;
    setTimeout(()=>{if(match===xpMatchId && fen===chess.fen() && mode===gameMode && !gameOverHandled)makeAIMove(turn);},delay);
}
function xpPositionHash(fen) {
    let h=2166136261;
    for(const c of String(fen)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16).padStart(8,'0'); // integrity check, not authentication
}
function xpPrepareMove(payload) {
    const ply=chess.history().length, hash=xpPositionHash(chess.fen());
    const result={...payload,protocol:19,epoch:xpWireEpoch,ply,hash,previousHash:xpPositionHash(moveHistoryFens[ply-1]),id:xpMatchId+':'+ply+':'+hash};
    xpPendingMoves.set(result.id,{payload:result,at:Date.now(),attempts:0});
    return result;
}
function xpSendDirect(payload) { if(conn && conn.open)try{conn.send(payload);}catch(e){addLog(e.message,'P2P_ERROR');} }
function xpRequestResync(why) {
    const now=Date.now();
    if(now-(xpRequestResync.last||0)<1000)return;
    xpRequestResync.last=now;
    addLog('Resync solicitado: '+why,'P2P_RESYNC');
    xpSendDirect({type:'state-request',ply:chess.history().length,hash:xpPositionHash(chess.fen())});
}
function xpReplayState(data) {
    if(!Array.isArray(data.moves) || data.moves.length>20000 || data.moves.length!==data.plyCount)throw Error('Sequência ausente/inválida');
    const candidate=new Chess(),fens=[candidate.fen()];
    for(const move of data.moves){if(!candidate.move(move))throw Error('Lance ilegal no replay');fens.push(candidate.fen());}
    if(candidate.fen()!==data.fen || (data.hash && data.hash!==xpPositionHash(candidate.fen())))throw Error('Hash/FEN divergente');
    return {candidate,fens};
}
function xpRefreshRemote() {
    lastSyncedFen=chess.fen();syncedRemotePly=chess.history().length;historyViewPly=null;
    selectedSquare=null;possibleMoves=[];
    // Terminal detection precedes optional animation and sound.
    const over=checkGameStateEvents(false);
    renderBoard();updateTurnIndicators();updateCapturedDisplay();updateClockDisplay();updateMoveListPanel();
    if(!over && godMode && !isSpectator && chess.turn()===playerColor)setTimeout(requestGodAssistance,80);
}
function xpHandleProtocol(data) {
    if(['reset-board','rematch-accept'].includes(data.type) && data.epoch){
        if(data.epoch===xpWireEpoch)return true;
        xpWireEpoch=data.epoch;
    }else if(data.epoch && xpWireEpoch && data.epoch!==xpWireEpoch){
        addLog('Mensagem de outra partida ignorada','P2P_STALE');return true;
    }
    if(data.type==='move-ack'){
        const pending=xpPendingMoves.get(data.id);
        if(pending && pending.payload.hash===data.hash){xpPendingMoves.delete(data.id);addLog('ACK '+data.id,'P2P_ACK');}
        return true;
    }
    if(data.type==='state-request'){
        if(!isSpectator)xpSendDirect({type:'state-response',epoch:xpWireEpoch,fen:chess.fen(),hash:xpPositionHash(chess.fen()),plyCount:chess.history().length,moves:chess.history({verbose:true}).map(m=>({from:m.from,to:m.to,promotion:m.promotion}))});
        return true;
    }
    if(data.type==='ping' || data.type==='state-response'){
        if(gameOverHandled)return true;
        try{
            const local=chess.history().length;
            if(data.fen!==chess.fen() || data.plyCount!==local){
                if(!Array.isArray(data.moves)){xpRequestResync('histórico necessário');return true;}
                const {candidate,fens}=xpReplayState(data);
                if(data.plyCount<local)return true;
                // Active players accept only legal extensions of their exact position.
                // A late spectator may bootstrap full history from the already displayed FEN.
                const bootstrap=isSpectator && local===0;
                if(!bootstrap && fens[local]!==chess.fen())throw Error('Histórico conflitante: posição local preservada');
                if(!isSpectator && data.plyCount>local && (chess.turn()===playerColor || data.plyCount!==local+1))throw Error('Remoto tentou jogar pelo lado local');
                chess=candidate;moveHistoryFens=fens;
                xpRefreshRemote();
                addLog('Replay validado ply='+data.plyCount+' hash='+xpPositionHash(chess.fen()),'P2P_RESYNC');
            }
            if(typeof data.clockWhite==='number' && Number.isFinite(data.clockWhite))clockWhite=Math.max(0,data.clockWhite);
            if(typeof data.clockBlack==='number' && Number.isFinite(data.clockBlack))clockBlack=Math.max(0,data.clockBlack);
            if(typeof data.spectators==='number')updateSpectatorCountUI(data.spectators);
            checkGameStateEvents(false);updateClockDisplay();
        }catch(e){addLog(e.message,'P2P_REJECT');xpRequestResync(e.message);}
        return true;
    }
    if(data.type==='undo'){
        if(gameOverHandled)return true;
        const before=chess.fen(), count=data.count;
        if(!Number.isInteger(count)||count<1||count>2||count>chess.history().length || (data.beforeFen && data.beforeFen!==before))return true;
        const undone=[];
        for(let i=0;i<count;i++)undone.push(chess.undo());
        if(data.fen && data.fen!==chess.fen()){
            undone.reverse().forEach(m=>chess.move(m));xpRequestResync('Undo divergente');return true;
        }
        aiRequestId++;pendingAICallback=null;xpRemoteMoves.clear();xpPendingMoves.clear();
        moveHistoryFens=moveHistoryFens.slice(0,chess.history().length+1);xpRefreshRemote();
        addLog('Undo remoto validado: '+count,'P2P_UNDO');return true;
    }
    if(data.type!=='move')return false;
    const acknowledge=()=>{if(data.id)xpSendDirect({type:'move-ack',id:data.id,hash:data.hash});};
    if(data.id && xpRemoteMoves.has(data.id)){acknowledge();return true;}
    if(data.fen===chess.fen()){acknowledge();return true;}
    if(gameOverHandled)return true;
    const before=chess.fen(),ply=chess.history().length;
    try{
        if(!data.move || !/^[a-h][1-8]$/.test(data.move.from)||!/^[a-h][1-8]$/.test(data.move.to))throw Error('Formato de lance inválido');
        if(!isSpectator && chess.turn()===playerColor)throw Error('Cor remota incorreta');
        if(data.ply!==undefined && data.ply!==ply+1)throw Error('Sequência fora de ordem');
        if(data.previousHash && data.previousHash!==xpPositionHash(before))throw Error('Hash anterior divergente');
        const move=chess.move(data.move);
        if(!move)throw Error('Lance ilegal');
        if((data.fen && data.fen!==chess.fen()) || (data.hash && data.hash!==xpPositionHash(chess.fen()))){chess.undo();throw Error('FEN/hash final divergente');}
        recordMoveHistoryPosition();
        if(data.id){xpRemoteMoves.add(data.id);if(xpRemoteMoves.size>2048)xpRemoteMoves.delete(xpRemoteMoves.values().next().value);}
        acknowledge();
        if(Number.isFinite(data.clockWhite))clockWhite=Math.max(0,data.clockWhite);
        if(Number.isFinite(data.clockBlack))clockBlack=Math.max(0,data.clockBlack);
        addLog('remote_move '+move.from+'→'+move.to+' ply='+(ply+1)+' hash='+xpPositionHash(chess.fen())+' id='+(data.id||'legacy'),'P2P_MOVE');
        xpRefreshRemote();
        try{animateMoveGhost(move);triggerMoveTrail(move.from,move.to);if(move.captured)showCaptureInChat(move);playSFX(move.captured?'capture':'move');detectOpening();}catch(e){addLog(e.message,'UI_WARN');}
    }catch(e){addLog(e.message,'P2P_REJECT');xpRequestResync(e.message);}
    return true;
}
setInterval(()=>{
    if(gameMode!=='network' || !conn || !conn.open){xpPendingMoves.clear();return;}
    for(const [id,item] of xpPendingMoves){
        if(Date.now()-item.at<1800)continue;
        if(item.attempts>=3){xpPendingMoves.delete(id);xpRequestResync('ACK não recebido');continue;}
        item.at=Date.now();item.attempts++;xpSendDirect(item.payload);
    }
},1000);

// Independent glow preferences. No piece SVG, geometry, model or transform is replaced.
const xpNeonKey='xadrez_neon_v19';
let xpNeon={};
function xpApplyNeon(){
    for(const side of ['w','b']){
        if(/^#[0-9a-f]{6}$/i.test(xpNeon[side]||''))document.body.style.setProperty('--neon-'+side,xpNeon[side]);
        else document.body.style.removeProperty('--neon-'+side);
        const input=document.getElementById('neon-'+side);if(input)input.value=xpNeon[side]||(side==='w'?'#38bdf8':'#ec4899');
    }
}
function xpSetNeon(side,color){if(!['w','b'].includes(side)||!/^#[0-9a-f]{6}$/i.test(color))return;xpNeon[side]=color;xpApplyNeon();try{localStorage.setItem(xpNeonKey,JSON.stringify(xpNeon));}catch(e){addLog('Preferência aplicada sem persistência','STORAGE');}}
function xpResetNeon(){xpNeon={};try{localStorage.removeItem(xpNeonKey);}catch(e){}xpApplyNeon();}
try{xpNeon=JSON.parse(localStorage.getItem(xpNeonKey)||'{}')||{};}catch(e){}
const xpNeonPanel=document.getElementById('neon-settings');
if(xpNeonPanel){
    const colors=[['Rosa','#ec4899'],['Azul','#3b82f6'],['Vermelho','#ef4444'],['Verde','#22c55e'],['Roxo','#a855f7'],['Dourado','#eab308'],['Branco','#ffffff'],['Ciano','#22d3ee']];
    for(const [side,label] of [['w','brancas'],['b','pretas']]){
        const field=document.createElement('fieldset');field.style.cssText='margin:6px 0;padding:8px;border:1px solid var(--panel-border);border-radius:8px;min-width:0';
        const legend=document.createElement('legend');legend.textContent='Neon das peças '+label;field.append(legend);
        const row=document.createElement('div');row.style.cssText='display:flex;flex-wrap:wrap;gap:5px';
        for(const [name,color]of colors){const b=document.createElement('button');b.type='button';b.title=name;b.setAttribute('aria-label',name+' — peças '+label);b.style.cssText='background:'+color+';width:30px;height:30px;border:1px solid #888;border-radius:6px';b.onclick=()=>xpSetNeon(side,color);row.append(b);}
        field.append(row);
        const labelEl=document.createElement('label');labelEl.textContent='Cor personalizada ';
        const input=document.createElement('input');input.type='color';input.id='neon-'+side;input.oninput=()=>xpSetNeon(side,input.value);labelEl.append(input);field.append(labelEl);xpNeonPanel.append(field);
    }
    const reset=document.createElement('button');reset.type='button';reset.className='action-btn';reset.textContent='Restaurar neon padrão';reset.onclick=xpResetNeon;xpNeonPanel.append(reset);
}
xpApplyNeon();
