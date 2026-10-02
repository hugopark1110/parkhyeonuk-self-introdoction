import {CONTENT_ORIGIN} from '../../public-backend';
export const dynamic='force-dynamic';
async function forward(request:Request){
 try{
  const url=new URL(request.url),thread=url.searchParams.get('thread')||'';
  if(thread!=='guestbook'&&!/^entry-[0-9]$/.test(thread))return Response.json({error:'기록을 찾지 못했어요.'},{status:404});
  if(request.method==='POST'){
   const origin=request.headers.get('origin');
   if(origin&&origin!==url.origin)return Response.json({error:'이 페이지에서 다시 시도해 주세요.'},{status:403});
   if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:415});
  }
  const params=new URLSearchParams({thread});
  const before=url.searchParams.get('before');if(before)params.set('before',before.slice(0,100));
  const token=request.headers.get('x-visitor-token')||'';
  const headers:Record<string,string>={Accept:'application/json'};
  if(/^[a-f0-9]{64}$/.test(token))headers['X-Visitor-Token']=token;
  let body:string|undefined;
  if(request.method==='POST'){
   if(Number(request.headers.get('content-length')||0)>12000)return new Response(null,{status:413});
   body=await request.text();if(body.length>12000)return new Response(null,{status:413});
   headers['Content-Type']='application/json';
  }
  const upstream=await fetch(CONTENT_ORIGIN+'/api/feedback?'+params,{method:request.method,headers,body,credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!upstream.headers.get('content-type')?.includes('application/json'))throw Error('Invalid feedback response');
  return new Response(await upstream.text(),{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return Response.json({error:'연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.'},{status:503});}
}
export const GET=forward;
export const POST=forward;
