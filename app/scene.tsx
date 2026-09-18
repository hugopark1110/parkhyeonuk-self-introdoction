'use client';
import {useEffect,useRef,useState} from 'react';
import {createSoftwareRenderer} from './three/software-renderer';
import {loadModels,arrangement,screenAnchor,type Pose,type CatModel} from './three/sculpture';
import {createDynamics,installLiquid} from './three/dynamics';
import {interests} from './interests';
import {sharedHeroProgress,clamp01,advanceSpring,smoothstep,HERO_MOTION_EVENT} from './hero-progress';
import type {LoadReporter} from './use-intro-loading';
type Backend={resize:(w:number,h:number,dpr:number)=>void;render:(pose:Pose)=>void;dispose:()=>void};
type Source='hover'|'focus'|'click'|'scroll';
type Props={motion:boolean;start:boolean;onLoad:LoadReporter;onEffect:(index:number,pan?:number,distance?:number)=>void;onCapture:(point:{x:number;y:number})=>void;onInspect:(index:number|null)=>void};
export default function Scene({motion,start,onLoad,onEffect,onInspect,onCapture}:Props){
 const startRef=useRef(start),loadRef=useRef(onLoad);startRef.current=start;loadRef.current=onLoad;
 const host=useRef<HTMLDivElement>(null),motionRef=useRef(motion),effectRef=useRef(onEffect),inspectRef=useRef(onInspect),captureRef=useRef(onCapture);
 const redraw=useRef<()=>void>(()=>{}),selectRef=useRef<(index:number,source:Source,point?:{x:number;y:number})=>void>(()=>{}),exitRef=useRef<()=>void>(()=>{}),ignoreFocus=useRef(false),exitButton=useRef<HTMLButtonElement>(null),moved=useRef(false),candleRef=useRef(false),cakeHover=useRef(false),cakeFocus=useRef(false);
 const [inspection,setInspection]=useState<number|null>(null),[candle,setCandle]=useState(false),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 effectRef.current=onEffect;inspectRef.current=onInspect;captureRef.current=onCapture;
 useEffect(()=>{motionRef.current=motion;redraw.current();},[motion,start]);
 useEffect(()=>{
  const element=host.current;if(!element)return;const section=element.closest('section'),stage=element.closest<HTMLElement>('.hero-stage');
  let dead=false,backend:Backend|null=null,models:CatModel[]=[],bounds:number[][][]=[],animate:ReturnType<typeof createDynamics>|null=null,canvas:HTMLCanvasElement;
  let frame=0,visible=true,dragging=false,previousX=0,previousY=0,startX=0,startY=0,lastTime=0,lastDraw=0,software=false,hovered=-1,hoverX=0,hoverY=0;
  let entranceStart:number|null=null,pendingDraw=false,selected=-1,selectionSource:Source='hover',pendingEffect:Source|null=null;
  const sitting={value:0,velocity:0},orbit={x:0,y:0},orbitX={value:0,velocity:0},orbitY={value:0,velocity:0};
  let unlockScroll:(()=>void)|null=null,restoreIndex=-1,hoverBlockedUntil=0;
  const inspections=Array.from({length:5},()=>({value:0,velocity:0}));
  let paperUntil=-100,paperAfterSneeze:number|null=null,pointerActive=false;
  let candleTimer:ReturnType<typeof setTimeout>|undefined,paperTimer:ReturnType<typeof setTimeout>|undefined;
  function revealPaper(){paperUntil=selected===4?Infinity:pose.time+6;clearTimeout(paperTimer);if(selected!==4)paperTimer=setTimeout(()=>{paperUntil=-100;wake();},6000);wake();}
  const compact=matchMedia('(max-width:640px)').matches,pointer={x:0,y:0},drag={x:0,y:0},pointerX={value:0,velocity:0},pointerY={value:0,velocity:0},dragX={value:0,velocity:0},dragY={value:0,velocity:0},focus={value:0,velocity:0},paper={value:0,velocity:0},seen=new Set<number>(),soundTimers=new Map<number,ReturnType<typeof setTimeout>>();
  const pose:Pose={time:0,delta:0,pointerX:0,pointerY:0,dragX:0,dragY:0,progress:0,motion:true,events:[-1000,-1000,-1000,-1000,-1000],focus:0,candle:false,entrance:0};
  const buttons=Array.from(element.querySelectorAll<HTMLButtonElement>('.object-hit'));
  function makeCanvas(){const c=document.createElement('canvas');c.tabIndex=0;c.setAttribute('role','img');c.setAttribute('aria-label','입체 오브젝트. 드래그와 방향키로 회전할 수 있습니다. 오브젝트를 선택하면 확대해서 볼 수 있습니다.');c.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown R Escape');c.dataset.scene='live-3d';return c;}
  function extinguish(){clearTimeout(candleTimer);if(candleRef.current)pose.candleOut=pose.time;candleRef.current=false;pose.candle=false;element!.dataset.candle='off';setCandle(false);wake();}
  function deselect(){
   restoreIndex=selected;soundTimers.forEach(clearTimeout);soundTimers.clear();selected=-1;pendingEffect=null;hovered=-1;paperAfterSneeze=null;paperUntil=-100;cakeHover.current=cakeFocus.current=false;unlockScroll?.();unlockScroll=null;
   element!.dataset.inspecting='false';setInspection(null);inspectRef.current(null);extinguish();hoverBlockedUntil=performance.now()+700;wake();
  }
  function select(index:number,source:Source,point?:{x:number;y:number}){
   if(source==='focus'&&ignoreFocus.current){ignoreFocus.current=false;return;}
   if(!startRef.current||(pose.entrance??0)<.99||pose.progress>=.12)return;
   if(selected>=0){if(index===selected&&source==='click'&&pendingEffect===null)trigger(index,source);return;}
   if(source==='hover'&&performance.now()<hoverBlockedUntil)return;
   if(point){hoverX=point.x;hoverY=point.y;}
   selected=index;selectionSource=source;pendingEffect=source;setInspection(index);inspectRef.current(index);element!.dataset.inspecting='true';element!.dataset.input=source==='focus'?'keyboard':'pointer';
   orbit.x=orbit.y=orbitX.value=orbitY.value=orbitX.velocity=orbitY.velocity=0;
   const html=document.documentElement,body=document.body,oldHtml=html.style.overflow,oldBody=body.style.overflow;
   html.style.overflow=body.style.overflow='hidden';unlockScroll=()=>{html.style.overflow=oldHtml;body.style.overflow=oldBody;};
   hovered=index;cakeHover.current=false;cakeFocus.current=index===3;canvas.focus({preventScroll:true});wake();
  }
  selectRef.current=select;exitRef.current=()=>{deselect();const button=buttons[restoreIndex];if(button){ignoreFocus.current=true;button.focus({preventScroll:true});queueMicrotask(()=>{ignoreFocus.current=false;});}};
  function trigger(index:number,source:Source){
   if(dead||!backend||!startRef.current||(pose.entrance??0)<.9||pose.progress>=.12)return;
   // A click during the same hover/tap sequence must not interrupt the sneeze.
   if(index===4&&source==='click'&&pose.time-pose.events[4]<2.7)return;
   if(index===3){
    clearTimeout(candleTimer);
    if(candleRef.current)return;
    candleRef.current=true;pose.candle=true;element!.dataset.candle='on';element!.dataset.candleSource=source;setCandle(true);
   }else{
    if(source!=='scroll'&&!cakeFocus.current)extinguish();
    if(index!==4&&source!=='click'&&pose.time-pose.events[index]<2)return;
   }
   pose.events[index]=pose.time;element!.dataset.lastEffect=interests[index].name;
   if(index===4){
    clearTimeout(paperTimer);paperUntil=-100;pose.paperReveal=0;paper.value=paper.velocity=0;
    // Follow the animation clock so slow devices finish the sneeze before revealing.
    paperAfterSneeze=pose.time+(motionRef.current?2.7:0);
   }
   const rect=buttons[index].getBoundingClientRect(),point={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
   if(index===0)captureRef.current(point);
   clearTimeout(soundTimers.get(index));soundTimers.set(index,setTimeout(()=>{if(!dead)effectRef.current(index,(point.x/innerWidth-.5)*1.6,pose.progress*.5);},index===4?390:0));wake();
  }
  function draw(time:number){
   if(dead||!backend)return;const dt=Math.min(.12,(time-(lastTime||time))/1000);lastTime=time;pose.delta=dt;pose.time+=dt;
   if(startRef.current&&entranceStart===null)entranceStart=pose.time;
   pose.entrance=entranceStart===null?0:motionRef.current?clamp01((pose.time-entranceStart)/2.2):1;
   element!.dataset.entrance=(pose.entrance??0).toFixed(2);
   const target=candleRef.current?1:0;if(!motionRef.current){focus.value=target;focus.velocity=0;}pose.focus=advanceSpring(focus,target,dt,8);
   pose.candle=candleRef.current;element!.style.setProperty('--night',String(pose.focus));section?.style.setProperty('--night',String(pose.focus));element!.dataset.candle=pose.candle?'on':'off';element!.dataset.focus=pose.focus.toFixed(2);
   if(!motionRef.current){for(const [state,value] of [[pointerX,pointer.x],[pointerY,pointer.y],[dragX,drag.x],[dragY,drag.y]] as const){state.value=value;state.velocity=0;}}
   pose.pointerX=advanceSpring(pointerX,pointer.x,dt,12);pose.pointerY=advanceSpring(pointerY,pointer.y,dt,12);pose.dragX=advanceSpring(dragX,drag.x,dt,16);pose.dragY=advanceSpring(dragY,drag.y,dt,16);
   pose.progress=motionRef.current&&section&&stage?sharedHeroProgress(section,stage):0;pose.motion=motionRef.current;element!.dataset.progress=pose.progress.toFixed(5);
   if(pose.progress>.12&&selected<0){paperAfterSneeze=null;paperUntil=-100;hovered=-1;}
   pose.inspect=inspections.map((state,i)=>{const target=selected===i?1:0;if(!pose.motion){state.value=target;state.velocity=0;}const value=advanceSpring(state,target,dt,10);if(Math.abs(value-target)<.0001&&Math.abs(state.velocity)<.001){state.value=target;state.velocity=0;}return state.value;});
   if(!pose.motion){orbitX.value=orbit.x;orbitY.value=orbit.y;orbitX.velocity=orbitY.velocity=0;}pose.inspectRotation=[advanceSpring(orbitY,orbit.y,dt,18),advanceSpring(orbitX,orbit.x,dt,18)];element!.dataset.orbitX=pose.inspectRotation[1].toFixed(3);element!.dataset.orbitY=pose.inspectRotation[0].toFixed(3);
   const inspect=Math.max(...pose.inspect);section?.style.setProperty('--inspect',String(inspect));element!.dataset.inspect=inspect.toFixed(3);element!.dataset.inspectIndex=String(selected);element!.dataset.inspecting=String(selected>=0);
   if(startRef.current&&(pose.entrance??0)>=1&&pose.motion&&selected<0&&pose.focus<.01&&pose.progress>.015&&pose.progress<.15){[.02,.04,.06,Infinity,.08].forEach((threshold,i)=>{if(pose.progress>=threshold&&!seen.has(i)){seen.add(i);trigger(i,'scroll');}});}if(pose.progress===0)seen.clear();
   const note=element!.querySelector<HTMLElement>('.inspection-details');pose.inspectionNoteHeight=note?.offsetHeight??240;
   const w=element!.clientWidth,h=element!.clientHeight,placements=arrangement(w,h,pose,models);
   const interactive=startRef.current&&(pose.entrance??0)>.96&&pose.progress<.12;element!.dataset.interactive=String(interactive);
   const cr=buttons[4].getBoundingClientRect(),focused=document.activeElement===buttons[4],near=selected===4||hovered===4||focused,look=screenAnchor(w,h,placements[4],models[4].anchors?.Head_Pivot),er=element!.getBoundingClientRect(),follow=1-Math.exp(-dt*7);
   pose.catLookX=(pose.catLookX??0)+((pointerActive&&selected<0?Math.max(-1,Math.min(1,(hoverX-er.left-look.x)/Math.max(90,cr.width*.9))):0)-(pose.catLookX??0))*follow;
   pose.catLookY=(pose.catLookY??0)+((pointerActive&&selected<0?Math.max(-1,Math.min(1,-(hoverY-er.top-look.y)/Math.max(90,cr.height*.8))):0)-(pose.catLookY??0))*follow;
   pose.catAttention=(pose.catAttention??0)+((near?1:0)-(pose.catAttention??0))*follow;
   if(paperAfterSneeze!==null&&(!pose.motion||pose.time>=paperAfterSneeze)){paperAfterSneeze=null;revealPaper();}
   const paperTarget=pose.time<paperUntil&&pose.focus<.1?1:0;if(!motionRef.current){paper.value=paperTarget;paper.velocity=0;}pose.paperReveal=advanceSpring(paper,paperTarget,dt,11);
   const age=pose.time-pose.events[4],sitTarget=selected===4&&(paperAfterSneeze!==null||pose.time<paperUntil)?(pose.motion?smoothstep(1.45,2.50,age):1):pose.paperReveal??0;if(!pose.motion){sitting.value=sitTarget;sitting.velocity=0;}pose.catSit=advanceSpring(sitting,sitTarget,dt,14);element!.dataset.catSit=pose.catSit.toFixed(3);
   element!.dataset.paper=(pose.paperReveal??0)>.5?'revealed':'hidden';element!.style.setProperty('--paper-x',(cr.left-er.left+cr.width*.5)+'px');element!.style.setProperty('--paper-y',Math.min(h-22,cr.bottom-er.top+8)+'px');element!.style.setProperty('--paper-opacity',String(pose.paperReveal??0));
   if(placements.some(p=>p.visibility>.003))animate?.(pose,placements);backend.render(pose);
   placements.forEach((p,i)=>{const corners=bounds[i].map(v=>screenAnchor(w,h,p,v)),xs=corners.map(v=>v.x),ys=corners.map(v=>v.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),b=buttons[i];if(!b)return;b.setAttribute('aria-pressed',String(selected===i));const enabled=interactive&&(selected<0||selected===i);b.disabled=!enabled;b.style.visibility=enabled?'visible':'hidden';b.style.left=(x0+x1)/2+'px';b.style.top=(y0+y1)/2+'px';b.style.width=Math.max(44,(x1-x0)*.9)+'px';b.style.height=Math.max(44,(y1-y0)*.9)+'px';});
   if(selected>=0&&pendingEffect&&pose.inspect[selected]>.965){const source=pendingEffect;pendingEffect=null;trigger(selected,source);}
   lastDraw=software?performance.now():time;
  }
  function resize(){if(!backend)return;const note=element!.querySelector<HTMLElement>('.inspection-details');pose.inspectionNoteHeight=note?.offsetHeight??240;backend.resize(Math.max(1,element!.clientWidth),Math.max(1,element!.clientHeight),Math.min(devicePixelRatio,compact?1.5:1.8));draw(performance.now());}
  function tick(time:number){frame=0;if(dead||!visible||document.hidden||!backend)return;if(!software||!motionRef.current||time-lastDraw>=1000/30){draw(time);pendingDraw=false;}if(!frame&&(Math.abs(orbitX.velocity)>.001||Math.abs(orbitY.velocity)>.001||inspections.some((s,i)=>Math.abs(s.value-(selected===i?1:0))>.0001||Math.abs(s.velocity)>.001)||pendingDraw||(startRef.current&&motionRef.current&&(pose.progress<.73||(pose.entrance??0)<1))||Math.abs(focus.velocity)>.0001||Math.abs(pose.focus-(candleRef.current?1:0))>.00001))frame=requestAnimationFrame(tick);}
  function wake(){pendingDraw=true;if(dead||!visible||document.hidden||frame)return;frame=requestAnimationFrame(tick);}
  redraw.current=()=>{cancelAnimationFrame(frame);frame=0;wake();};
  function move(e:PointerEvent){
   const r=element!.getBoundingClientRect();pointerActive=e.pointerType!=='touch';hoverX=e.clientX;hoverY=e.clientY;const target=(e.target as Element).closest<HTMLButtonElement>('.object-hit');
   if(selected<0&&e.pointerType!=='touch'&&!dragging){moved.current=false;const index=target?Number(target.dataset.index):-1;if(index>=0)select(index,'hover',{x:e.clientX,y:e.clientY});}
   if(dragging){
    if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)moved.current=true;
    if(moved.current&&selected>=0){const sensitivity=Math.PI*2/Math.max(280,Math.min(r.width,r.height));orbit.x+=(e.clientX-previousX)*sensitivity;orbit.y+=(e.clientY-previousY)*sensitivity;}
    previousX=e.clientX;previousY=e.clientY;
   }else if(e.pointerType!=='touch'&&selected<0){pointer.x=(e.clientX-r.left)/r.width-.5;pointer.y=(e.clientY-r.top)/r.height-.5;}wake();
  }
  function down(e:PointerEvent){
   if(e.button!==0||(e.target as Element).closest('[data-inspector-ui]'))return;
   moved.current=false;if(selected<0)return;dragging=true;startX=previousX=e.clientX;startY=previousY=e.clientY;element!.dataset.dragging='true';element!.setPointerCapture(e.pointerId);
  }
  function up(e:PointerEvent){dragging=false;element!.dataset.dragging='false';if(element!.hasPointerCapture(e.pointerId))element!.releasePointerCapture(e.pointerId);}
  function leave(){pointerActive=false;if(selected<0&&!dragging){pointer.x=pointer.y=0;}wake();}
  function scroll(){wake();}
  function preventScroll(e:WheelEvent|TouchEvent){if((e.target as Element)?.closest('.inspection-details'))return;if(selected>=0&&e.cancelable&&!e.ctrlKey)e.preventDefault();}
  function keyboard(e:KeyboardEvent){
   if(selected>=0){
    element!.dataset.input='keyboard';
    const details=element!.querySelector<HTMLElement>('.inspection-details');
    if(e.key==='Escape'){e.preventDefault();exitRef.current();return;}
    if(e.key==='Tab'){e.preventDefault();const stops=[canvas,exitButton.current,...(details&&details.scrollHeight>details.clientHeight?[details]:[])].filter((node):node is HTMLElement=>!!node);const current=stops.indexOf(document.activeElement as HTMLElement);stops[(current+(e.shiftKey?-1:1)+stops.length)%stops.length]?.focus({preventScroll:true});return;}
    if(e.target===details)return;
    if(e.target===exitButton.current&&['Enter',' '].includes(e.key))return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageDown','PageUp','Home','End',' '].includes(e.key))e.preventDefault();
    if(e.key==='ArrowLeft')orbit.x-=Math.PI/12;if(e.key==='ArrowRight')orbit.x+=Math.PI/12;if(e.key==='ArrowUp')orbit.y-=Math.PI/12;if(e.key==='ArrowDown')orbit.y+=Math.PI/12;
    if(e.key.toLowerCase()==='r')orbit.x=orbit.y=0;
    if(e.key==='Enter'&&e.target===canvas)trigger(selected,'click');wake();return;
   }
  }
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{lastTime=performance.now();wake();}}
  async function prepare(){models=await loadModels(compact,value=>{if(!dead)loadRef.current('models',value);});bounds=models.map(m=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<m.positions.length;i++){const k=i%3;lo[k]=Math.min(lo[k],m.positions[i]);hi[k]=Math.max(hi[k],m.positions[i]);}return Array.from({length:8},(_,i)=>[i&1?hi[0]:lo[0],i&2?hi[1]:lo[1],i&4?hi[2]:lo[2]]);});installLiquid(models[2]);animate=createDynamics(models);}
  function ready(){resize();setStatus('ready');loadRef.current('renderer',1);wake();}
  function startSoftware(){try{software=true;canvas.dataset.renderer='software-3d';backend=createSoftwareRenderer(canvas,compact,models);ready();}catch{if(!dead){setStatus('error');loadRef.current('renderer',0,'3D 화면을 준비하지 못했어요.');}}}
  function lost(e:Event){e.preventDefault();if(dead||software)return;canvas.removeEventListener('webglcontextlost',lost);backend?.dispose();backend=null;const old=canvas;canvas=makeCanvas();old.replaceWith(canvas);startSoftware();}
  canvas=makeCanvas();element.appendChild(canvas);const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'});
  prepare().then(async()=>{if(dead)return;if(gl){try{const {createWebGLRenderer}=await import('./three/webgl-renderer');if(dead)return;canvas.addEventListener('webglcontextlost',lost);backend=createWebGLRenderer(canvas,gl,compact,models);canvas.dataset.renderer='webgl-3d';ready();}catch{lost(new Event('webglcontextlost'));}}else startSoftware();}).catch(()=>{if(!dead){setStatus('error');loadRef.current('models',0,'오브젝트를 불러오지 못했어요.');}});
  const observer=new ResizeObserver(resize);observer.observe(element);const intersection=new IntersectionObserver(events=>{visible=events[0].isIntersecting;if(visible){lastTime=performance.now();wake();}else{cancelAnimationFrame(frame);frame=0;extinguish();}},{rootMargin:'50px'});intersection.observe(element);
  section?.addEventListener(HERO_MOTION_EVENT,wake);element.addEventListener('pointermove',move);element.addEventListener('pointerdown',down);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('lostpointercapture',up);window.addEventListener('wheel',preventScroll,{passive:false});element.addEventListener('touchmove',preventScroll,{passive:false});element.addEventListener('pointerleave',leave);window.addEventListener('keydown',keyboard);window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',visibility);
  return()=>{dead=true;unlockScroll?.();cancelAnimationFrame(frame);clearTimeout(candleTimer);clearTimeout(paperTimer);soundTimers.forEach(clearTimeout);observer.disconnect();intersection.disconnect();canvas.removeEventListener('webglcontextlost',lost);section?.removeEventListener(HERO_MOTION_EVENT,wake);element.removeEventListener('pointermove',move);element.removeEventListener('pointerdown',down);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('lostpointercapture',up);window.removeEventListener('wheel',preventScroll);element.removeEventListener('touchmove',preventScroll);element.removeEventListener('pointerleave',leave);window.removeEventListener('keydown',keyboard);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);backend?.dispose();canvas.remove();section?.style.removeProperty('--night');section?.style.removeProperty('--inspect');redraw.current=()=>{};selectRef.current=()=>{};exitRef.current=()=>{};};
 },[]);
 return <div className="scene-wrap home-candle" data-lit={candle}><div ref={host} className="live-scene" data-status={status} role={inspection!==null?'dialog':undefined} aria-modal={inspection!==null?true:undefined} aria-label={inspection!==null?`${interests[inspection].name} 자세히 보기`:undefined}>{interests.map((item,i)=><button key={item.name} data-index={i} className="object-hit" aria-label={i===3?'케이크: 확대해서 보기':`${item.name}: 확대해서 보기`} aria-describedby="object-note" disabled={status!=='ready'} onFocus={e=>{if(e.currentTarget.matches(':focus-visible')){const r=e.currentTarget.getBoundingClientRect();selectRef.current(i,'focus',{x:r.right,y:r.top});}}} onClick={e=>{if(moved.current)return;const r=e.currentTarget.getBoundingClientRect();selectRef.current(i,'click',{x:e.clientX||r.right,y:e.clientY||r.top});}}/>)} {inspection!==null&&<div className="inspection-ui" data-inspector-ui="true"><button ref={exitButton} type="button" className="inspection-exit" onClick={()=>exitRef.current()} aria-label="오브제 확대 화면 나가기"><span aria-hidden="true">×</span> 나가기</button><aside id="object-note" className="interest-note inspection-details" tabIndex={0} aria-label="오브제 상세 설명"><span>{interests[inspection].subtitle}</span><h2>{interests[inspection].name}</h2><p>{interests[inspection].reason}</p><small>드래그해서 360° 둘러보세요</small></aside></div>}<span aria-hidden="true" className="paper-discovery">종이 고양이는 괜찮아요.</span></div>{status==='loading'&&<span className="scene-status" role="status">오브젝트를 불러오는 중</span>}{status==='error'&&<span className="scene-status" role="status">3D를 불러오지 못했어요. 새로고침해 주세요.</span>}</div>;
}
