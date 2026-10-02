'use client';
import {useCallback,useEffect,useLayoutEffect,useState} from 'react';
const weights:Record<string,number>={models:48,renderer:18,fonts:5,stories:7,photos:7,audio:15};
export type LoadReporter=(part:string,value:number,error?:string)=>void;
export function useIntroLoading(){
 const [parts,setParts]=useState<Record<string,number>>({}),[failure,setFailure]=useState(''),[released,setReleased]=useState(false);
 const report=useCallback<LoadReporter>((part,value,error)=>{setParts(p=>p[part]===value?p:{...p,[part]:Math.max(0,Math.min(1,value))});if(error)setFailure(error);},[]);
 const progress=Math.min(100,Math.floor(Object.entries(weights).reduce((sum,[key,weight])=>sum+(parts[key]??0)*weight,0))),complete=progress===100&&!failure;
 // A fresh visit always reveals the object scene, even from an old section link.
 useLayoutEffect(()=>{
  const previous=history.scrollRestoration;
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
  window.scrollTo({top:0,left:0,behavior:'instant'});
  return()=>{history.scrollRestoration=previous;};
 },[]);
 useEffect(()=>{
  if(!complete)return;
  let frame=0;
  const timer=setTimeout(()=>{
   window.scrollTo({top:0,left:0,behavior:'instant'});
   // Let the scene settle at its opening position before removing the loader.
   frame=requestAnimationFrame(()=>setReleased(true));
  },350);
  return()=>{clearTimeout(timer);cancelAnimationFrame(frame);};
 },[complete]);
 useEffect(()=>{const previous=document.documentElement.style.overflow;if(!released)document.documentElement.style.overflow='hidden';return()=>{document.documentElement.style.overflow=previous;};},[released]);
 useEffect(()=>{let live=true;Promise.all([document.fonts.load('400 16px Pretendard'),document.fonts.load('650 32px Pretendard'),document.fonts.ready]).then(()=>{if(live)report('fonts',1);}).catch(()=>{if(live)report('fonts',1);});return()=>{live=false;};},[report]);
 return {progress,failure,released,report};
}
export async function preloadImages(urls:string[]){await Promise.all([...new Set(urls.filter(Boolean))].map(url=>new Promise<void>(resolve=>{const image=new Image();image.onload=()=>{void image.decode().catch(()=>{}).then(()=>resolve());};image.onerror=()=>resolve();image.src=url;})));}
