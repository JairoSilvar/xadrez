/* Telemetria isolada: nenhuma falha pode bloquear a partida. */
(function(){
'use strict';
const cfg=window.XP_LOG_CONFIG||{},KEY='xp-log-queue-v1',PID='xp-log-player-v1';
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
let queue=[],playerId=uid(),seq=0,session=uid(),busy=false,dropped=0,lastSuccess=null,lastError='',lastFen='',lastAt=Date.now();
try{queue=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(queue))queue=[];playerId=localStorage.getItem(PID)||playerId;localStorage.setItem(PID,playerId);}catch(_){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(queue));}catch(_){}}
function context(){return {playerId,playerName:typeof playerName==='string'?playerName:'',opponentName:typeof opponentName==='string'?opponentName:'',playerColor:typeof playerColor==='string'?playerColor:'',version:'19.3.0',mode:typeof gameMode==='string'?gameMode:'menu',matchId:typeof xpMatchId==='string'?xpMatchId:'',difficulty:typeof aiDifficulty==='number'?aiDifficulty:null,clockWhite:typeof clockWhite==='number'?clockWhite:null,clockBlack:typeof clockBlack==='number'?clockBlack:null,fen:typeof chess!=='undefined'?chess.fen():'',viewport:innerWidth+'x'+innerHeight,orientation:innerWidth>innerHeight?'landscape':'portrait',browser:navigator.userAgent.slice(0,400),language:navigator.language,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,offsetMinutes:new Date().getTimezoneOffset(),online:navigator.onLine};}
function emit(type,data={}){try{if(cfg.enabled===false)return;if(typeof data.pgn==='string'&&data.pgn.length>12000){data.pgn=data.pgn.slice(0,12000);data.pgnTruncated=true;}const event={id:uid(),session,seq:++seq,clientAt:new Date().toISOString(),type,context:context(),data};queue.push(event);if(queue.length>2000){dropped+=queue.length-2000;queue=queue.slice(-2000);}persist();}catch(_){}}
async function flush(){if(busy||!queue.length||cfg.enabled===false||!navigator.onLine)return;busy=true;const batch=[];for(const event of queue.slice(0,20)){const candidate=JSON.stringify({events:[...batch,event]});if(new TextEncoder().encode(candidate).length>48000)break;batch.push(event);}if(!batch.length){busy=false;return;}const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);try{const r=await fetch(cfg.endpoint||'/telemetry-api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch}),signal:abort.signal,keepalive:true});if(r.ok){const response=await r.json();lastSuccess=new Date().toISOString();lastError='';const ack=new Set(response.accepted||[]);queue=queue.filter(e=>!ack.has(e.id));persist();if(dropped){const n=dropped;dropped=0;emit('queue_overflow',{discarded:n});}}else{lastError='HTTP '+r.status;}}catch(e){lastError=String(e.message).slice(0,160);}finally{clearTimeout(timer);busy=false;}}
function wrap(name,after){try{const old=window[name];if(typeof old!=='function')return;window[name]=function(...args){const result=old.apply(this,args);try{after(args,result);}catch(_){}return result;};}catch(_){}}
wrap('startGame',([mode])=>{session=uid();seq=0;lastFen=chess.fen();lastAt=Date.now();emit('game_start',{requestedMode:mode,pgn:chess.pgn()});});
wrap('recordMoveHistoryPosition',()=>{const fen=chess.fen();if(fen===lastFen)return;const history=chess.history({verbose:true}),m=history[history.length-1];const before=typeof moveHistoryFens!=='undefined'?moveHistoryFens[history.length-1]:lastFen;if(m)emit('move',{ply:history.length,move:m,beforeFen:before||lastFen,afterFen:fen,capturedSquare:m.flags.includes('e')?m.to[0]+m.from[1]:(m.captured?m.to:null),elapsedMs:Date.now()-lastAt,pgn:chess.pgn()});else emit('position_change',{beforeFen:lastFen,afterFen:fen});lastFen=fen;lastAt=Date.now();});
wrap('handleGameOverEvents',([reason,winner],result)=>{if(result!==false)emit('game_end',{reason,winner,pgn:chess.pgn(),finalFen:chess.fen()});});
wrap('makeAIMove',([color])=>emit('ai_requested',{color}));
wrap('applyAIMove',([move])=>emit('ai_response',{move,appliedFen:chess.fen()}));
wrap('savePlayerName',()=>emit('player_updated'));
wrap('addLog',([message,level])=>{const allowed=['ERROR','CRITICAL','WARN','AI_PERF','P2P_CONNECT','P2P_INFO','P2P_SUCCESS','P2P_ERROR','P2P_ACK','P2P_REJECT','P2P_RESYNC','GAME','DIAG'];if(allowed.includes(level))emit('diagnostic',{level,message:String(message).replace(/(token|password|authorization|secret|api[_-]?key)\s*[:=]\s*\S+/gi,'$1=[redacted]').slice(0,1500)});});
wrap('safeUndoMove',()=>emit('undo_requested'));
addEventListener('error',e=>emit('javascript_error',{message:String(e.message).slice(0,1000),file:String(e.filename).split('?')[0],line:e.lineno,column:e.colno,stack:String(e.error?.stack||'').slice(0,3000)}));
addEventListener('unhandledrejection',e=>emit('promise_error',{message:String(e.reason).slice(0,1000)}));
addEventListener('online',()=>{emit('connection_online');flush();});addEventListener('offline',()=>emit('connection_offline'));
addEventListener('pagehide',()=>{emit('page_hidden');flush();});
document.addEventListener('visibilitychange',()=>{emit('visibility',{state:document.visibilityState});if(document.hidden)flush();});
setInterval(flush,10000);setInterval(()=>emit('heartbeat'),60000);
window.xpOpenServerLogs=function(){if(typeof testerMode==='undefined'||!testerMode)return;const base=new URL(cfg.endpoint||'/telemetry-api',location.href);window.open(new URL('/admin/logs',base).href,'_blank','noopener,noreferrer');};
window.xpServerLogStatus=function(){if(typeof testerMode==='undefined'||!testerMode)return;alert('Logs automáticos: '+(cfg.enabled===false?'desativados':'ativados')+'\nPendentes: '+queue.length+'\nDescartados nesta sessão: '+dropped+'\nDestino: '+(cfg.endpoint||'/telemetry-api')+'\nÚltimo envio confirmado: '+(lastSuccess||'nenhum')+'\nÚltimo erro: '+(lastError||'nenhum')+'\nA coleta não depende do modo DEV.');};
window.XPLogs={flush,status:()=>({pending:queue.length,dropped,lastSuccess,lastError,endpoint:cfg.endpoint,enabled:cfg.enabled!==false})};
emit('session_start');flush();
})();
