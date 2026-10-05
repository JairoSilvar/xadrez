addEventListener('load',()=>setTimeout(async()=>{
 const results=[];
 async function test(name,fn){try{const data=await fn();results.push({test:name,ok:data===true,detail:data});}catch(e){results.push({test:name,ok:false,error:e.message});}}
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 await test('Sintaxe do worker IA',()=>{new Function(aiWorkerScript);return true;});
 await test('Worker IA real responde após lance humano',async()=>{startGame('pve');playerColor='w';aiDifficulty=1;soundEnabled=false;voiceNarrEnabled=false;chess.move('e4');recordMoveHistoryPosition();makeAIMove('b');for(let i=0;i<60&&chess.history().length<2;i++)await wait(100);return chess.history().length===2&&chess.turn()==='w';});
 await test('Resposta IA pendente descartada após Undo',async()=>{startGame('pve');playerColor='w';aiDifficulty=3;chess.move('e4');recordMoveHistoryPosition();makeAIMove('b');const old=customConfirm;customConfirm=async()=>true;await safeUndoMove();customConfirm=old;await wait(1400);return chess.history().length===0&&chess.turn()==='w';});
 await test('Empate remoto sem oferta não finaliza',()=>{startGame('pvp');gameMode='network';window.xpDrawOfferFen=null;handleIncomingConnData({type:'draw-accept',fen:chess.fen()});return !gameOverHandled;});
 await test('Oferta aceita preserva empate acordado',()=>{window.xpDrawOfferFen=chess.fen();handleIncomingConnData({type:'draw-accept',fen:chess.fen()});return gameOverHandled;});
 await test('Espectador tardio recupera histórico e mate sem Elo',()=>{startGame('pvp');gameMode='network';isSpectator=true;playerColor=null;const elo=playerElo,stats=xpGetStats().games,c=new Chess();for(const m of ['f3','e5','g4','Qh4#'])c.move(m);chess.load(c.fen());handleIncomingConnData({type:'ping',fen:c.fen(),plyCount:4,moves:c.history({verbose:true}),hash:xpPositionHash(c.fen())});return gameOverHandled&&chess.history().length===4&&playerElo===elo&&xpGetStats().games===stats;});
 await test('Revanche do espectador limpa final e histórico',()=>{handleIncomingConnData({type:'rematch-accept'});return !gameOverHandled&&chess.history().length===0&&moveHistoryFens.length===1;});
 await test('Lance legado legal aceito; fora de ordem rejeitado',()=>{startGame('pvp');gameMode='network';playerColor='b';conn={open:true,send(){}};handleIncomingConnData({type:'move',move:{from:'e2',to:'e4'}});const before=chess.fen();playerColor='w';handleIncomingConnData({type:'move',move:{from:'e7',to:'e5'},ply:9,id:'wrong-ply'});return chess.history().length===1&&chess.fen()===before;});
 await test('Epoch rejeita lance atrasado de outra partida',()=>{startGame('pvp');gameMode='network';playerColor='b';xpWireEpoch='current-match';handleIncomingConnData({type:'move',move:{from:'e2',to:'e4'},epoch:'old-match',ply:1,id:'old:1'});return chess.history().length===0;});
 await test('Neon com todos os estilos e sem mudança de SVG',()=>{startGame('pvp');const base=document.querySelector('.white-piece').style.backgroundImage;xpSetNeon('w','#ec4899');xpSetNeon('b','#3b82f6');for(const style of ['style-classic','style-minimal','style-neon','style-soft3d','style-contrast']){setPieceStyle(style);if(!getComputedStyle(document.querySelector('.white-piece')).filter.includes('236, 72, 153')||!getComputedStyle(document.querySelector('.black-piece')).filter.includes('59, 130, 246')||document.querySelector('.white-piece').style.backgroundImage!==base)return false;}setPieceStyle('style-classic');return true;});
 await test('WebRTC DataChannel real entre dois contextos: mate, duplicata e ACK',async()=>{
    const frame=document.createElement('iframe');frame.src='/';frame.style='position:absolute;width:600px;height:600px;left:-9999px';document.body.append(frame);await new Promise(r=>frame.onload=r);await wait(300);const remote=frame.contentWindow;
    startGame('pvp');gameMode='network';playerColor='w';xpWireEpoch='rtc-test';remote.startGame('pvp');remote.eval("gameMode='network';playerColor='b';xpWireEpoch='rtc-test';soundEnabled=false;voiceNarrEnabled=false;");
    const a=new RTCPeerConnection(),b=new RTCPeerConnection();
    a.onicecandidate=e=>{if(e.candidate)b.addIceCandidate(e.candidate);};b.onicecandidate=e=>{if(e.candidate)a.addIceCandidate(e.candidate);};
    const channel=a.createDataChannel('xadrez-v19-test');
    const incoming=new Promise(resolve=>b.ondatachannel=e=>resolve(e.channel));
    await a.setLocalDescription(await a.createOffer());await b.setRemoteDescription(a.localDescription);await b.setLocalDescription(await b.createAnswer());await a.setRemoteDescription(b.localDescription);
    const other=await incoming;
    if(channel.readyState!=='open')await new Promise((resolve,reject)=>{channel.onopen=resolve;setTimeout(()=>reject(Error('WebRTC timeout')),7000);});
    conn={open:true,send:m=>channel.send(JSON.stringify(m))};remote.testChannel=other;remote.eval("conn={open:true,send:m=>testChannel.send(JSON.stringify(m))};");
    channel.onmessage=e=>handleIncomingConnData(JSON.parse(e.data));other.onmessage=e=>remote.handleIncomingConnData(JSON.parse(e.data));
    async function until(fn){for(let i=0;i<60;i++){if(fn())return;await wait(50);}throw Error('Estado remoto não convergiu');}
    finalizeLocalMove(chess.move('f3'));await until(()=>remote.eval('chess.history().length')===1);
    remote.eval("finalizeLocalMove(chess.move('e5'))");await until(()=>chess.history().length===2);
    finalizeLocalMove(chess.move('g4'));await until(()=>remote.eval('chess.history().length')===3);
    remote.eval("finalizeLocalMove(chess.move('Qh4#'))");await until(()=>gameOverHandled);
    const elo=playerElo,n=xpGetStats().games;const last=remote.eval("({type:'move',move:{from:'d8',to:'h4'},fen:chess.fen(),id:'duplicate-terminal'})");other.send(JSON.stringify(last));await wait(150);
    const ok=gameOverHandled&&remote.eval('gameOverHandled')&&chess.fen()===remote.eval('chess.fen()')&&xpPendingMoves.size===0&&remote.eval('xpPendingMoves.size')===0&&elo===playerElo&&n===xpGetStats().games;
    a.close();b.close();conn=null;frame.remove();return ok;
 });
 const pre=document.createElement('pre');pre.id='test-results';pre.style='position:fixed;inset:0;z-index:999999;background:white;color:black;overflow:auto;padding:20px';pre.textContent=JSON.stringify(results,null,2);document.body.append(pre);
},300));
