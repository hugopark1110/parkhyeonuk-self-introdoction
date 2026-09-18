import type {CatModel} from './sculpture';
// Cubic spatial masks keep the connected mesh soft around the hip and shoulder.
const blend=(a:number,b:number,v:number)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
const cache=new WeakMap<CatModel,{positions:Float32Array;normals:Float32Array}>();
function seatedPoint(x:number,y:number,z:number){
 const rear=1-blend(.65,1.4,z),c=Math.cos(-.65),s=Math.sin(-.65);
 let yy=1.6+(y-1.6)*c-(z-1.15)*s,zz=1.15+(y-1.6)*s+(z-1.15)*c;
 const hipY=1.6-.15*c+1.45*s,hipZ=1.15-.15*s-1.45*c,tc=Math.cos(-1.10),ts=Math.sin(-1.10);
 const thighY=hipY+(y-1.45)*tc-(z+.3)*ts,thighZ=hipZ+(y-1.45)*ts+(z+.3)*tc;
 const kneeY=hipY-.45*tc+.05*ts,kneeZ=hipZ-.45*ts-.05*tc,sc=Math.cos(.90),ss=Math.sin(.90);
 const shinY=kneeY+((y-1)*sc-(z+.35)*ss)*.65,shinZ=kneeZ+((y-1)*ss+(z+.35)*sc)*.65;
 const lower=1-blend(.75,1.1,y),foot=1-blend(.22,.5,y),leg=(1-blend(1.18,1.62,y))*(1-blend(-.12,.28,z));
 const legY=(thighY*(1-lower)+shinY*lower)*(1-foot)+y*foot,legZ=(thighZ*(1-lower)+shinZ*lower)*(1-foot)+(z+.60)*foot;
 yy+=(legY-yy)*leg;zz+=(legZ-zz)*leg;
 let xx=x*(1+.20*rear*(1-blend(1.1,1.5,y)));
 const tail=1-blend(-.8,-.58,z),extent=Math.max(0,-z-.58);yy+=(.53-.30*blend(0,1.7,extent)+(y-1.62)-yy)*tail;xx+=tail*.25*blend(0,1.7,extent);
 return [xx,y+(yy-y)*rear,z+(zz-z)*rear];
}
/** Bake the seated pose once. Transport authored normals through the local Jacobian. */
export function seatedTabby(cat:CatModel){
 const previous=cache.get(cat);if(previous)return previous;
 const base=cat.basePositions??cat.positions,normal=cat.baseNormals??cat.normals,center=cat.center??[0,1.4,0],positions=new Float32Array(base.length),normals=new Float32Array(base.length),eps=.0001;
 for(let i=0;i<base.length;i+=3){
  const x=base[i]+center[0],y=base[i+1]+center[1],z=base[i+2]+center[2],q=seatedPoint(x,y,z);
  positions.set(q.map((v,k)=>v-center[k]),i);
  const a=seatedPoint(x+eps,y,z).map((v,k)=>(v-q[k])/eps),b=seatedPoint(x,y+eps,z).map((v,k)=>(v-q[k])/eps),c=seatedPoint(x,y,z+eps).map((v,k)=>(v-q[k])/eps);
  const nx=normal[i],ny=normal[i+1],nz=normal[i+2];
  const n=[(b[1]*c[2]-b[2]*c[1])*nx+(c[1]*a[2]-c[2]*a[1])*ny+(a[1]*b[2]-a[2]*b[1])*nz,(b[2]*c[0]-b[0]*c[2])*nx+(c[2]*a[0]-c[0]*a[2])*ny+(a[2]*b[0]-a[0]*b[2])*nz,(b[0]*c[1]-b[1]*c[0])*nx+(c[0]*a[1]-c[1]*a[0])*ny+(a[0]*b[1]-a[1]*b[0])*nz],length=Math.hypot(...n)||1;
  normals.set(n.map(v=>v/length),i);
 }
 const result={positions,normals};cache.set(cat,result);return result;
}
