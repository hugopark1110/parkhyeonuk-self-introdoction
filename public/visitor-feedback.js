// Shared, server-backed reactions and comments. Local storage holds only this
// browser's anonymous identity and unsent drafts, never shared content or counts.
const styles = `
:host{color-scheme:light;display:block;font-family:inherit;color:var(--feedback-ink,#191919);font-size:14px;line-height:1.6;text-align:left;--line:#e5e5e5;--muted:#727272}*{box-sizing:border-box}button,input,textarea{font:inherit;color:inherit}button{cursor:pointer}button:disabled{cursor:wait;opacity:.55}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid currentColor;outline-offset:3px}.bar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:12px 0}.chip{display:inline-flex;gap:6px;align-items:center;justify-content:center;min-height:40px;padding:6px 11px;background:#fff;border:1px solid var(--line);border-radius:999px;white-space:nowrap;transition:background .15s}.chip:hover{background:#f5f5f5}.chip[aria-pressed=true]{background:#191919;border-color:#191919;color:white}.emoji{font-family:system-ui;font-size:18px;line-height:1}.count{font-variant-numeric:tabular-nums}.comments-toggle{margin-left:5px}.panel{padding:20px 0 6px;border-top:1px solid var(--line)}[hidden]{display:none!important}.heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.heading h3{margin:0;font-size:18px;font-weight:600;letter-spacing:-.03em}.refresh,.delete,.more{border:0;background:transparent;padding:6px 8px;text-decoration:underline;text-underline-offset:4px;font-size:14px}.refresh,.meta,.empty,.note{color:var(--muted)}form{display:grid;gap:12px;margin-bottom:26px}label{display:grid;gap:7px}input,textarea{width:100%;background:#fafafa;border:1px solid var(--line);border-radius:10px;padding:11px 13px;font-size:16px;line-height:1.6}input{max-width:240px}textarea{min-height:105px;resize:vertical}.actions{display:flex;align-items:center;justify-content:space-between;gap:16px}.note{font-size:12px;margin:0;max-width:440px}.submit{border:0;background:#191919;color:white;border-radius:999px;padding:11px 23px;min-height:44px;white-space:nowrap}.message{font-size:14px;margin:7px 0;color:#9e341f}.status{color:var(--muted)}.comment{border-top:1px solid var(--line);padding:20px 0}.meta{display:flex;align-items:center;gap:12px;font-size:12px;flex-wrap:wrap}.meta strong{color:var(--feedback-ink,#191919);font-size:14px;font-weight:600}.delete{margin-left:auto;font-size:12px}.body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.8;margin:9px 0 0}.empty{padding:6px 0 20px;margin:0;font-size:14px}.more{display:block;margin:10px auto}.trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}:host([compact]) .bar{padding:8px 0 16px}:host([compact]) .chip{min-height:36px;padding:4px 9px}:host([compact]) .panel{padding:20px 0}:host([guestbook]) .bar{display:none}@media(max-width:480px){.bar{gap:6px}.chip{padding:6px 9px}.comments-toggle{margin-left:0}.actions{align-items:flex-end}.note{max-width:200px}.meta{gap:8px}}
`;
const reactions=[['like','♡','좋아요'],['heart','❤️','공감해요'],['clap','👏','멋져요'],['hug','🫂','응원해요'],['wow','😮','놀라워요'],['sad','🥲','마음이 찡해요']];
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stored(key){try{return localStorage.getItem(key)||'';}catch{return '';}}
function store(key,value){try{localStorage.setItem(key,value);}catch{}}
function uuid(){const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join('-');}
function identity(){
 let token=stored('visitor-feedback-token-v1');
 if(!/^[a-f0-9]{64}$/.test(token)){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');store('visitor-feedback-token-v1',token);}
 if(stored('visitor-feedback-token-v1')!==token)throw Error('댓글과 반응을 남기려면 브라우저의 사이트 저장 기능을 허용해 주세요.');
 return token;
}
class VisitorFeedback extends HTMLElement{
 static observedAttributes=['thread'];
 constructor(){super();this.attachShadow({mode:'open'});this.seq=0;this.data=null;this.busy=false;this.visible=false;this.onUpdate=e=>{if(e.detail===this.thread&&this.visible)this.load();};}
 get thread(){return this.getAttribute('thread')||'';}
 get draftKey(){return 'feedback-draft:'+this.thread;}
 connectedCallback(){
  this.setup();
  this.observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){this.visible=true;if(!this.data)this.load();}},{rootMargin:'160px'});this.observer.observe(this);
  window.addEventListener('feedback-updated',this.onUpdate);
  // Keep typing, space and arrow keys inside feedback, including shadow DOM.
  this.addEventListener('keydown',e=>e.stopPropagation());
 }
 disconnectedCallback(){this.seq++;this.observer?.disconnect();window.removeEventListener('feedback-updated',this.onUpdate);}
 attributeChangedCallback(name,old,value){if(old!==value&&this.isConnected){this.seq++;this.data=null;this.busy=false;this.setup();if(this.visible)this.load();}}
 setup(){
  this.pending=null;const root=this.shadowRoot,guest=this.hasAttribute('guestbook');
  this.expanded=guest||this.hasAttribute('expanded');
  root.innerHTML=`<style>${styles}</style><div class="bar" aria-label="감정 남기기">${reactions.filter(([kind])=>!(kind==='like'&&this.hasAttribute('no-like'))).map(([kind,emoji,label])=>`<button type="button" class="chip" data-kind="${kind}" aria-label="${label}" title="${label}" aria-pressed="false" disabled><span class="emoji" aria-hidden="true">${emoji}</span>${kind==='like'?'<span>좋아요</span>':''}<span class="count">—</span></button>`).join('')}<button type="button" class="chip comments-toggle" aria-expanded="${this.expanded}" aria-controls="comments-panel">댓글 <span class="count">—</span></button></div><p class="message status" role="status">불러오는 중…</p><div class="panel" id="comments-panel" ${this.expanded?'':'hidden'}><div class="heading"><h3>${guest?'남겨주신 인사':'댓글'} <span class="total"></span></h3><button class="refresh" type="button">새로고침</button></div><form><label>닉네임<input name="name" required maxlength="30" placeholder="어떤 이름으로 남길까요?" autocomplete="nickname"></label><label>${guest?'메시지':'댓글'}<textarea name="body" required maxlength="1000" placeholder="${guest?'다녀간 마음을 남겨 주세요.':'이 이야기를 읽고 든 생각을 남겨 주세요.'}"></textarea></label><label class="trap" aria-hidden="true">웹사이트<input name="website" tabindex="-1" autocomplete="off"></label><div class="actions"><p class="note">누구나 볼 수 있는 글이에요.<br>작성한 브라우저에서 내 글을 삭제할 수 있어요.</p><button class="submit" type="submit">${guest?'인사 남기기':'댓글 남기기'}</button></div></form><div class="list"></div><button class="more" type="button" hidden>이전 글 더 보기</button></div>`;
  root.querySelector('[name=name]').value=stored('visitor-feedback-name');
  root.querySelector('[name=body]').value=stored(this.draftKey);
  root.querySelector('[name=body]').addEventListener('input',e=>{store(this.draftKey,e.target.value);this.pending=null;});
  root.querySelector('[name=name]').addEventListener('input',()=>{this.pending=null;});
  root.querySelector('.comments-toggle').onclick=()=>{this.expanded=!this.expanded;root.querySelector('.panel').hidden=!this.expanded;root.querySelector('.comments-toggle').setAttribute('aria-expanded',String(this.expanded));if(this.expanded&&!this.data)this.load();};
  root.querySelector('.refresh').onclick=()=>this.load();
  root.querySelector('.more').onclick=()=>this.load(true);
  root.querySelectorAll('[data-kind]').forEach(button=>button.onclick=()=>this.mutate({action:'reaction',kind:button.dataset.kind,active:button.getAttribute('aria-pressed')!=='true'}));
  root.querySelector('form').onsubmit=e=>{e.preventDefault();const form=new FormData(e.target);const name=String(form.get('name')).trim(),body=String(form.get('body')).trim();if(!name||!body)return;this.pending??=uuid();this.mutate({action:'comment',id:this.pending,name,body,website:String(form.get('website')||'')});};
 }
 message(text,error=false){const el=this.shadowRoot.querySelector('.message');el.textContent=text;el.classList.toggle('status',!error);el.setAttribute('role',error?'alert':'status');el.hidden=!text;}
 async request(options={}){
  let token='';try{token=identity();}catch(error){if(options.method)throw error;}
  const params=new URLSearchParams({thread:this.thread});if(options.before)params.set('before',options.before);
  const response=await fetch('/api/feedback?'+params,{method:options.method||'GET',headers:{'Content-Type':'application/json',...(token?{'X-Visitor-Token':token}:{})},...(options.body?{body:JSON.stringify(options.body)}:{}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  let data;try{data=await response.json();}catch{throw Error('연결이 원활하지 않아요. 다시 시도해 주세요.');}
  if(!response.ok)throw Error(data.error||'저장하지 못했어요. 다시 시도해 주세요.');return data;
 }
 async load(more=false){
  if(!this.thread)return;const sequence=++this.seq;
  try{const data=await this.request({before:more?this.data?.next:null});if(sequence!==this.seq||!this.isConnected)return;
   if(more&&this.data)data.comments=[...this.data.comments,...data.comments].filter((row,i,all)=>all.findIndex(x=>x.id===row.id)===i);
   this.data=data;this.renderData();this.message('');
  }catch(error){if(sequence===this.seq){this.message(error.message||'불러오지 못했어요.',true);const msg=this.shadowRoot.querySelector('.message');const retry=document.createElement('button');retry.className='refresh';retry.textContent='다시 시도';retry.onclick=()=>this.load();msg.append(retry);}}
 }
 renderData(){
  const root=this.shadowRoot,data=this.data;
  root.querySelectorAll('[data-kind]').forEach(button=>{const reaction=data.reactions.find(row=>row.kind===button.dataset.kind);button.setAttribute('aria-pressed',String(!!reaction?.mine));button.querySelector('.count').textContent=reaction?.count||0;button.disabled=this.busy;});
  root.querySelector('.comments-toggle .count').textContent=data.commentCount;
  root.querySelector('.total').textContent=data.commentCount;
  root.querySelector('.list').innerHTML=data.comments.length?data.comments.map(row=>`<article class="comment"><div class="meta"><strong>${esc(row.name)}</strong><time datetime="${new Date(row.createdAt).toISOString()}">${new Date(row.createdAt).toLocaleDateString('ko-KR')}</time>${row.mine?`<button class="delete" type="button" data-id="${esc(row.id)}">내 글 삭제</button>`:''}</div><p class="body">${esc(row.body)}</p></article>`).join(''):`<p class="empty">${this.hasAttribute('guestbook')?'첫 인사를 남겨 주세요.':'아직 댓글이 없어요. 첫 마음을 남겨 주세요.'}</p>`;
  root.querySelectorAll('.delete').forEach(button=>button.onclick=()=>{if(confirm('내가 남긴 글을 삭제할까요?'))this.mutate({action:'delete',id:button.dataset.id});});
  root.querySelector('.more').hidden=!data.next;
 }
 async mutate(payload){
  if(this.busy)return;this.busy=true;const thread=this.thread,root=this.shadowRoot;
  root.querySelectorAll('button').forEach(button=>button.disabled=true);this.message('저장 중…');
  try{await this.request({method:'POST',body:payload});if(thread!==this.thread)return;
   if(payload.action==='comment'){root.querySelector('[name=body]').value='';store(this.draftKey,'');store('visitor-feedback-name',payload.name);this.pending=null;}
   await this.load();window.dispatchEvent(new CustomEvent('feedback-updated',{detail:thread}));
  }catch(error){if(thread===this.thread)this.message(error.message||'저장하지 못했어요. 다시 시도해 주세요.',true);}
  finally{if(thread===this.thread){this.busy=false;root.querySelectorAll('button').forEach(button=>button.disabled=false);if(!this.data)root.querySelectorAll('[data-kind]').forEach(button=>button.disabled=true);}}
 }
}
if(!customElements.get('visitor-feedback'))customElements.define('visitor-feedback',VisitorFeedback);
