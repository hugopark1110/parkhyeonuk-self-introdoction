import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {registerMaterial} from './studio';
import type {CatModel} from './sculpture';
/** Keep the sculpted topology and authored PBR materials in both rendering paths. */
export async function loadSculptedAsset(name:string):Promise<CatModel>{
 const gltf=await new GLTFLoader().loadAsync('/models/'+name+'.glb');gltf.scene.updateMatrixWorld(true);
 // Closed eyes use a small rounded crease instead of crushing glossy eyeballs into the face.
 if(name==='cat')for(const side of ['L','R']){
  const pivot=gltf.scene.getObjectByName('Eye_Pivot_'+side);if(!pivot)continue;
  const eye=new T.Vector3().setFromMatrixPosition(pivot.matrixWorld),box=new T.Box3().setFromObject(pivot),width=Math.max(.08,box.max.x-box.min.x),front=box.max.z+.006;
  const creasePivot=new T.Group();creasePivot.name='Eye_Squint_Pivot_'+side;creasePivot.position.set(eye.x,eye.y,front);
  const points=Array.from({length:9},(_,i)=>{const u=i/8;return new T.Vector3((u-.5)*width*.82,Math.sin(u*Math.PI)*width*.12,0);});
  const crease=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,width*.028,6,false),new T.MeshStandardMaterial({color:0x807345,roughness:.85}));
  crease.name='Eye_'+side+'_Squint';creasePivot.add(crease);gltf.scene.add(creasePivot);
 }gltf.scene.updateMatrixWorld(true);
 const uvs:number[]=[],textures:NonNullable<CatModel['textures']>=[],positions:number[]=[],normals:number[]=[],colors:number[]=[],indices:number[]=[],groups:CatModel['groups']=[],parts:NonNullable<CatModel['parts']>=[];
 const anchors:Record<string,number[]>={};
 const normalMatrix=new T.Matrix3(),v=new T.Vector3(),n=new T.Vector3();
 gltf.scene.traverse(object=>{if(/_Pivot/.test(object.name)){anchors[object.name]=new T.Vector3().setFromMatrixPosition(object.matrixWorld).toArray();}if(!(object instanceof T.Mesh)||/floor|ground|backdrop|plinth|studio/i.test(object.name))return;const geometry=object.geometry,pos=geometry.attributes.position,nor=geometry.attributes.normal;if(!nor)geometry.computeVertexNormals();const base=positions.length/3;normalMatrix.getNormalMatrix(object.matrixWorld);
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(object.matrixWorld);n.fromBufferAttribute(geometry.attributes.normal,i).applyMatrix3(normalMatrix).normalize();positions.push(v.x,v.y,v.z);normals.push(n.x,n.y,n.z);const uv=geometry.attributes.uv;uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);const color=geometry.attributes.color;colors.push(color?color.getX(i):1,color?color.getY(i):1,color?color.getZ(i):1);}
  const source=geometry.index?.array??Uint32Array.from({length:pos.count},(_,i)=>i),mats=Array.isArray(object.material)?object.material:[object.material],sub=geometry.groups.length?geometry.groups:[{start:0,count:source.length,materialIndex:0}];
  for(const group of sub){const mat=mats[group.materialIndex??0] as T.MeshPhysicalMaterial;const glass=(mat.transmission??0)>.55||/bottle_glass|crystal/i.test(mat.name);const name=mat.name.toLowerCase();const material=registerMaterial({hex:mat.color?.getHex()??0xcccccc,metal:mat.metalness??0,glass,opacity:glass?.17:mat.opacity,transmission:mat.transmission??(glass?.96:0),coat:mat.clearcoat??0,ior:mat.ior??1.46,doubleSided:mat.side===T.DoubleSide&&/fur|fibre|hair/.test(name),rough:mat.roughness??.4,kind:/plush/.test(name)?'plush':/fur|coat|cream|muzzle|tabby/.test(name)?'soft':/lens|optic|glass|iris/.test(name)?'lens':/grip|rubber|leather/.test(name)?'grip':undefined});if(mat.map&&!textures.some(t=>t.material===material)){textures.push({material,map:mat.map,normalMap:mat.normalMap??undefined});}const start=indices.length;for(let i=group.start;i<group.start+group.count;i++)indices.push(source[i]+base);groups.push({start,count:group.count,material});}
  parts.push({name:object.name+' '+(object.parent?.name??''),start:base,count:pos.count});
 });
 const p=new Float32Array(positions),normal=new Float32Array(normals);let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(let i=0;i<p.length;i+=3){minX=Math.min(minX,p[i]);maxX=Math.max(maxX,p[i]);minY=Math.min(minY,p[i+1]);maxY=Math.max(maxY,p[i+1]);minZ=Math.min(minZ,p[i+2]);maxZ=Math.max(maxZ,p[i+2]);}
 const center=[(minX+maxX)/2,(minY+maxY)/2,(minZ+maxZ)/2];for(let i=0;i<p.length;i+=3){p[i]-=center[0];p[i+1]-=center[1];p[i+2]-=center[2];}
 const merged:number[]=[],grouped:CatModel['groups']=[],buckets=new Map<number,number[]>();for(const group of groups){const b=buckets.get(group.material)??[];for(let j=group.start;j<group.start+group.count;j++)b.push(indices[j]);buckets.set(group.material,b);}for(const [material,b] of buckets){grouped.push({start:merged.length,count:b.length,material});for(const index of b)merged.push(index);}
 return {variant:name==='cat-tabby'?'tabby':undefined,uvs:new Float32Array(uvs),textures,positions:p,normals:normal,colors:new Float32Array(colors),indices:new Uint32Array(merged),groups:grouped,height:maxY-minY,width:maxX-minX,parts,center,anchors:Object.fromEntries(Object.entries(anchors).map(([key,value])=>[key,value.map((v,k)=>v-center[k])])),candleTip:name==='cake'?[.003-center[0],1.236-center[1],-center[2]]:undefined,basePositions:p.slice(),baseNormals:normal.slice()};
}
