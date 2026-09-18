'use client';
import {useEffect,useRef} from 'react';
import {CELEBRATION_START,CELEBRATION_STOP,CELEBRATION_DURATION,celebrationBursts} from './celebration';
const random=(n:number)=>{const x=Math.sin(n*127.1+91.7)*43758.5453;return x-Math.floor(x);};
const palette=['#e6a500','#f25638','#375bea','#7da825','#b14de0','#ed4584','#029da6'];
/** A two-second, full-stage burst of fireworks and tumbling paper; the name stays in front. */
export default function NameCelebration({onPop}:{onPop:(pan:number)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),pop=useRef(onPop);pop.current=onPop;
 useEffect(()=>{
  const el=canvas.current,hero=el?.closest('section');if(!el||!hero)return;
  const ctx=el.getContext('2d');if(!ctx)return;
  let frame=0,start=0,width=1,height=1,dead=false;const played=new Set<number>();
  const resize=()=>{const r=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.7);width=r.width;height=r.height;el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
  const clear=()=>{cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,width,height);el.dataset.active='false';};
  function draw(now:number){
   if(dead)return;const age=(now-start)/1000,fade=Math.min(1,Math.max(0,(CELEBRATION_DURATION/1000-age)/.26));ctx!.clearRect(0,0,width,height);
   const compact=width<640,size=Math.min(width,height)*(compact?.40:.40);
   celebrationBursts.forEach((burst,index)=>{
    const x=burst.x*width,y=burst.y*height,t=age-burst.at;
    if(t<0&&t>-.4){const p=(t+.4)/.4,py=height*.95+(y-height*.95)*(1-(1-p)**2);ctx!.strokeStyle=burst.color;ctx!.globalAlpha=p*.6;ctx!.lineWidth=1.5;ctx!.beginPath();ctx!.moveTo(x,py+Math.min(45,(height*.95-y)*.12));ctx!.lineTo(x,py);ctx!.stroke();}
    if(t<0||t>1.6)return;
    if(!played.has(index)){played.add(index);pop.current((burst.x-.5)*1.4);}
    if(t<.22){ctx!.globalAlpha=(1-t/.22)*.18*fade;ctx!.strokeStyle=burst.color;ctx!.lineWidth=.7;ctx!.beginPath();ctx!.arc(x,y,size*t*2.8,0,Math.PI*2);ctx!.stroke();}
    for(let k=0;k<(compact?110:180);k++){
     const seed=index*191+k,angle=k*2.399963,speed=size*(.7+random(seed)*.85),drag=(1-Math.exp(-t*1.5))/1.5,tail=(1-Math.exp(-Math.max(0,t-.18)*1.5))/1.5;
     const depth=.6+random(seed+15)*.65,vx=Math.cos(angle)*speed*depth,vy=Math.sin(angle)*speed,px=x+vx*drag,py=y+vy*drag+34*t*t;
     const alpha=Math.max(0,1-t/1.6)**1.15*fade*(.82+.18*random(seed+61));ctx!.globalAlpha=alpha;ctx!.strokeStyle=k%8===0?'#c5a252':burst.color;ctx!.lineWidth=(k%5===0?3.4:1.9)*depth;ctx!.lineCap='round';ctx!.beginPath();ctx!.moveTo(x+vx*tail,y+vy*tail+34*Math.max(0,t-.18)**2);ctx!.lineTo(px,py);ctx!.stroke();
     if(k%7===0){ctx!.globalAlpha=alpha*(.55+.45*Math.sin(t*23+seed)**2);ctx!.fillStyle=burst.color;ctx!.beginPath();ctx!.arc(px,py,1.4*depth,0,Math.PI*2);ctx!.fill();}
    }
   });
   for(let k=0;k<(width<640?230:440);k++){
    const side=k%2===0?-1:1,delay=.02+random(k+50)*.64,t=age-delay;if(t<0)continue;
    const sx=width*(side<0?.09:.91),sy=height*.83,vx=-side*width*(.17+random(k+4)*.38),vy=-height*(.63+random(k+8)*.49),drag=(1-Math.exp(-t*.68))/.68;
    const x=sx+vx*drag+Math.sin(t*3+k)*6,y=sy+vy*drag+height*.23*t*t,depth=.6+random(k+90)*.65;
    ctx!.save();ctx!.translate(x,y);ctx!.rotate(k+t*(side*2+random(k)));ctx!.scale(Math.cos(t*7+k)*.75+.25,1);ctx!.globalAlpha=Math.min(1,t*5)*fade*.96;ctx!.fillStyle=palette[k%palette.length];
    if(k%5===0){ctx!.strokeStyle=palette[k%palette.length];ctx!.lineWidth=1.5;ctx!.beginPath();ctx!.moveTo(-3,-9);ctx!.bezierCurveTo(8,-3,-8,3,3,9);ctx!.stroke();}else ctx!.fillRect(-4*depth,-7*depth,8*depth,14*depth);ctx!.restore();
   }
   ctx!.globalAlpha=1;if(age<CELEBRATION_DURATION/1000)frame=requestAnimationFrame(draw);else clear();
  }
  const begin=()=>{clear();resize();played.clear();start=performance.now();el.dataset.active='true';frame=requestAnimationFrame(draw);};
  hero.addEventListener(CELEBRATION_START,begin);hero.addEventListener(CELEBRATION_STOP,clear);window.addEventListener('resize',clear);
  return()=>{dead=true;clear();hero.removeEventListener(CELEBRATION_START,begin);hero.removeEventListener(CELEBRATION_STOP,clear);window.removeEventListener('resize',clear);};
 },[]);
 return <canvas ref={canvas} className="name-celebration" aria-hidden="true" data-active="false"/>;
}
