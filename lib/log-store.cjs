const {neon}=require('@neondatabase/serverless');
let client;
function db(){if(!process.env.DATABASE_URL)throw Error('LOG_DATABASE_NOT_CONFIGURED');return client||(client=neon(process.env.DATABASE_URL));}
function days(){const n=Number(process.env.LOG_RETENTION_DAYS||30);return Number.isInteger(n)&&n>=1&&n<=365?n:30;}
function createStore(getDb=db){return {
 async rate(key){const rows=await getDb().query(`INSERT INTO xp_log_rate (bucket,window_start,hits) VALUES ($1,date_trunc('minute',now()),1) ON CONFLICT (bucket,window_start) DO UPDATE SET hits=xp_log_rate.hits+1 RETURNING hits`,[key]);return Number(rows[0].hits)<=120;},
 async insert(events){const sql=getDb();await sql.transaction([
  sql.query('SELECT pg_advisory_xact_lock(9371921)'),
  sql.query(`INSERT INTO xp_log_events (event_id,match_id,player_name,event_type,session_id,event_seq,payload)
   SELECT e->>'id',e->'context'->>'matchId',e->'context'->>'playerName',e->>'type',e->>'session',(e->>'seq')::integer,e
   FROM jsonb_array_elements($1::jsonb) e ON CONFLICT (event_id) DO NOTHING`,[JSON.stringify(events)])
 ]);return events.map(e=>e.id);},
 async list({match,player,type,from,to,cursor=0,limit=200}){const clauses=['cursor_id > $1','received_at >= now() - ($2::integer * interval \'1 day\')'];const params=[cursor,days()];for(const [col,v,op] of [['match_id',match,'='],['player_name',player,'='],['event_type',type,'='],['received_at',from,'>='],['received_at',to,'<=']]){if(v!==undefined){params.push(v);clauses.push(col+' '+op+' '+(col==='received_at'?`to_timestamp($${params.length}::double precision / 1000)`:`$${params.length}`));}}params.push(limit+1);const rows=await getDb().query('SELECT cursor_id::text AS cursor,extract(epoch from received_at)*1000 AS received_ms,payload FROM xp_log_events WHERE '+clauses.join(' AND ')+' ORDER BY cursor_id LIMIT $'+params.length,params);const more=rows.length>limit;return {events:rows.slice(0,limit).map(r=>({...r.payload,cursor:Number(r.cursor),receivedAt:Number(r.received_ms)})),hasMore:more};},
 async pgn(match){const rows=await getDb().query(`SELECT payload->'data'->>'pgn' AS pgn FROM xp_log_events WHERE match_id=$1 AND received_at >= now() - ($2::integer * interval '1 day') AND payload->'data'->>'pgn' IS NOT NULL AND (payload->'data'->>'pgnTruncated') IS DISTINCT FROM 'true' ORDER BY cursor_id DESC LIMIT 1`,[match,days()]);return rows[0]?.pgn||null;},
 async cleanup(){const sql=getDb();await sql.transaction([sql.query(`DELETE FROM xp_log_events WHERE cursor_id IN (SELECT cursor_id FROM xp_log_events WHERE received_at < now() - ($1::integer * interval '1 day') LIMIT 10000)`,[days()]),sql.query("DELETE FROM xp_log_rate WHERE window_start < now()-interval '2 hours'")]);}
};}
module.exports=createStore();
module.exports.createStore=createStore;
