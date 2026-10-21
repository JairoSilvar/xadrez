/* Node.js Vercel Function; credentials stay server-side. */
const {createHandler}=require('../lib/log-handler.cjs');
const store=require('../lib/log-store.cjs');
module.exports=createHandler(store);
