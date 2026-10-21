const {createHash,timingSafeEqual}=require('node:crypto');
const TYPES=new Set(['session_start','game_start','move','position_change','game_end','ai_requested','ai_response','player_updated','diagnostic','undo_requested','javascript_error','promise_error','connection_online','connection_offline','page_hidden','visibility','heartbeat','queue_overflow']);
function sameSecret(a,b){return timingSafeEqual(createHash('sha256').update(String(a)).digest(),createHash('sha256').update(String(b)).digest());}
function scrub(value,depth=0){if(depth>12)return '[depth limited]';if(typeof value==='string')return value.replace(/(token|password|authorization|secret|api[_-]?key)\s*[:=]\s*\S+/gi,'$1=[redacted]');if(Array.isArray(value))return value.map(x=>scrub(x,depth+1));if(value&&typeof value==='object'){const out={};for(const [k,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(k))continue;out[k]=/password|authorization|secret|api.?key|^token$|chat|audio/i.test(k)?'[redacted]':scrub(v,depth+1);}return out;}return value;}
function valid(e){return e&&typeof e==='object'&&!Array.isArray(e)&&typeof e.id==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(e.id)&&TYPES.has(e.type)&&typeof e.session==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(e.session)&&Number.isInteger(e.seq)&&e.seq>0&&e.seq<1e8&&typeof e.clientAt==='string'&&e.clientAt.length<50&&Number.isFinite(Date.parse(e.clientAt))&&e.context&&typeof e.context==='object'&&!Array.isArray(e.context)&&e.data&&typeof e.data==='object'&&!Array.isArray(e.data)&&['matchId','playerName'].every(k=>typeof e.context[k]==='string'&&e.context[k].length<=200)&&Buffer.byteLength(JSON.stringify(e))<=24000;}
function parseQuery(req){const q=new URL(req.url,'https://local.invalid').searchParams;const n=(k,d)=>{const v=q.get(k);if(v===null)return d;if(!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v)))throw Error('INVALID_QUERY');return Number(v);};const p={cursor:n('cursor',0),limit:Math.max(1,Math.min(500,n('limit',200)))};for(const k of ['match','player','type'])if(q.has(k)){if(q.get(k).length>200)throw Error('INVALID_QUERY');p[k]=q.get(k);}for(const k of ['from','to'])if(q.has(k)){p[k]=n(k);if(p[k]>8640000000000000)throw Error('INVALID_QUERY');}if(p.from!==undefined&&p.to!==undefined&&p.from>p.to)throw Error('INVALID_QUERY');return {params:p,format:q.get('format')||'json'};}
function createHandler(store,env=process.env){return async function(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 const reply=(s,data,type='application/json; charset=utf-8')=>{res.setHeader('Content-Type',type);return type.startsWith('application/json')?res.status(s).json(data):res.status(s).send(data);};
 const admin=env.LOG_ADMIN_KEY;const origin=req.headers.origin;const allowed=(env.LOG_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(req.method==='OPTIONS'){if(!origin||!allowed.includes(origin))return reply(403,{error:'ORIGIN_REJECTED'});res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');return res.status(204).end();}
 if(!['POST','GET'].includes(req.method)){res.setHeader('Allow','GET, POST, OPTIONS');return reply(405,{error:'METHOD_NOT_ALLOWED'});}
 if(req.method==='GET'&&(!admin||admin.length<32||!sameSecret(req.headers.authorization||'','Bearer '+admin)))return reply(401,{error:'UNAUTHORIZED'});
 if(origin&&!allowed.includes(origin))return reply(403,{error:'ORIGIN_REJECTED'});
 if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
 if(!env.DATABASE_URL||!admin||admin.length<32)return reply(503,{error:'LOGS_NOT_CONFIGURED'});
 try{
  if(req.method==='POST'){
   if(!origin||!allowed.includes(origin))return reply(403,{error:'ORIGIN_REJECTED'});
   if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(415,{error:'JSON_REQUIRED'});
   let body=req.body;const encoded=typeof body==='string'?body:JSON.stringify(body||{});if(Buffer.byteLength(encoded)>64000)return reply(413,{error:'BODY_TOO_LARGE'});
   if(typeof body==='string'){try{body=JSON.parse(body);}catch(_){return reply(400,{error:'INVALID_JSON'});}}
   const events=body?.events;if(!Array.isArray(events)||events.length<1||events.length>20||!events.every(valid))return reply(400,{error:'INVALID_EVENTS'});
   const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();const bucket=createHash('sha256').update(admin+'\0'+ip).digest('hex');
   if(!await store.rate(bucket)){res.setHeader('Retry-After','60');return reply(429,{error:'RATE_LIMIT'});}
   const accepted=await store.insert(events.map(e=>scrub(e)));return reply(200,{accepted,serverAt:Date.now()});
  }
  let q;try{q=parseQuery(req);}catch(_){return reply(400,{error:'INVALID_QUERY'});}
  if(!['json','txt','pgn'].includes(q.format))return reply(400,{error:'INVALID_FORMAT'});
  if(q.format==='pgn'){if(!q.params.match)return reply(400,{error:'MATCH_REQUIRED'});const pgn=await store.pgn(q.params.match);return pgn?reply(200,pgn,'application/x-chess-pgn; charset=utf-8'):reply(404,{error:'PGN_UNAVAILABLE'});}
  const result=await store.list(q.params);const nextCursor=result.events.at(-1)?.cursor??q.params.cursor;
  if(q.format==='txt')return reply(200,result.events.map(e=>JSON.stringify(e)).join('\n'),'text/plain; charset=utf-8');
  return reply(200,{...result,nextCursor});
 }catch(_){return reply(503,{error:'LOG_STORAGE_UNAVAILABLE'});}
};}
module.exports={createHandler,valid,parseQuery,scrub};
