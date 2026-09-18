export type NoteRect={left:number;top:number;right:number;bottom:number};
type Point={x:number;y:number};
const overlap=(a:NoteRect,b:NoteRect)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const expand=(r:NoteRect,gap:number):NoteRect=>({left:r.left-gap,top:r.top-gap,right:r.right+gap,bottom:r.bottom+gap});
/** Follow the pointer through the empty space around the sculptures. */
export function placeObjectNote(point:Point,size:{width:number;height:number},viewport:{width:number;height:number},objects:NoteRect[],activeIndex:number){
 const margin=16,gap=viewport.width<=360?4:28,clearance=viewport.width<=360?4:12,cursorGap=48,w=size.width,h=size.height,active=objects[activeIndex]??{left:point.x,top:point.y,right:point.x,bottom:point.y};
 const clampX=(x:number)=>Math.max(margin,Math.min(viewport.width-w-margin,x));
 const clampY=(y:number)=>Math.max(margin,Math.min(viewport.height-h-margin,y));
 const right=Math.max(active.right+gap,point.x+cursorGap),left=Math.min(active.left-gap-w,point.x-cursorGap-w),above=Math.min(active.top-gap-h,point.y-cursorGap-h),below=Math.max(active.bottom+gap,point.y+cursorGap);
 const xs=[right,left,point.x-w/2,margin,viewport.width-w-margin];
 const ys=[point.y-h/2,above,below,margin,viewport.height-h-margin];
 // Edges of other objects give us usable gaps in a crowded or narrow viewport.
 for(const r of objects){xs.push(r.left-gap-w,r.right+gap);ys.push(r.top-gap-h,r.bottom+gap);}
 let best={x:clampX(right),y:clampY(point.y-h/2)},bestScore=Infinity;
 for(const xx of xs)for(const yy of ys){const x=clampX(xx),y=clampY(yy),rect={left:x,top:y,right:x+w,bottom:y+h};
  const dx=Math.max(x-point.x,0,point.x-x-w),dy=Math.max(y-point.y,0,point.y-y-h),distance=Math.hypot(dx,dy);
  const covered=objects.reduce((sum,r,i)=>sum+overlap(rect,expand(r,clearance))*(i===activeIndex?100:12),0);
  const cursorPenalty=Math.max(0,cursorGap-distance)**2*200;
  const score=covered+cursorPenalty+distance*.7+Math.hypot(x+w/2-point.x,y+h/2-point.y)*.08;
  if(score<bestScore){bestScore=score;best={x,y};}
 }
 return best;
}
