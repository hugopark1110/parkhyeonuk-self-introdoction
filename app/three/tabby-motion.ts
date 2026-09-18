import {seatedTabby} from './tabby-seat';
import type {CatModel,Pose} from './sculpture';
import {smoothstep} from '../hero-progress';
type Sneeze={pitch:number;squash:number;eye:number;mouth:number};
const fields=new WeakMap<CatModel,Float32Array>();
/** Anatomical blend fields deform the supplied continuous mesh without hard seams. */
export function animateTabby(cat:CatModel,pose:Pose,sneeze?:Sneeze){
 if(!cat.basePositions||!cat.baseNormals)return;
 const base=cat.basePositions,normal=cat.baseNormals,center=cat.center??[0,0,0],head=cat.anchors?.Head_Pivot??[0,.45,1.63];
 cat.positions.set(base);cat.normals.set(normal);if(!pose.motion&&!(pose.paperReveal??0))return;
 const seat=seatedTabby(cat),sit=pose.catSit??(pose.paperReveal??0);
 let weights=fields.get(cat);
 if(!weights){weights=new Float32Array(base.length/3*5);for(let i=0;i<base.length/3;i++){
  const x=base[i*3]+center[0],y=base[i*3+1]+center[1],z=base[i*3+2]+center[2];
  weights[i*5]=smoothstep(1.68,2.05,y)*smoothstep(1.10,1.64,z);
  weights[i*5+1]=smoothstep(.35,1.25,y)*(1-smoothstep(1.65,2.1,y));
  weights[i*5+2]=(1-smoothstep(-1.8,-.65,z))*smoothstep(1.05,1.5,y);
  weights[i*5+3]=smoothstep(.04,.17,x)*smoothstep(.65,1.03,z)*(1-smoothstep(.90,1.38,y));
  const eye=cat.anchors?.[x<0?'Eye_Pivot_L':'Eye_Pivot_R'];if(eye){const dx=(base[i*3]-eye[0])/.13,dy=(base[i*3+1]-eye[1])/.13,dz=(base[i*3+2]-eye[2])/.13;weights[i*5+4]=Math.exp(-(dx*dx+dy*dy+dz*dz)*2.5);}
 }fields.set(cat,weights);}
 const age=pose.time-pose.events[4],recovery=age<3.05?smoothstep(2.7,3.05,age):1;
 const yaw=(pose.motion?pose.catLookX??0:0)*.11*recovery,pitch=sneeze?sneeze.pitch*.8:-(pose.motion?pose.catLookY??0:0)*.055*recovery,roll=pose.motion?(pose.catAttention??0)*-.025+Math.sin(pose.time*.62)*.009:0;
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll),crouch=sneeze?(sneeze.squash-1)*.48:0,breath=pose.motion?Math.sin(pose.time*1.7)*.006:0,tail=pose.motion?Math.sin(pose.time*.85)*.10*(1-sit*.75):0,reveal=pose.paperReveal??0;
 const pawAngle=-reveal*.20,pawC=Math.cos(pawAngle),pawS=Math.sin(pawAngle),paw=cat.anchors?.Shoulder_Pivot_R??[.31-center[0],1.42-center[1],1.15-center[2]];
 const elbow=[.31-center[0],.78-center[1],1.28-center[2]],elbowAngle=-reveal*.95,elbowC=Math.cos(elbowAngle),elbowS=Math.sin(elbowAngle);
 const blinkCycle=(pose.time+1.2)%6.1,blink=blinkCycle<.20?Math.sin(blinkCycle/.20*Math.PI)**2:0,eyeClose=pose.motion?(sneeze?1-sneeze.eye:blink*.82):0;
 let pawTop=-Infinity;
 for(let i=0;i<base.length/3;i++){
  const k=i*3,j=i*5,hw=weights[j],bw=weights[j+1],tw=weights[j+2],pw=weights[j+3],ew=weights[j+4];let x=base[k]+(seat.positions[k]-base[k])*sit,y=base[k+1]+(seat.positions[k+1]-base[k+1])*sit,z=base[k+2]+(seat.positions[k+2]-base[k+2])*sit,nx=normal[k]+(seat.normals[k]-normal[k])*sit,ny=normal[k+1]+(seat.normals[k+1]-normal[k+1])*sit,nz=normal[k+2]+(seat.normals[k+2]-normal[k+2])*sit;
  if(ew>.001&&eyeClose>0){const eye=cat.anchors?.[x<0?'Eye_Pivot_L':'Eye_Pivot_R'];if(eye){const scale=1-eyeClose*ew*.84;y=eye[1]+(y-eye[1])*scale;ny/=scale;}}
  if(hw>.001){const px=x-head[0],py=y-head[1],pz=z-head[2],xx=px*cy+pz*sy,zz=-px*sy+pz*cy,yy=py*cp-zz*sp;
   x+=(head[0]+xx*cr-yy*sr-x)*hw;y+=(head[1]+xx*sr+yy*cr+crouch-y)*hw;z+=(head[2]+py*sp+zz*cp-z)*hw;
   const a=nx*cy+nz*sy,b=-nx*sy+nz*cy,c=ny*cp-b*sp;nx+=(a*cr-c*sr-nx)*hw;ny+=(a*sr+c*cr-ny)*hw;nz+=(normal[k+1]*sp+b*cp-nz)*hw;
  }
  y+=(breath+crouch*.38)*bw;x+=tail*tw;
  if(pw>.001&&reveal>.001){
   const bend=1-smoothstep(.60,1.03,base[k+1]+center[1]),ey=y-elbow[1],ez=z-elbow[2],foreY=elbow[1]+ey*elbowC-ez*elbowS,foreZ=elbow[2]+ey*elbowS+ez*elbowC;
   y+=(foreY-y)*bend*pw;z+=(foreZ-z)*bend*pw;const eny=ny*elbowC-nz*elbowS;nz+=(ny*elbowS+nz*elbowC-nz)*bend*pw;ny+=(eny-ny)*bend*pw;
   const py=y-paw[1],pz=z-paw[2];y+=(paw[1]+py*pawC-pz*pawS-y+reveal*.08)*pw;z+=(paw[2]+py*pawS+pz*pawC-z)*pw;const nY=ny*pawC-nz*pawS;nz+=(ny*pawS+nz*pawC-nz)*pw;ny+=(nY-ny)*pw;}
  if(base[k]+center[0]>.12&&base[k+1]+center[1]<.28&&base[k+2]+center[2]>1.25)pawTop=Math.max(pawTop,y);
  cat.positions[k]=x;cat.positions[k+1]=y;cat.positions[k+2]=z;const length=Math.hypot(nx,ny,nz)||1;cat.normals[k]=nx/length;cat.normals[k+1]=ny/length;cat.normals[k+2]=nz/length;
 }
 const foot=cat.anchors?.Frontpaw_Pivot_R??[.31-center[0],.13-center[1],1.42-center[2]];
 const footY=elbow[1]+(foot[1]-elbow[1])*elbowC-(foot[2]-elbow[2])*elbowS,footZ=elbow[2]+(foot[1]-elbow[1])*elbowS+(foot[2]-elbow[2])*elbowC;
 cat.paperSupport=[foot[0],pawTop,paw[2]+(footY-paw[1])*pawS+(footZ-paw[2])*pawC+.10];
}
