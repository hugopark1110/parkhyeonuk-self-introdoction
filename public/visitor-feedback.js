// Shared, server-backed reactions and comments. Local storage holds only this
// browser's anonymous identity and unsent drafts, never shared content or counts.
const styles = `
:host{color-scheme:light;display:block;font-family:inherit;color:var(--feedback-ink,#191919);font-size:14px;line-height:1.6;text-align:left;--line:#e5e5e5;--muted:#727272}*{box-sizing:border-box}button,input,textarea{font:inherit;color:inherit}button{cursor:pointer}button:disabled{cursor:wait;opacity:.55}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid currentColor;outline-offset:3px}.bar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:12px 0}.chip{display:inline-flex;gap:6px;align-items:center;justify-content:center;min-height:40px;padding:6px 11px;background:#fff;border:1px solid var(--line);border-radius:999px;white-space:nowrap;transition:background .15s}.chip:hover{background:#f5f5f5}.chip[aria-pressed=true]{background:#191919;border-color:#191919;color:white}.emoji{font-family:system-ui;font-size:18px;line-height:1}.count{font-variant-numeric:tabular-nums}.comments-toggle{margin-left:0}.reaction-list{display:contents}.add-reaction{gap:6px;color:var(--muted)}.add-reaction svg{width:19px;height:19px}.picker{border:1px solid var(--line);border-radius:16px;background:white;padding:14px;margin:0 0 16px;max-width:420px;box-shadow:0 8px 30px #00000008}.picker-top{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:12px}.picker-top strong{font-size:15px}.picker-close{border:0;background:transparent;font-size:22px;line-height:1;min-width:32px;min-height:32px}.picker input{max-width:none;font-size:14px;padding:10px 12px}.categories{display:flex;overflow-x:auto;gap:5px;padding:10px 0;scrollbar-width:thin}.category{white-space:nowrap;min-height:34px;border:0;background:transparent;color:var(--muted);border-radius:8px;padding:6px 9px;font-size:13px}.category[aria-pressed=true]{background:#eeeeee;color:#191919}.emoji-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:3px;max-height:245px;overflow-y:auto;overscroll-behavior:contain;padding:3px;scrollbar-width:thin}.emoji-choice{border:0;border-radius:8px;background:transparent;aspect-ratio:1;min-width:0;font-family:system-ui;font-size:25px;display:grid;place-items:center}.emoji-choice:hover,.emoji-choice[aria-pressed=true]{background:#eef2f7}.picker-empty{grid-column:1/-1;padding:20px 5px;font-size:14px;color:var(--muted)}@media(max-width:380px){.emoji-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.emoji-choice{font-size:23px}}.panel{padding:20px 0 6px;border-top:1px solid var(--line)}[hidden]{display:none!important}.heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.heading h3{margin:0;font-size:18px;font-weight:600;letter-spacing:-.03em}.refresh,.delete,.more{border:0;background:transparent;padding:6px 8px;text-decoration:underline;text-underline-offset:4px;font-size:14px}.refresh,.meta,.empty,.note{color:var(--muted)}form{display:grid;gap:12px;margin-bottom:26px}label{display:grid;gap:7px}input,textarea{width:100%;background:#fafafa;border:1px solid var(--line);border-radius:10px;padding:11px 13px;font-size:16px;line-height:1.6}input{max-width:240px}textarea{min-height:105px;resize:vertical}.actions{display:flex;align-items:center;justify-content:space-between;gap:16px}.note{font-size:12px;margin:0;max-width:440px}.submit{border:0;background:#191919;color:white;border-radius:999px;padding:11px 23px;min-height:44px;white-space:nowrap}.message{font-size:14px;margin:7px 0;color:#9e341f}.status{color:var(--muted)}.comment{border-top:1px solid var(--line);padding:20px 0}.meta{display:flex;align-items:center;gap:12px;font-size:12px;flex-wrap:wrap}.meta strong{color:var(--feedback-ink,#191919);font-size:14px;font-weight:600}.delete{margin-left:auto;font-size:12px}.body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:16px;line-height:1.8;margin:9px 0 0}.empty{padding:6px 0 20px;margin:0;font-size:14px}.more{display:block;margin:10px auto}.trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}:host([compact]) .bar{padding:8px 0 16px}:host([compact]) .chip{min-height:36px;padding:4px 9px}:host([compact]) .panel{padding:20px 0}:host([guestbook]) .bar{display:none}@media(max-width:480px){.bar{gap:6px}.chip{padding:6px 9px}.comments-toggle{margin-left:0}.actions{align-items:flex-end}.note{max-width:200px}.meta{gap:8px}}

/* Give the conversation priority; keep writing controls compact. */
.comments-toggle[data-has-comments=true]{background:#191919;border-color:#191919;color:#fff;font-weight:600}.comments-toggle[data-has-comments=true] .count{background:#fff;color:#191919;border-radius:999px;min-width:21px;padding:0 5px;font-size:12px}
.panel,:host([compact]) .panel{padding:16px 0}.heading{margin-bottom:14px}.heading h3{font-size:18px}.list{display:grid;gap:8px}.comment{padding:16px 18px;border:1px solid #e6e6e3;border-radius:12px;background:#f5f5f3}.meta{gap:10px}.meta strong{font-size:14px;color:#191919}.body{margin-top:7px;line-height:1.7;color:#191919}.avatar{display:inline-grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border-radius:50%;background:#e4e7dd;color:#3f4932;font-size:13px;font-weight:600}.empty{padding:2px 0 8px}
.preview{display:block;width:100%;max-width:620px;text-align:left;padding:13px 16px;margin:0 0 16px;border:1px solid #e6e6e3;border-radius:12px;background:#f5f5f3}.preview:hover{background:#eeeFEB}.preview-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;font-size:12px;color:var(--muted)}.preview-more{color:#191919;text-decoration:underline;text-underline-offset:3px}.preview .body{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:15px}.preview .meta{font-size:12px}.preview .avatar{width:24px;height:24px;flex-basis:24px;font-size:12px}
form{gap:8px;margin:16px 0 0;padding:14px 0 0;border-top:1px solid var(--line)}form label{gap:0}.field-label{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}form input,form textarea{background:#fff;border-radius:8px;padding:8px 11px;font-size:16px;line-height:1.4}form input[name=name]{max-width:168px;height:38px}form textarea{height:64px;min-height:64px;resize:vertical}.actions{gap:12px;align-items:center}.note{font-size:12px;max-width:none}.submit{min-height:36px;padding:7px 16px;font-size:14px}.more{margin:12px auto}.delete{padding:4px 6px}
@media(max-width:480px){.comment{padding:14px}.actions{align-items:center}.note{max-width:180px}.preview{padding:12px 14px}}
`;
const replyStyles=`
.comment-actions{display:flex;gap:10px;margin-top:9px}.reply-button,.reply-cancel{border:0;background:transparent;padding:5px 0;font-size:13px;text-decoration:underline;text-underline-offset:3px}.replies{margin:14px 0 0 12px;padding-left:16px;border-left:2px solid #d6dccd;display:grid;gap:10px}.reply{background:#fff;border:1px solid #e6e6e3;border-radius:10px;padding:13px 15px}.reply .body{font-size:15px}.reply-context{margin:0;color:#4c5940;font-size:13px}.reply-form{padding:14px;border:1px solid #d6dccd;border-radius:10px;background:#fff}.reply-form input[name=name]{max-width:190px}.deleted{color:#727272;font-size:14px;font-style:italic;margin:0}.reply .delete{margin-left:auto}.reply-form .actions{justify-content:flex-end}@media(max-width:480px){.replies{margin-left:0;padding-left:10px}.reply{padding:11px}.reply-form{padding:12px}}
`;
const reactions=[['like','♡','좋아요'],['heart','❤️','공감해요'],['clap','👏','멋져요'],['hug','🫂','응원해요'],['wow','😮','놀라워요'],['sad','🥲','마음이 찡해요']];
let catalog=reactions.map(([kind,emoji,label])=>({kind,emoji,label,group:'표정'}));
try{const response=await fetch('/emoji-catalog.json');if(response.ok){const items=await response.json();if(Array.isArray(items)&&items.length)catalog=items;}}catch{/* Existing reactions remain usable if the catalogue cannot load. */}
const groups=['전체','최근',...new Set(catalog.map(item=>item.group))];
function recentKinds(){try{const value=JSON.parse(stored('feedback-recent-emojis')||'[]');return Array.isArray(value)?value.filter(kind=>catalog.some(item=>item.kind===kind)).slice(0,24):[];}catch{return [];}}
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
 constructor(){super();this.attachShadow({mode:'open'});this.seq=0;this.data=null;this.busy=false;this.visible=false;this.onOutside=e=>{if(!e.composedPath().includes(this))this.closePicker(false);};this.onUpdate=e=>{if(e.detail?.thread===this.thread&&e.detail.source!==this&&this.visible)this.load(false,this.replyTo||this.data?.comments.at(-1)?.id);};}
 get thread(){return this.getAttribute('thread')||'';}
 // React assigns existing custom-element properties when opening a story.
 set thread(value){if(value==null)this.removeAttribute('thread');else this.setAttribute('thread',String(value));}
 get draftKey(){return 'feedback-draft:'+this.thread;}
 connectedCallback(){
  this.setup();
  this.observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){this.visible=true;if(!this.data)this.load();}},{rootMargin:'160px'});this.observer.observe(this);
  window.addEventListener('feedback-updated',this.onUpdate);document.addEventListener('pointerdown',this.onOutside);
  // Keep typing, space and arrow keys inside feedback, including shadow DOM.
  this.addEventListener('keydown',e=>e.stopPropagation());
 }
 disconnectedCallback(){this.seq++;this.observer?.disconnect();window.removeEventListener('feedback-updated',this.onUpdate);document.removeEventListener('pointerdown',this.onOutside);}
 attributeChangedCallback(name,old,value){if(old!==value&&this.isConnected){this.seq++;this.data=null;this.busy=false;this.setup();if(this.visible)this.load();}}
 setup(){
  this.pending=null;this.replyTo=null;this.replyPending=null;this.category='전체';const root=this.shadowRoot,guest=this.hasAttribute('guestbook');
  this.expanded=guest||this.hasAttribute('expanded');
  root.innerHTML=`<style>${styles}${replyStyles}</style><div class="bar" aria-label="감정 남기기"><span class="reaction-list"></span><button type="button" class="chip add-reaction" aria-label="이모지 추가" aria-expanded="false" aria-controls="emoji-picker" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.7 14.5A9 9 0 1 1 14.5 3.3M16 5h6M19 2v6"/><path d="M8 14s1 3 4 3 4-3 4-3"/><path d="M8 9h.01M14 9h.01" stroke-width="3" stroke-linecap="round"/></svg><span>이모지 추가</span></button><button type="button" class="chip comments-toggle" aria-expanded="${this.expanded}" aria-controls="comments-panel">댓글 <span class="count"></span></button></div><section class="picker" id="emoji-picker" aria-label="이모지 고르기" hidden><div class="picker-top"><strong>어떤 마음인가요?</strong><button type="button" class="picker-close" aria-label="이모지 선택 닫기">×</button></div><label><span class="trap">이모지 검색</span><input type="search" class="emoji-search" placeholder="이모지 검색 · 웃음, 고양이, 축하…" aria-label="이모지 검색" autocomplete="off"></label><div class="categories" role="group" aria-label="이모지 카테고리">${groups.map(group=>`<button type="button" class="category" data-group="${esc(group)}" aria-pressed="${group==='전체'}">${esc(group)}</button>`).join('')}</div><div class="emoji-grid" role="group" aria-label="이모지 목록"></div></section><p class="message status" role="status">불러오는 중…</p><button class="preview" type="button" hidden aria-label="최근 댓글과 전체 댓글 보기"></button><div class="panel" id="comments-panel" ${this.expanded?'':'hidden'}><div class="heading"><h3>${guest?'남겨주신 인사':'댓글'} <span class="total"></span></h3><button class="refresh" type="button">새로고침</button></div><div class="list"></div><button class="more" type="button" hidden>이전 글 더 보기</button><form class="main-form"><label><span class="field-label">닉네임</span><input name="name" required maxlength="30" placeholder="닉네임" autocomplete="nickname"></label><label><span class="field-label">${guest?'메시지':'댓글'}</span><textarea name="body" required maxlength="1000" placeholder="${guest?'다녀간 마음을 남겨 주세요.':'이 이야기를 읽고 든 생각을 남겨 주세요.'}"></textarea></label><label class="trap" aria-hidden="true">웹사이트<input name="website" tabindex="-1" autocomplete="off"></label><div class="actions"><p class="note">공개 글 · 작성한 브라우저에서 삭제 가능</p><button class="submit" type="submit">${guest?'인사 남기기':'댓글 남기기'}</button></div></form></div>`;
  root.querySelector('.main-form [name=name]').value=stored('visitor-feedback-name');
  root.querySelector('.main-form [name=body]').value=stored(this.draftKey);
  root.querySelector('.main-form [name=body]').addEventListener('input',e=>{store(this.draftKey,e.target.value);this.pending=null;});
  root.querySelector('.main-form [name=name]').addEventListener('input',()=>{this.pending=null;});
  root.querySelector('.comments-toggle').onclick=()=>{this.expanded=!this.expanded;root.querySelector('.panel').hidden=!this.expanded;root.querySelector('.comments-toggle').setAttribute('aria-expanded',String(this.expanded));this.renderPreview();if(this.expanded&&!this.data)this.load();};
  root.querySelector('.preview').onclick=()=>root.querySelector('.comments-toggle').click();
  root.querySelector('.refresh').onclick=()=>this.load();
  root.querySelector('.more').onclick=()=>this.load(true);
  root.querySelector('.add-reaction').onclick=()=>{const picker=root.querySelector('.picker');if(!picker.hidden){this.closePicker();return;}picker.hidden=false;root.querySelector('.add-reaction').setAttribute('aria-expanded','true');this.renderPicker();root.querySelector('.emoji-search').focus({preventScroll:true});};
  root.querySelector('.picker-close').onclick=()=>this.closePicker();
  root.querySelector('.emoji-search').oninput=()=>this.renderPicker();
  root.querySelectorAll('.category').forEach(button=>button.onclick=()=>{this.category=button.dataset.group;this.renderPicker();});
  root.querySelector('.picker').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();this.closePicker();}if(e.target.matches('.emoji-choice')&&['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const buttons=[...root.querySelectorAll('.emoji-choice')];const columns=getComputedStyle(root.querySelector('.emoji-grid')).gridTemplateColumns.split(' ').length;const delta={ArrowRight:1,ArrowLeft:-1,ArrowUp:-columns,ArrowDown:columns}[e.key];buttons[Math.max(0,Math.min(buttons.length-1,buttons.indexOf(e.target)+delta))]?.focus();}};
  root.querySelector('.main-form').onsubmit=e=>{e.preventDefault();const form=new FormData(e.target);const name=String(form.get('name')).trim(),body=String(form.get('body')).trim();if(!name||!body)return;this.pending??=uuid();this.mutate({action:'comment',id:this.pending,name,body,website:String(form.get('website')||'')});};
 }
 message(text,error=false){const el=this.shadowRoot.querySelector('.message');el.textContent=text;el.classList.toggle('status',!error);el.setAttribute('role',error?'alert':'status');el.hidden=!text;}
 async request(options={}){
  let token='';try{token=identity();}catch(error){if(options.method)throw error;}
  const params=new URLSearchParams({thread:this.thread});if(options.before)params.set('before',options.before);
  const response=await fetch('/api/feedback?'+params,{method:options.method||'GET',headers:{'Content-Type':'application/json',...(token?{'X-Visitor-Token':token}:{})},...(options.body?{body:JSON.stringify(options.body)}:{}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  let data;try{data=await response.json();}catch{throw Error('연결이 원활하지 않아요. 다시 시도해 주세요.');}
  if(!response.ok)throw Error(data.error||'저장하지 못했어요. 다시 시도해 주세요.');return data;
 }
 async load(more=false,throughId=null){
  if(!this.thread)return;const sequence=++this.seq;
  try{const data=await this.request({before:more?this.data?.next:null});while(throughId&&!data.comments.some(row=>row.id===throughId)&&data.next){const page=await this.request({before:data.next});data.comments.push(...page.comments);data.next=page.next;}if(sequence!==this.seq||!this.isConnected)return;
   if(more&&this.data)data.comments=[...this.data.comments,...data.comments].filter((row,i,all)=>all.findIndex(x=>x.id===row.id)===i);
   this.data=data;this.renderData();this.message('');
  }catch(error){if(sequence===this.seq){this.message(error.message||'불러오지 못했어요.',true);const msg=this.shadowRoot.querySelector('.message');const retry=document.createElement('button');retry.className='refresh';retry.textContent='다시 시도';retry.onclick=()=>this.load();msg.append(retry);}}
 }
 renderData(){
  const root=this.shadowRoot,data=this.data;
  const focused=root.activeElement?.dataset?.kind;
  root.querySelector('.reaction-list').innerHTML=data.reactions.filter(row=>Number(row.count)>0).map(row=>{const item=catalog.find(item=>item.kind===row.kind);if(!item)return '';return `<button type="button" class="chip reaction" data-kind="${esc(row.kind)}" aria-label="${esc(item.label)} ${row.count}개${row.mine?', 내 반응':''}" title="${esc(item.label)}" aria-pressed="${!!row.mine}" ${this.busy?'disabled':''}><span class="emoji" aria-hidden="true">${esc(item.emoji)}</span><span class="count">${row.count}</span></button>`;}).join('');
  root.querySelectorAll('.reaction').forEach(button=>button.onclick=()=>this.mutate({action:'reaction',kind:button.dataset.kind,active:button.getAttribute('aria-pressed')!=='true'}));
  root.querySelector('.add-reaction').disabled=this.busy;
  if(focused)([...root.querySelectorAll('.reaction')].find(button=>button.dataset.kind===focused)||root.querySelector('.add-reaction')).focus({preventScroll:true});
  root.querySelector('.comments-toggle .count').textContent=data.commentCount||'';
  root.querySelector('.comments-toggle').dataset.hasComments=String(data.commentCount>0);
  this.renderPreview();
  root.querySelector('.total').textContent=data.commentCount;
  root.querySelector('.list').innerHTML=data.comments.length?data.comments.map(row=>`<article class="comment" data-comment-id="${esc(row.id)}">${this.commentMarkup(row)}${!row.deleted?`<div class="comment-actions"><button class="reply-button" type="button" data-id="${esc(row.id)}" aria-expanded="${this.replyTo===row.id}">답글${row.replies?.length?` ${row.replies.length}`:''}</button></div>`:''}${row.replies?.length?`<div class="replies" aria-label="답글">${row.replies.map(reply=>`<article class="reply">${this.commentMarkup(reply)}</article>`).join('')}</div>`:''}</article>`).join(''):`<p class="empty">${this.hasAttribute('guestbook')?'첫 인사를 남겨 주세요.':'아직 댓글이 없어요. 첫 마음을 남겨 주세요.'}</p>`;
  root.querySelectorAll('.delete').forEach(button=>button.onclick=()=>{if(confirm('내가 남긴 글을 삭제할까요?'))this.mutate({action:'delete',id:button.dataset.id});});
  root.querySelectorAll('.reply-button').forEach(button=>button.onclick=()=>{this.replyPending=null;this.replyTo=this.replyTo===button.dataset.id?null:button.dataset.id;this.renderReplyForm(true);});
  this.renderReplyForm();
  root.querySelector('.more').hidden=!data.next;
 }
 commentMarkup(row){
  if(row.deleted)return '<p class="deleted">삭제된 댓글입니다.</p>';
  return `<div class="meta"><span class="avatar" aria-hidden="true">${esc(Array.from(row.name)[0]||'익')}</span><strong>${esc(row.deleted?'삭제된 댓글':row.name)}</strong><time datetime="${new Date(row.createdAt).toISOString()}">${new Date(row.createdAt).toLocaleDateString('ko-KR')}</time>${row.mine?`<button class="delete" type="button" data-id="${esc(row.id)}">내 글 삭제</button>`:''}</div><p class="body">${esc(row.body)}</p>`;
 }
 renderReplyForm(focus=false){
  const root=this.shadowRoot;root.querySelector('.reply-form')?.remove();
  root.querySelectorAll('.reply-button').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.id===this.replyTo)));
  const row=this.data?.comments.find(row=>row.id===this.replyTo&&!row.deleted);if(!row)return;
  const form=document.createElement('form'),key=this.draftKey+':reply:'+row.id;form.className='reply-form';
  form.innerHTML=`<p class="reply-context">${esc(row.name)}님에게 답글</p><label><span class="field-label">답글 닉네임</span><input name="name" required maxlength="30" placeholder="닉네임" autocomplete="nickname"></label><label><span class="field-label">답글 내용</span><textarea name="body" required maxlength="1000" placeholder="답글을 남겨 주세요."></textarea></label><label class="trap" aria-hidden="true">웹사이트<input name="website" tabindex="-1" autocomplete="off"></label><div class="actions"><button class="reply-cancel" type="button">취소</button><button class="submit" type="submit">답글 남기기</button></div>`;
  form.querySelector('[name=name]').value=stored('visitor-feedback-name')||root.querySelector('.main-form [name=name]').value;
  form.querySelector('[name=body]').value=stored(key);
  form.querySelector('[name=body]').oninput=e=>{store(key,e.target.value);this.replyPending=null;};
  form.querySelector('[name=name]').oninput=()=>{this.replyPending=null;};
  form.querySelector('.reply-cancel').onclick=()=>{this.replyTo=null;this.replyPending=null;this.renderReplyForm();root.querySelector(`.reply-button[data-id="${row.id}"]`)?.focus({preventScroll:true});};
  form.onsubmit=e=>{e.preventDefault();const fields=new FormData(form),name=String(fields.get('name')).trim(),body=String(fields.get('body')).trim();if(!name||!body)return;this.replyPending??=uuid();this.mutate({action:'comment',id:this.replyPending,parentId:row.id,name,body,website:String(fields.get('website')||'')});};
  root.querySelector(`[data-comment-id="${row.id}"]`)?.append(form);
  if(focus)form.querySelector('[name=body]').focus({preventScroll:true});
 }
 renderPreview(){
  const preview=this.shadowRoot.querySelector('.preview'),row=this.data?.comments[0];
  preview.hidden=this.expanded||!this.hasAttribute('compact')||!row;
  if(preview.hidden)return;
  preview.innerHTML=`<span class="preview-top"><span>최근 댓글</span><span class="preview-more">댓글 ${this.data.commentCount}개 보기</span></span><span class="meta"><span class="avatar" aria-hidden="true">${esc(Array.from(row.name)[0]||'익')}</span><strong>${esc(row.deleted?'삭제된 댓글':row.name)}</strong><time datetime="${new Date(row.createdAt).toISOString()}">${new Date(row.createdAt).toLocaleDateString('ko-KR')}</time></span><span class="body">${esc(row.deleted?'삭제된 댓글입니다.':row.body)}</span>`;
 }
 closePicker(focus=true){const root=this.shadowRoot,picker=root.querySelector('.picker');if(!picker||picker.hidden)return;picker.hidden=true;root.querySelector('.add-reaction').setAttribute('aria-expanded','false');if(focus)root.querySelector('.add-reaction').focus({preventScroll:true});}
 renderPicker(){
  const root=this.shadowRoot,query=root.querySelector('.emoji-search').value.trim().toLowerCase(),recent=recentKinds();
  root.querySelectorAll('.category').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===this.category)));
  let items=this.category==='최근'?recent.map(kind=>catalog.find(item=>item.kind===kind)).filter(Boolean):catalog.filter(item=>this.category==='전체'||item.group===this.category);
  if(query)items=items.filter(item=>(item.label+' '+item.group+' '+item.emoji+' '+item.kind).toLowerCase().includes(query));
  root.querySelector('.emoji-grid').innerHTML=items.length?items.map(item=>`<button type="button" class="emoji-choice" data-emoji="${esc(item.kind)}" aria-label="${esc(item.label)}" title="${esc(item.label)}" aria-pressed="${!!this.data?.reactions.find(row=>row.kind===item.kind)?.mine}">${esc(item.emoji)}</button>`).join(''):`<p class="picker-empty">${this.category==='최근'&&!query?'최근 사용한 이모지가 없어요.':'검색 결과가 없어요. 다른 단어로 찾아보세요.'}</p>`;
  root.querySelectorAll('.emoji-choice').forEach(button=>button.onclick=()=>{const kind=button.dataset.emoji;const active=!this.data?.reactions.find(row=>row.kind===kind)?.mine;this.closePicker();this.mutate({action:'reaction',kind,active});});
 }
 async mutate(payload){
  if(this.busy)return;this.busy=true;const thread=this.thread,root=this.shadowRoot;
  root.querySelectorAll('button').forEach(button=>button.disabled=true);this.message('저장 중…');
  try{await this.request({method:'POST',body:payload});if(thread!==this.thread)return;
   if(payload.action==='reaction'&&payload.active)store('feedback-recent-emojis',JSON.stringify([payload.kind,...recentKinds().filter(kind=>kind!==payload.kind)].slice(0,24)));
   if(payload.action==='comment'){if(payload.parentId){store(this.draftKey+':reply:'+payload.parentId,'');this.replyTo=null;this.replyPending=null;}else{root.querySelector('.main-form [name=body]').value='';store(this.draftKey,'');this.pending=null;}store('visitor-feedback-name',payload.name);}
   await this.load(false,payload.parentId);window.dispatchEvent(new CustomEvent('feedback-updated',{detail:{thread,source:this}}));
  }catch(error){if(thread===this.thread)this.message(error.message||'저장하지 못했어요. 다시 시도해 주세요.',true);}
  finally{if(thread===this.thread){this.busy=false;root.querySelectorAll('button').forEach(button=>button.disabled=false);if(!this.data)root.querySelector('.add-reaction').disabled=true;}}
 }
}
if(!customElements.get('visitor-feedback'))customElements.define('visitor-feedback',VisitorFeedback);
