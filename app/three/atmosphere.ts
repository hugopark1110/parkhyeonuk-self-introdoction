import type {Pose,CatModel} from './sculpture';
import {screenAnchor} from './sculpture';
import type {Placement} from './dynamics';
export const overlayVertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
export const smokeFragment=`varying vec2 vUv;uniform float uTime;uniform float uAge;uniform float uNight;
void main(){float y=vUv.y;float bend=.10*sin(y*8.-uTime*1.2)*y+.07*sin(y*15.+uTime*.9)*y*y;float w=.012+y*.070;float x=vUv.x-.5-bend;float ribbon=exp(-pow(x/w,2.));float secondary=exp(-pow((x-.035*sin(y*19.+uTime))/(w*.55),2.))*.24;float travel=smoothstep(0.,.35,uAge)*(1.-smoothstep(2.2,3.2,uAge));float head=1.-smoothstep(min(1.,uAge*.65),min(1.,uAge*.65)+.12,y);float fade=smoothstep(0.,.05,y)*(1.-smoothstep(.62,1.,y));float a=(ribbon+secondary)*fade*travel*head*.25;gl_FragColor=vec4(mix(vec3(.40,.39,.37),vec3(.8,.75,.66),uNight),a);}`;
export const heatFragment=`varying vec2 vUv;uniform sampler2D uScene;uniform vec2 uTip;uniform vec2 uSize;uniform float uTime;uniform float uStrength;
void main(){vec2 p=(vUv-uTip)/uSize;float region=exp(-p.x*p.x*8.)*smoothstep(0.,.12,p.y)*(1.-smoothstep(.6,1.,p.y));vec2 uv=vUv;uv.x+=sin(p.y*24.-uTime*5.)*.0016*region*uStrength;uv.y+=sin(p.y*17.-uTime*4.+p.x)*.0007*region*uStrength;vec4 sampleColor=texture2D(uScene,uv);gl_FragColor=vec4(sampleColor.rgb/max(sampleColor.a,.0001),sampleColor.a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
gl_FragColor.rgb*=gl_FragColor.a;
}`;
/** Matching low-cost ribbon and smoke treatment for the software renderer. */
export function paintAtmosphere(ctx:CanvasRenderingContext2D,width:number,height:number,pose:Pose,poses:Placement[],models:CatModel[],foreground:boolean){
 const ratio=ctx.canvas.width/width,t=pose.motion?pose.time:0;

 if(foreground&&!pose.candle&&pose.candleOut!==undefined&&pose.motion){const age=pose.time-pose.candleOut;if(age<0||age>3.2)return;const m=models[3],v=screenAnchor(width,height,poses[3],m.candleTip),h=m.height*v.scale*.26;ctx.save();ctx.scale(ratio,ratio);const alpha=Math.sin(Math.min(1,age/.4)*Math.PI/2)*Math.max(0,1-age/3.2);for(let j=0;j<3;j++){ctx.beginPath();for(let k=0;k<=32;k++){const u=k/32*Math.min(1,age*.7),x=v.x+Math.sin(u*8-t*1.2+j*.35)*u*h*.11,y=v.y-u*h;if(k)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.strokeStyle=`rgba(105,101,95,${alpha*(.12-j*.025)})`;ctx.lineWidth=1.7+j*1.2;ctx.shadowColor='#8f8a8144';ctx.shadowBlur=3;ctx.stroke();}ctx.shadowBlur=5;ctx.shadowColor='#ec5b1c';ctx.fillStyle=`rgba(234,86,22,${Math.max(0,1-age/1.7)})`;ctx.beginPath();ctx.arc(v.x,v.y,Math.max(.7,h*.014),0,Math.PI*2);ctx.fill();ctx.restore();}
}
