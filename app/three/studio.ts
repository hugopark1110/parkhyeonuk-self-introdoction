/** An HDR photographic studio made entirely from analytic light panels. */
export function studio(x:number,y:number,z:number):[number,number,number]{
 const phi=Math.atan2(x,z),theta=Math.asin(Math.max(-1,Math.min(1,y)));
 const panel=(cx:number,cy:number,w:number,h:number,power:number)=>{let dx=Math.abs(phi-cx);dx=Math.min(dx,Math.PI*2-dx);return Math.exp(-Math.pow(dx/w,4)-Math.pow((theta-cy)/h,4))*power;};
 const key=panel(.63,.55,.52,.79,2.7),front=panel(-.28,.08,.84,.95,1.05),strip=panel(-1.05,.2,.17,.9,1.8),top=panel(0,1.25,1.7,.24,1.65),back=panel(-2.4,.32,.6,.7,.65);
 const floor=.16+Math.max(0,-y)*.20,neutral=front+top+back;
 return [floor+neutral+key+strip*.92,floor*1.02+neutral+key*.95+strip*.98,floor*1.06+neutral+key*.84+strip*1.08];
}
export function displayColor(value:number){const x=Math.max(0,value);const a=Math.min(1,(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14));return Math.round(255*(a<=.0031308?a*12.92:1.055*Math.pow(a,1/2.4)-.055));}
const linear=(hex:number)=>[(hex>>16)&255,(hex>>8)&255,hex&255].map(v=>{const c=v/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);});
export type StudioMaterial={hex:number;metal:number;rough:number;glass?:boolean;opacity?:number;transmission?:number;color:number[];kind?:'soft'|'plush'|'lens'|'grip';coat?:number;ior?:number;doubleSided?:boolean};
export const materials:StudioMaterial[]=[
 {hex:0xdce2e8,metal:1,rough:.14}, {hex:0xbac968,metal:.85,rough:.13}, {hex:0x151a21,metal:.7,rough:.2},
 {hex:0x24282d,metal:.32,rough:.36},{hex:0x152d43,metal:.84,rough:.06},{hex:0xfff9ee,metal:0,rough:.35},
 {hex:0xe8b885,metal:0,rough:.48},{hex:0xdb3447,metal:.08,rough:.26},{hex:0x426d2e,metal:0,rough:.45},
 {hex:0xd8e8e5,metal:.1,rough:.08,glass:true},{hex:0xb6914c,metal:.78,rough:.2},
 {hex:0x6d9444,metal:0,rough:.7},{hex:0x52833a,metal:0,rough:.7},{hex:0x85a950,metal:0,rough:.7},{hex:0x628d3c,metal:0,rough:.7},
 {hex:0x805736,metal:0,rough:.8},{hex:0x9c704c,metal:0,rough:.8},{hex:0x6c472e,metal:0,rough:.8},{hex:0xa9815b,metal:0,rough:.8}
].map(m=>({...m,color:linear(m.hex)}));
export function registerMaterial(m:Omit<StudioMaterial,'color'>){const index=materials.findIndex(v=>v.hex===m.hex&&v.metal===m.metal&&v.rough===m.rough&&v.glass===m.glass&&v.opacity===m.opacity&&v.kind===m.kind&&v.doubleSided===m.doubleSided);if(index>=0)return index;materials.push({...m,color:linear(m.hex)});return materials.length-1;}
