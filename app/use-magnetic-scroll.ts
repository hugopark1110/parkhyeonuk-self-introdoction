'use client';
import {useEffect,type RefObject} from 'react';
import {smoothstep} from './hero-progress';
import {CELEBRATION_START,CELEBRATION_STOP,CELEBRATION_DURATION} from './celebration';
import {createWheelGesture,magneticStops,nextMagneticStop} from './magnetic-scroll';

/** A short three-stop introduction. The stories retain ordinary document scrolling. */
export function useMagneticScroll(root:RefObject<HTMLDivElement|null>,enabled:boolean){useEffect(()=>{
 if(!enabled)return;
 const site=root.current,hero=site?.querySelector<HTMLElement>('.hero'),stage=site?.querySelector<HTMLElement>('.hero-stage'),selected=site?.querySelector<HTMLElement>('#selected'),header=site?.querySelector<HTMLElement>('.site-header');
 if(!site||!hero||!stage||!selected||!header)return;
 let stops:number[]=[],frame=0,moving=false,dead=false,pointerHeld=false,externalUntil=0;
 let settleTimer:ReturnType<typeof setTimeout>|undefined,celebrationTimer:ReturnType<typeof setTimeout>|undefined,celebrated=false;
 let touch:{x:number;y:number;claimed:boolean;done:boolean}|null=null;
 const gesture=createWheelGesture();
 const layoutTop=(el:HTMLElement)=>{let y=0,node:HTMLElement|null=el;while(node){y+=node.offsetTop;node=node.offsetParent as HTMLElement|null;}return y;};
 const measure=()=>{stops=magneticStops(layoutTop(hero),Math.max(1,hero.offsetHeight-stage.offsetHeight),layoutTop(selected),header.offsetHeight);};
 const blocked=(target:EventTarget|null)=>{
  if(site.inert||site.dataset.inspection==='true'||document.querySelector('[role="dialog"][data-state="open"]'))return true;
  let el=target instanceof Element?target:null;
  if(el?.closest('input,textarea,select,[contenteditable="true"],[role="slider"]'))return true;
  while(el&&el!==document.body&&el!==document.documentElement){const style=getComputedStyle(el);if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+2)return true;el=el.parentElement;}
  return false;
 };
 const inRange=()=>window.scrollY>=stops[0]-2&&window.scrollY<=stops[2]+32;
 const entered=()=>Number(site.querySelector<HTMLElement>('.live-scene')?.dataset.entrance??1)>=.99;
 function stop(){cancelAnimationFrame(frame);clearTimeout(celebrationTimer);celebrationTimer=undefined;frame=0;moving=false;hero!.dataset.magnetic='idle';hero!.dataset.celebration='idle';hero!.dispatchEvent(new Event(CELEBRATION_STOP));}
 function celebrate(){
  celebrated=true;hero!.dataset.celebration='playing';hero!.dispatchEvent(new Event(CELEBRATION_START));
  celebrationTimer=setTimeout(()=>{celebrationTimer=undefined;if(dead||document.hidden||pointerHeld||touch||blocked(null)||Math.abs(window.scrollY-stops[1])>12)return;go(2);},CELEBRATION_DURATION);
 }
 function go(index:number){
  if(index<0||index>=stops.length||site?.dataset.inspection==='true')return;
  stop();const from=window.scrollY,to=stops[index],duration=index===1?1350:1200,started=performance.now();
  moving=true;hero!.dataset.magnetic='moving';hero!.dataset.magneticStep=String(index);
  const draw=(time:number)=>{
   if(dead)return;
   const p=Math.min(1,(time-started)/duration);
   // Instant positioning lets this one easing curve own the entire transition.
   window.scrollTo({top:from+(to-from)*smoothstep(0,1,p),behavior:'instant'});
   if(p<1)frame=requestAnimationFrame(draw);
   else{window.scrollTo({top:to,behavior:'instant'});frame=0;moving=false;hero!.dataset.magnetic='idle';if(index===0)celebrated=false;if(index===1&&from<to-8&&!celebrated)celebrate();}
  };
  frame=requestAnimationFrame(draw);
 }
 function wheel(e:WheelEvent){
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY||blocked(e.target))return;
  if(!moving&&!inRange())return;
  const now=performance.now();if(now<externalUntil)return;
  if(!entered()){if(e.cancelable)e.preventDefault();gesture.feed(e.deltaY,now,true);return;}
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),direction=Math.sign(delta);
  // Consume the tail even at the final stop, then release the next fresh gesture.
  if(moving||gesture.tail(now)){if(e.cancelable)e.preventDefault();gesture.feed(delta,now,moving);return;}
  const next=nextMagneticStop(stops,window.scrollY,direction);if(next<0)return;
  if(e.cancelable)e.preventDefault();
  const step=gesture.feed(delta,now);if(step)go(next);
 }
 function keyboard(e:KeyboardEvent){
  if(e.key==='Escape'){stop();gesture.reset();externalUntil=performance.now()+500;return;}
  if(['Home','End','Tab'].includes(e.key)){stop();gesture.reset();externalUntil=performance.now()+1000;return;}
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||blocked(e.target)||!inRange())return;
  if((e.target as Element)?.closest('button,a,canvas'))return;
  const direction=['ArrowDown','PageDown'].includes(e.key)?1:['ArrowUp','PageUp'].includes(e.key)?-1:e.key===' '?(e.shiftKey?-1:1):0;
  if(!direction)return;const next=nextMagneticStop(stops,window.scrollY,direction);if(!moving&&next<0)return;
  e.preventDefault();if(!moving&&!e.repeat&&entered())go(next);
 }
 function touchStart(e:TouchEvent){
  touch=null;if(e.touches.length!==1||blocked(e.target)||!inRange())return;
  touch={x:e.touches[0].clientX,y:e.touches[0].clientY,claimed:false,done:false};
 }
 function touchMove(e:TouchEvent){
  if(!touch||e.touches.length!==1){touch=null;return;}
  const dy=touch.y-e.touches[0].clientY,dx=touch.x-e.touches[0].clientX;
  if(!touch.claimed&&Math.abs(dx)>Math.abs(dy)+4){touch=null;return;}
  if(Math.abs(dy)<5&&!touch.claimed)return;
  if(!touch.claimed&&nextMagneticStop(stops,window.scrollY,Math.sign(dy))<0&&!moving){touch=null;return;}
  if(!e.cancelable){touch=null;return;}
  e.preventDefault();touch.claimed=true;
  if(!touch.done&&Math.abs(dy)>=24){touch.done=true;if(!moving&&entered())go(nextMagneticStop(stops,window.scrollY,Math.sign(dy)));}
 }
 function touchEnd(){touch=null;}
 function settle(){
  clearTimeout(settleTimer);settleTimer=setTimeout(()=>{
   if(dead||moving||pointerHeld||touch||document.hidden||blocked(null)||!inRange()||window.scrollY>stops[2]+8||!entered())return;
   if(performance.now()<externalUntil){settleTimer=setTimeout(settle,externalUntil-performance.now());return;}
   const index=stops.reduce((best,value,i)=>Math.abs(value-window.scrollY)<Math.abs(stops[best]-window.scrollY)?i:best,0);
   if(Math.abs(stops[index]-window.scrollY)>8)go(index);
  },180);
 }
 function down(e:PointerEvent){pointerHeld=true;if(e.pointerType!=='touch'){stop();gesture.reset();}}
 function up(){pointerHeld=false;settle();}
 function click(e:MouseEvent){
  const anchor=(e.target as Element)?.closest<HTMLAnchorElement>('a[href^="#"]');
  if(!anchor||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  stop();gesture.reset();const hash=anchor.getAttribute('href');
  if(hash==='#top'||hash==='#selected'){e.preventDefault();externalUntil=0;if(location.hash!==hash)history.pushState(null,'',hash);measure();go(hash==='#top'?0:2);}
  else externalUntil=performance.now()+1600;
 }
 function resize(){stop();gesture.reset();measure();externalUntil=performance.now()+350;settle();}
 function visibility(){if(document.hidden){stop();clearTimeout(settleTimer);touch=null;pointerHeld=false;}else{gesture.reset();measure();}}
 measure();hero.dataset.magnetic='idle';
 window.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',keyboard);
 window.addEventListener('touchstart',touchStart,{passive:true});window.addEventListener('touchmove',touchMove,{passive:false});window.addEventListener('touchend',touchEnd);window.addEventListener('touchcancel',touchEnd);
 window.addEventListener('scroll',settle,{passive:true});window.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);document.addEventListener('click',click,true);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
 return()=>{dead=true;stop();clearTimeout(settleTimer);delete hero.dataset.magnetic;delete hero.dataset.magneticStep;delete hero.dataset.celebration;window.removeEventListener('wheel',wheel);window.removeEventListener('keydown',keyboard);window.removeEventListener('touchstart',touchStart);window.removeEventListener('touchmove',touchMove);window.removeEventListener('touchend',touchEnd);window.removeEventListener('touchcancel',touchEnd);window.removeEventListener('scroll',settle);window.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);document.removeEventListener('click',click,true);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);};
 },[root,enabled]);}
