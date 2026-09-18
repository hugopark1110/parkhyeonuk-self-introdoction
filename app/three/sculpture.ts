import {smoothstep} from '../hero-progress';
import type {Texture} from 'three';
/** Original 3D objects, shared by the physical and software renderers. */
export type Pose={time:number;pointerX:number;pointerY:number;dragX:number;dragY:number;progress:number;motion:boolean;events:number[];delta:number;focus:number;candle:boolean;candleOut?:number;catLookX?:number;catLookY?:number;catAttention?:number;catSit?:number;paperReveal?:number;entrance?:number;inspect?:number[];inspectRotation?:[number,number];inspectionNoteHeight?:number};
export type CatModel={paperSupport?:number[];variant?:'tabby';uvs?:Float32Array;textures?:{material:number;map:Texture;normalMap?:Texture}[];positions:Float32Array;normals:Float32Array;colors?:Float32Array;indices:Uint32Array;groups:{start:number;count:number;material:number}[];height:number;width?:number;parts?:{name:string;start:number;count:number}[];center?:number[];candleTip?:number[];anchors?:Record<string,number[]>;basePositions?:Float32Array;baseNormals?:Float32Array;liquid?:{start:number;count:number;surfaceCount:number;bottom:number;level:number;width:number;depth:number;centerX:number;centerZ:number;maxSlope:number}};
export const OBJECTS=['camera','block','perfume','cake','cat'] as const;
const models=new Map<string,Promise<CatModel>>();
async function load(name:string){let pending=models.get(name);if(!pending){pending=fetch('/models/'+name+'.bin').then(async response=>{if(!response.ok)throw Error('Could not load sculpture');const buffer=await response.arrayBuffer(),h=new Uint32Array(buffer,0,4);if(h[0]!==0x43415433)throw Error('Invalid mesh');const [nv,ni,ng]=[h[1],h[2],h[3]],header=16+ng*12,g=new Uint32Array(buffer,16,ng*3),positions=new Float32Array(buffer,header,nv*3),normals=new Float32Array(buffer,header+nv*12,nv*3),original=new Uint32Array(buffer,header+nv*24,ni);let minY=Infinity,maxY=-Infinity;for(let i=1;i<positions.length;i+=3){minY=Math.min(minY,positions[i]);maxY=Math.max(maxY,positions[i]);}const center=(maxY+minY)/2;for(let i=1;i<positions.length;i+=3)positions[i]-=center;
 const buckets=new Map<number,number[]>();for(let i=0;i<ng;i++){const [start,count,material]=[g[i*3],g[i*3+1],g[i*3+2]];let b=buckets.get(material);if(!b){b=[];buckets.set(material,b);}for(let j=start;j<start+count;j++)b.push(original[j]);}const indices=new Uint32Array(ni),groups=[];let cursor=0;for(const [material,b] of buckets){indices.set(b,cursor);groups.push({start:cursor,count:b.length,material});cursor+=b.length;}return {positions,normals,indices,groups,height:maxY-minY};}).catch(error=>{models.delete(name);throw error;});models.set(name,pending);}return pending;}
export async function loadModels(compact:boolean,onProgress?:(value:number)=>void){const {loadSculptedAsset}=await import('./asset-loader');let done=0;return Promise.all([...OBJECTS.map(name=>['cat','cake','perfume','camera'].includes(name)?loadSculptedAsset(name==='cat'?'cat-tabby':name):load(name)),loadSculptedAsset('origami-cat')].map(p=>p.then(model=>{onProgress?.(++done/6);return model;})));}
export function rotation(x:number,y:number,z:number){const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);return [cy*cz,sx*sy*cz-cx*sz,cx*sy*cz+sx*sz,cy*sz,sx*sy*sz+cx*cz,cx*sy*sz-sx*cz,-sy,sx*cy,cx*cy];}
const desktop=[[.205,.265,.21,.14,-.25,-.22],[.515,.185,.145,.38,-.53,.10],[.805,.275,.285,.08,-.18,.12],[.205,.715,.19,.32,.36,-.12],[.79,.76,.315,.04,-.04,-.01]];
const radii=new WeakMap<CatModel,number>();
export function modelRadius(model:CatModel){let radius=radii.get(model);if(radius!==undefined)return radius;radius=0;const p=model.basePositions??model.positions;for(let k=0;k<p.length;k+=3)radius=Math.max(radius,Math.hypot(p[k],p[k+1],p[k+2]));radius*=1.04;radii.set(model,radius);return radius;}
const mobile=[[.26,.235,.112,.13,-.3,-.20],[.63,.17,.08,.40,-.5,.1],[.82,.315,.17,.08,-.16,.12],[.27,.68,.10,.28,.28,-.13],[.705,.70,.225,.04,-.04,-.01]];
export function arrangement(width:number,height:number,pose:Pose,models:CatModel[]){const compact=width/height<.85,layout=compact?mobile:desktop,viewH=2*Math.tan(17*Math.PI/180)*8,viewW=viewH*width/height;return layout.map((v,i)=>{const t=pose.motion?pose.time:0,p=pose.motion?pose.progress:0,phase=i*1.72;const px=pose.motion?pose.pointerX:0,py=pose.motion?pose.pointerY:0;
 const entrance=pose.motion?smoothstep(i*.045,.78+i*.045,pose.entrance??1):1,gather=pose.motion?smoothstep(.12+i*.012,.67+i*.012,p):0,spread=entrance*(1-gather);
 const xRatio=.5+(v[0]-.5)*spread,yRatio=.5+(v[1]-.5)*spread;
 let x=(xRatio-.5)*viewW+px*(.05+i*.018)*spread,y=(.5-yRatio)*viewH+(Math.sin(t*.62+phase)*.045-py*.08)*spread;
 let rx=v[3]+Math.sin(t*.34+phase)*.035*spread+py*.12+pose.dragY*.22+(1-spread)*.30,ry=(i===4&&models[i].variant==='tabby'?0:v[4])+Math.sin(t*.24+phase)*.07*spread+px*.20+pose.dragX*(i===4?1:.55)+(1-spread)*(i%2===0?.5:-.5),rz=v[5]*spread+Math.sin(t*.3+phase)*.018*spread;
 const age=pose.time-pose.events[i];let bounce=1;if(pose.motion&&age>=0){if(i===0&&age<.4)bounce=1-.025*Math.sin(age/.4*Math.PI)**2;if(i===1&&age<.65){bounce=1+.12*Math.sin(age/.65*Math.PI)**2;ry+=Math.sin(age/.65*Math.PI)**2*.3;}}let scale=v[2]*viewH/models[i].height*(compact?Math.min(1,width/height/.46):1)*Math.max(.0001,Math.pow(spread,.82))*bounce,z=-1.2*(1-spread);
 const inspect=pose.inspect?.[i]??0,other=Math.max(0,...(pose.inspect??[]).filter((_,j)=>j!==i));
 if(inspect>0){
  const angles=[[.08,-.08,0],[.35,-.48,.02],[.02,-.08,0],[.25,.12,0],[0,0,0]][i],orbit=pose.inspectRotation??[0,0];
  rx+=(angles[0]+orbit[0]-rx)*inspect;ry+=(angles[1]+orbit[1]-ry)*inspect;rz+=(angles[2]-rz)*inspect;
  // One fixed enclosing sphere: all 360° views retain the same scale and pivot.
  const stacked=width<700||(width<900&&height>=600),panelWidth=Math.min(360,Math.max(280,width*.26)),noteHeight=pose.inspectionNoteHeight??240;
  const areaWidth=stacked?width-40:width-panelWidth-112,areaTop=stacked?74:80,areaBottom=stacked?height-noteHeight-48:height-52,areaHeight=Math.max(100,areaBottom-areaTop);
  const centerX=stacked?width*.5:32+areaWidth*.5,centerY=areaTop+areaHeight*.5,radiusPixels=Math.max(40,Math.min(areaWidth,areaHeight)*.43),f=height/(2*Math.tan(17*Math.PI/180)),q=radiusPixels/f;
  const targetScale=8*q/Math.sqrt(1+q*q)/modelRadius(models[i]),targetX=(centerX/width-.5)*viewW,targetY=(.5-centerY/height)*viewH;
  scale+=(targetScale-scale)*inspect;x+=(targetX-x)*inspect;y+=(targetY-y)*inspect;

 }
 scale*=1-other*.96*(1-inspect);
 return {x,y,z,scale,rx,ry,rz,visibility:spread*(1-other*(1-inspect)),matrix:rotation(rx,ry,rz)};});}

export function paperPlacement(cat:ReturnType<typeof arrangement>[number],catModel:CatModel,paper:CatModel,reveal:number,time:number,motion:boolean){
 const lift=Math.max(0,Math.min(1,reveal)),paperHeight=catModel.height*.23*lift,support=catModel.paperSupport;
 // The paper's lowest vertex stays above the animated paw for the entire handoff.
 const local=support?[support[0],support[1]+.03+paperHeight*.5,support[2]]:[catModel.height*.05,catModel.height*(-.22+.07*lift),catModel.height*.25],r=cat.matrix;
 const x=cat.x+(r[0]*local[0]+r[1]*local[1]+r[2]*local[2])*cat.scale,y=cat.y+(r[3]*local[0]+r[4]*local[1]+r[5]*local[2])*cat.scale,z=cat.z+(r[6]*local[0]+r[7]*local[1]+r[8]*local[2])*cat.scale;
 return {x,y,z,scale:cat.scale*paperHeight/paper.height,rx:cat.rx,ry:cat.ry,rz:cat.rz,visibility:cat.visibility*lift,matrix:cat.matrix};
}


export function screenAnchor(width:number,height:number,p:ReturnType<typeof arrangement>[number],local=[0,0,0]){const r=p.matrix,x=p.x+(r[0]*local[0]+r[1]*local[1]+r[2]*local[2])*p.scale,y=p.y+(r[3]*local[0]+r[4]*local[1]+r[5]*local[2])*p.scale,z=p.z+(r[6]*local[0]+r[7]*local[1]+r[8]*local[2])*p.scale,f=height/(2*Math.tan(17*Math.PI/180));return {x:width/2+x*f/(8-z),y:height/2-y*f/(8-z),scale:f/(8-z)*p.scale};}
