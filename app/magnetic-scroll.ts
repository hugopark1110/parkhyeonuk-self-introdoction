/** Small deliberate gestures advance once; trackpad momentum never queues steps. */
export function createWheelGesture(threshold=20,quietTime=210){
 let last=-Infinity,total=0,consumed=false;
 return {
  feed(delta:number,time:number,locked=false){
   if(time-last>quietTime){total=0;consumed=false;}
   last=time;
   if(locked){consumed=true;return 0;}
   if(consumed)return 0;
   if(Math.sign(total)!==Math.sign(delta))total=0;
   total+=delta;if(Math.abs(total)<threshold)return 0;
   consumed=true;return Math.sign(total);
  },
  tail(time:number){return consumed&&time-last<=quietTime;},
  reset(){last=-Infinity;total=0;consumed=false;}
 };
}
export function nextMagneticStop(stops:number[],position:number,direction:number){
 const tolerance=8;
 if(direction>0)return stops.findIndex(stop=>stop>position+tolerance);
 for(let i=stops.length-1;i>=0;i--)if(stops[i]<position-tolerance)return i;
 return -1;
}
export function magneticStops(top:number,span:number,selectedTop:number,headerHeight:number){
 return [top,top+span*.73,Math.max(top+span+2,selectedTop-headerHeight-24)];
}
