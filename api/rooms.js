const CITIES=['Miami','Roma','Dubai','Lisboa','Berlim','Madrid','Sydney','Toronto','Cairo','Atenas','Seul','Dublin','Viena','Praga','Oslo','Zurique','Boston','Chicago','Havana','Lima','Quito','Recife','Salvador','Monaco','Napoles','Milao','Genebra','Bruxelas','Amsterda','Vancouver'];
const LIVE_TTL=30, GRACE_TTL=45, STORE_TTL=LIVE_TTL+GRACE_TTL;
const clean=v=>String(v||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,32);
const rid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const secret=()=>rid()+'-'+Math.random().toString(36).slice(2,12);

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url||!token)return res.status(503).json({ok:false,error:'ROOM_REGISTRY_NOT_CONFIGURED',rooms:[]});
  const cmd=async(parts)=>{const r=await fetch(url.replace(/\/$/,'')+'/'+parts.map(encodeURIComponent).join('/'),{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw new Error('KV_HTTP_'+r.status);const j=await r.json();return j.result;};
  const key=s=>'xp:room:'+clean(s), parse=raw=>{try{return typeof raw==='string'?JSON.parse(raw):raw;}catch(e){return null;}};
  const visible=x=>x&&Date.now()-Number(x.heartbeatAt||x.createdAt||0)<STORE_TTL*1000;
  try{
    if(req.method==='GET'){
      const keys=await cmd(['keys','xp:room:*'])||[],rooms=[];
      for(const k of keys.slice(0,60)){const x=parse(await cmd(['get',k]));if(!visible(x))continue;const age=Date.now()-Number(x.heartbeatAt||x.createdAt||0);x.health=age>LIVE_TTL*1000?'suspect':'live';delete x.hostToken;rooms.push(x);}
      rooms.sort((a,b)=>{const aw=a.state==='waiting'?0:a.state==='playing'?1:2,bw=b.state==='waiting'?0:b.state==='playing'?1:2;return aw-bw||Number(b.heartbeatAt||0)-Number(a.heartbeatAt||0);});
      return res.status(200).json({ok:true,serverTime:Date.now(),rooms});
    }
    if(req.method==='POST'){
      const b=req.body||{},action=String(b.action||'heartbeat');
      if(action==='createAuto'){
        const requestId=clean(b.creationRequestId)||rid();
        // Retry idempotente: se a mesma requisicao ja criou uma sala, devolve a mesma instancia.
        const reqKey='xp:create:'+requestId, prior=parse(await cmd(['get',reqKey]));
        if(prior&&prior.slug){const cur=parse(await cmd(['get',key(prior.slug)]));if(cur&&cur.roomInstanceId===prior.roomInstanceId)return res.status(200).json({ok:true,room:{...cur,hostToken:prior.hostToken},reused:true});}
        const shuffled=CITIES.slice().sort(()=>Math.random()-.5);
        for(const name of shuffled){
          const slug=clean(name),roomInstanceId=rid(),hostToken=secret(),now=Date.now();
          const room={name,slug,roomInstanceId,hostToken,aliasEpoch:now,peerId:'',state:'creating',version:String(b.version||''),host:String(b.host||'Host').slice(0,24),createdAt:now,heartbeatAt:now};
          const result=await cmd(['set',key(slug),JSON.stringify(room),'NX','EX',String(STORE_TTL)]);
          if(result==='OK'){
            await cmd(['set',reqKey,JSON.stringify({slug,roomInstanceId,hostToken}),'EX','120']);
            const out={...room};return res.status(201).json({ok:true,room:out});
          }
        }
        return res.status(409).json({ok:false,error:'NO_CITY_AVAILABLE'});
      }
      if(action==='heartbeat'){
        const slug=clean(b.slug),raw=await cmd(['get',key(slug)]),x=parse(raw);
        if(!slug||!x)return res.status(404).json({ok:false,error:'ROOM_NOT_FOUND'});
        if(String(b.roomInstanceId||'')!==String(x.roomInstanceId||'')||String(b.hostToken||'')!==String(x.hostToken||''))return res.status(409).json({ok:false,error:'STALE_OR_UNAUTHORIZED_INSTANCE'});
        x.peerId=String(b.peerId||x.peerId||'').slice(0,100);x.state=b.state==='playing'?'playing':'waiting';x.version=String(b.version||x.version||'');x.host=String(b.host||x.host||'Host').slice(0,24);x.heartbeatAt=Date.now();
        await cmd(['set',key(slug),JSON.stringify(x),'XX','EX',String(STORE_TTL)]);
        const out={...x};delete out.hostToken;return res.status(200).json({ok:true,room:out});
      }
      return res.status(400).json({ok:false,error:'UNKNOWN_ACTION'});
    }
    if(req.method==='DELETE'){
      const b=req.body||{},slug=clean(b.slug),x=parse(await cmd(['get',key(slug)]));
      if(!slug)return res.status(400).json({ok:false,error:'INVALID_ROOM'});
      if(!x)return res.status(200).json({ok:true,alreadyGone:true});
      if(String(b.roomInstanceId||'')!==String(x.roomInstanceId||'')||String(b.hostToken||'')!==String(x.hostToken||''))return res.status(409).json({ok:false,error:'STALE_OR_UNAUTHORIZED_INSTANCE'});
      await cmd(['del',key(slug)]);return res.status(200).json({ok:true});
    }
    return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
  }catch(e){return res.status(500).json({ok:false,error:String(e&&e.message||e),rooms:[]});}
}
