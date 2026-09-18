'use client';
import {useEffect,type RefObject} from 'react';
import {advanceSpring,clamp01,clearHeroProgress,heroProgress,publishHeroProgress,smoothstep} from './hero-progress';
export function useHeroJourney(root:RefObject<HTMLDivElement|null>,motion:boolean){useEffect(()=>{
 const site=root.current,hero=site?.querySelector<HTMLElement>('.hero'),stage=site?.querySelector<HTMLElement>('.hero-stage'),title=site?.querySelector<HTMLElement>('.hero-name'),brand=site?.querySelector<HTMLElement>('.site-header>.wordmark');
 if(!site||!hero||!stage||!title||!brand)return;
 let frame=0,lastTime=0,snap=true,dead=false;
 const progress={value:motion?heroProgress(hero,stage):0,velocity:0};
 const draw=(time:number)=>{
  frame=0;if(dead||document.hidden)return;
  const heroRect=hero.getBoundingClientRect(),target=motion?heroProgress(hero,stage):0,dt=Math.min(.064,Math.max(0,(time-(lastTime||time))/1000));lastTime=time;
  // Restored pages and off-screen jumps must never leave the next section blank.
  if(snap||!motion||hero.dataset.magnetic==='moving'||heroRect.bottom<=0||heroRect.top>=innerHeight){progress.value=target;progress.velocity=0;snap=false;}
  else advanceSpring(progress,target,dt);
  if(progress.value<0||progress.value>1){progress.value=clamp01(progress.value);progress.velocity=0;}
  const p=progress.value,t=smoothstep(.76,1,p),r=stage.getBoundingClientRect(),b=brand.getBoundingClientRect(),w=title.offsetWidth,h=title.offsetHeight,baseX=r.left+r.width/2,baseY=r.top+r.height/2,scale=1+(b.width/w-1)*t;
  site.style.setProperty('--journey',String(p));site.style.setProperty('--stories-visible',String(motion?smoothstep(.95,1,p):1));site.dataset.storiesReady=String(!motion||p>.95);site.style.setProperty('--header-surface',String(motion?smoothstep(.86,1,p):Number(heroRect.bottom<stage.offsetHeight*.3)));site.style.setProperty('--brand-visible',String(motion?smoothstep(.93,1,p):1));site.dataset.journey=p>.995?'stories':'home';
  title.style.transform=motion?`translate(${-w/2+(b.left-baseX+w/2)*t}px,${-h/2+(b.top-baseY+h/2)*t}px) scale(${scale})`:'translate(-50%,-50%)';title.style.opacity=motion?String(1-smoothstep(.97,1,p)):'1';
  publishHeroProgress(hero,p);
  if(progress.value!==target||progress.velocity!==0)frame=requestAnimationFrame(draw);
 };
 const wake=()=>{if(!frame&&!document.hidden){lastTime=performance.now();frame=requestAnimationFrame(draw);}};
 const synchronize=()=>{snap=true;lastTime=0;wake();};
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else synchronize();};
 const observer=new ResizeObserver(synchronize);observer.observe(hero);observer.observe(stage);observer.observe(title);
 window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',synchronize);window.addEventListener('pageshow',synchronize);document.addEventListener('visibilitychange',visibility);
 document.fonts.ready.then(()=>{if(!dead)synchronize();});wake();
 return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',wake);window.removeEventListener('resize',synchronize);window.removeEventListener('pageshow',synchronize);document.removeEventListener('visibilitychange',visibility);clearHeroProgress(hero);title.style.removeProperty('transform');title.style.removeProperty('opacity');site.style.removeProperty('--brand-visible');};
 },[root,motion]);}
