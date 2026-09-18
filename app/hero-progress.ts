/** One scroll timeline shared by typography and the 3D stage. */
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
// Zero velocity and acceleration at both ends.
export const smoothstep=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
export type Spring={value:number;velocity:number};
/** Exact critically damped spring: frame-rate independent, without bouncing. */
export function advanceSpring(state:Spring,target:number,dt:number,frequency=13){
 dt=Math.max(0,dt);const offset=state.value-target,c=state.velocity+frequency*offset,decay=Math.exp(-frequency*dt);
 state.value=target+(offset+c*dt)*decay;state.velocity=(state.velocity-frequency*c*dt)*decay;
 if(Math.abs(state.value-target)<.00001&&Math.abs(state.velocity)<.0001){state.value=target;state.velocity=0;}
 return state.value;
}
const journeys=new WeakMap<HTMLElement,number>();
export const HERO_MOTION_EVENT='hero-motion';
export function publishHeroProgress(hero:HTMLElement,progress:number){journeys.set(hero,progress);hero.dispatchEvent(new Event(HERO_MOTION_EVENT));}
export function clearHeroProgress(hero:HTMLElement){journeys.delete(hero);}
export function sharedHeroProgress(hero:HTMLElement,stage:HTMLElement){return journeys.get(hero)??heroProgress(hero,stage);}
export function heroProgress(hero:HTMLElement,stage:HTMLElement){return clamp01(-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight-stage.offsetHeight));}
