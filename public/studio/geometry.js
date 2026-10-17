// Parametric catalog geometry. Coordinates are in meters, controls in centimeters.
export function buildModel(d,low=false){
 const w=d.width/100,h=d.height/100,z=d.depth/100;
 const vertices=[]; const wood=['oak','walnut','birch'].includes(d.material)?1:d.material==='metal'?2:0;
 const rgb=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
 const primary=rgb(d.color),accent=rgb(d.accent);
 function tri(a,b,c,ns,color,mat){
  if(Math.hypot(...cross(b.map((v,i)=>v-a[i]),c.map((v,i)=>v-a[i])))<1e-10)return;
  const n=ns||normal(a,b,c);for(const [i,p] of [a,b,c].entries())vertices.push(...p,...(Array.isArray(n[0])?n[i]:n),...color,mat);
 }
 function box(cx,cy,cz,sx,sy,sz,color=primary,mat=wood,r=.009){
  r=Math.min(r,sx/2,sy/2,sz/2);
  const halves=[sx/2,sy/2,sz/2],center=[cx,cy,cz];
  const point=(axis,sign,u,v)=>{
   const axes=[0,1,2].filter(a=>a!==axis);const p=[0,0,0];p[axis]=sign*halves[axis];p[axes[0]]=u*halves[axes[0]];p[axes[1]]=v*halves[axes[1]];
   const inner=p.map((x,i)=>Math.max(-halves[i]+r,Math.min(halves[i]-r,x)));const delta=p.map((x,i)=>x-inner[i]);const len=Math.hypot(...delta)||1;const n=delta.map(x=>x/len);
   return {p:inner.map((x,i)=>center[i]+x+n[i]*r),n};
  };
  for(let axis=0;axis<3;axis++){
   const axes=[0,1,2].filter(a=>a!==axis);
   const samples=k=>[...new Set([-1,-1+r/halves[k],0,1-r/halves[k],1])].sort((a,b)=>a-b);
   const us=samples(axes[0]),vs=samples(axes[1]);
   for(const sign of [-1,1])for(let i=0;i<us.length-1;i++)for(let j=0;j<vs.length-1;j++){
    const a=point(axis,sign,us[i],vs[j]),b=point(axis,sign,us[i+1],vs[j]),c=point(axis,sign,us[i+1],vs[j+1]),e=point(axis,sign,us[i],vs[j+1]);
    const flip=(axis===1?-sign:sign)<0;const q=flip?[a,c,b,a,e,c]:[a,b,c,a,c,e];tri(q[0].p,q[1].p,q[2].p,q.slice(0,3).map(t=>t.n),color,mat);tri(q[3].p,q[4].p,q[5].p,q.slice(3).map(t=>t.n),color,mat);
   }
  }
 }
 function cylinder(cx,cy,cz,rx,rz,height,color=primary,mat=wood,topScale=1){
  const count=low?20:64;const y0=cy-height/2,y1=cy+height/2;
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2,b=(i+1)/count*Math.PI*2;
   const p=[cx+Math.cos(a)*rx,y0,cz+Math.sin(a)*rz],q=[cx+Math.cos(b)*rx,y0,cz+Math.sin(b)*rz];
   const t=[cx+Math.cos(a)*rx*topScale,y1,cz+Math.sin(a)*rz*topScale],s=[cx+Math.cos(b)*rx*topScale,y1,cz+Math.sin(b)*rz*topScale];
   const slope=(1-topScale)*(rx+rz)/2/height;const norm=v=>{const n=[Math.cos(v)/rx,slope/Math.min(rx,rz),Math.sin(v)/rz];const l=Math.hypot(...n);return n.map(x=>x/l);};
   tri(p,t,s,[norm(a),norm(a),norm(b)],color,mat);tri(p,s,q,[norm(a),norm(b),norm(b)],color,mat);
   tri([cx,y1,cz],s,t,[0,1,0],color,mat);tri([cx,y0,cz],p,q,[0,-1,0],color,mat);
  }
 }
 function beam(a,b,width,color=accent,mat=0){
  const delta=b.map((v,i)=>v-a[i]),len=Math.hypot(...delta);const y=delta.map(x=>x/len);const ref=Math.abs(y[1])>.95?[1,0,0]:[0,1,0];const x=unit(cross(ref,y)),zz=cross(x,y);
  const at=(side,ix,iz)=>a.map((v,i)=>v+delta[i]*side+x[i]*ix*width/2+zz[i]*iz*width/2);
  const v=[at(0,-1,-1),at(0,1,-1),at(0,1,1),at(0,-1,1),at(1,-1,-1),at(1,1,-1),at(1,1,1),at(1,-1,1)];
  for(const f of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]){tri(v[f[0]],v[f[1]],v[f[2]],null,color,mat);tri(v[f[0]],v[f[2]],v[f[3]],null,color,mat);}
 }
 function ellipsoid(cx,cy,cz,rx,ry,rz,color=primary,mat=wood){
  const rings=low?8:14,segments=low?16:32;
  const at=(i,j)=>{const a=Math.PI*i/rings,b=Math.PI*2*j/segments;const p=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];return {p:[cx+p[0]*rx,cy+p[1]*ry,cz+p[2]*rz],n:unit([p[0]/rx,p[1]/ry,p[2]/rz])};};
  for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){const a=at(i,j),b=at(i+1,j),c=at(i+1,j+1),e=at(i,j+1);tri(a.p,b.p,c.p,[a.n,b.n,c.n],color,mat);tri(a.p,c.p,e.p,[a.n,c.n,e.n],color,mat);}
 }
 function lathe(profile,color=primary,mat=wood){
  const count=low?24:64;
  for(let i=0;i<profile.length-1;i++)for(let j=0;j<count;j++){
   const a=j/count*Math.PI*2,b=(j+1)/count*Math.PI*2;const p=profile[i],q=profile[i+1];
   const pt=(t,r)=>[Math.cos(t)*w*r[1],h*r[0],Math.sin(t)*z*r[1]];
   const A=pt(a,p),B=pt(a,q),C=pt(b,q),D=pt(b,p);tri(A,B,C,null,color,mat);tri(A,C,D,null,color,mat);
  }
 }
 function legs(top,spread=.42,bottom=.015,size=.035){for(const x of [-1,1])for(const zz of [-1,1])beam([x*w*spread,bottom,zz*z*spread],[x*w*spread,top,zz*z*spread],size);}
 function foliage(cx,base,cz,scale){
  const green=accent;
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5,dx=Math.cos(angle)*scale*.32,dz=Math.sin(angle)*scale*.32;beam([cx,base,cz],[cx+dx,base+scale*(.65+(i%2)*.2),cz+dz],.008,green,0);ellipsoid(cx+dx,base+scale*(.6+(i%2)*.2),cz+dz,scale*.16,scale*.26,scale*.07,green,0);}
 }
 const thick=Math.min(.045,h*.08);
 if(d.kind==='table'){
  if(d.shape==='round')cylinder(0,h-thick/2,0,w/2,z/2,thick);else box(0,h-thick/2,0,w,thick,z,primary,wood,.018);
  cylinder(0,(h-thick)/2+.025,0,Math.min(w,z)*.075,Math.min(w,z)*.075,h-thick-.05,accent,0,.75);
  for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;beam([0,.06,0],[Math.cos(a)*w*.44,.025,Math.sin(a)*z*.44],.045);}
 }else if(d.kind==='chair'){
  const seat=h*.48;box(0,seat,0,w*.9,h*.105,z*.86,primary,wood,.035);
  if(d.variant==='slatted'){for(let i=0;i<5;i++)box((i/4-.5)*w*.85,h*.78,-z*.425,w*.13,h*.44,z*.12,primary,wood,.01);}else box(0,h*.78,-z*.425,w,h*.44,z*.15,primary,wood,.035);
  for(const xx of [-1,1])for(const zz of [-1,1])beam([xx*w*.39,.015,zz*z*.39],[xx*w*.34,seat,zz*z*.33],Math.min(w,z)*.068);
  if(d.variant!=='armless')for(const xx of [-1,1]){box(xx*w*.465,h*.59,-z*.04,w*.07,h*.055,z*.78,accent,0,.012);beam([xx*w*.465,seat,-z*.26],[xx*w*.465,h*.59,-z*.26],.027);}
 }else if(d.kind==='lamp'){
  cylinder(0,.018,0,w*.32,z*.32,.036,accent,0);cylinder(0,h*.42,0,.014,.014,h*.82,accent,0);
  cylinder(0,h*.88,0,w*.5,z*.5,h*.24,primary,wood,.52);
  cylinder(0,h*.762,0,w*.46,z*.46,.005,[.92,.85,.68],0);
 }else if(d.kind==='desk'){
  if(d.variant==='corner'){
   box(-w*.325,h-thick/2,0,w*.35,thick,z,primary,wood,.012);box(w*.175,h-thick/2,-z*.325,w*.65,thick,z*.35,primary,wood,.012);
   for(const [xx,zz]of [[-.43,-.43],[-.43,.43],[-.23,.43],[.43,-.43],[.43,-.23]])box(xx*w,(h-thick)/2,zz*z,.04,h-thick,.04,accent,0);
  }else{
   if(d.shape==='round')cylinder(0,h-thick/2,0,w/2,z/2,thick);
   else if(d.variant==='slatted'){for(let i=0;i<7;i++)box((i/6-.5)*w*.85,h-thick/2,0,w*.135,thick,z,primary,wood,.007);}
   else box(0,h-thick/2,0,w,thick,z,primary,wood,.018);
   for(const xx of [-1,1]){
    if(d.variant==='standing')box(xx*w*.36,(h-thick)/2,0,.06,h-thick,.09,accent,0);
    else for(const zz of [-1,1])box(xx*w*.43,(h-thick)/2,zz*z*.39,.04,h-thick,.04,accent,0);
    box(xx*w*(d.variant==='standing'?.36:.43),.025,0,.06,.05,z*.83,accent,0);
   }
   box(0,h*.85,-z*.39,w*.86,.045,.04,accent,0);
  }
 }else if(['shelf','rack'].includes(d.kind)){
  const count=d.shelves||4,t=.027;
  if(d.kind==='shelf'){for(const xx of [-1,1])box(xx*(w/2-t/2),h/2,0,t,h,z);box(0,h/2,-z/2+.008,w,h,.016,accent,0);}
  else for(const xx of [-1,1])for(const zz of [-1,1])box(xx*(w/2-.017),h/2,zz*(z/2-.017),.034,h,.034,accent,0);
  for(let i=0;i<count;i++){const y=t/2+(h-t)*i/(count-1);box(0,y,0,w,t,z,primary,wood,.004);}
 }else if(d.kind==='stool'){
  if(d.shape==='round')cylinder(0,h-.025,0,w/2,z/2,.05);else box(0,h-.025,0,w,.05,z,primary,wood,.02);
  for(const xx of [-1,1])for(const zz of [-1,1])beam([xx*w*.39,.012,zz*z*.39],[xx*w*.27,h-.05,zz*z*.27],.032);
  for(const xx of [-1,1])beam([xx*w*.35,h*.3,-z*.35],[xx*w*.35,h*.3,z*.35],.022);
  for(const zz of [-1,1])beam([-w*.35,h*.3,zz*z*.35],[w*.35,h*.3,zz*z*.35],.022);
 }else if(d.kind==='plinth'){
  if(d.shape==='round')cylinder(0,h/2,0,w/2,z/2,h);else box(0,h/2,0,w,h,z,primary,wood,.015);
 }else if(d.kind==='sofa'){
  const count=w>1.9?3:2;box(0,h*.3,0,w*.95,h*.2,z*.88,primary,wood,.035);
  box(0,h*.73,-z*.39,w,h*.54,z*.22,primary,wood,.055);
  for(const xx of [-1,1])box(xx*w*.46,h*.49,0,w*.08,h*.49,z,primary,wood,.04);
  for(let i=0;i<count;i++)box((i-(count-1)/2)*w*.82/count,h*.47,z*.025,w*.8/count,h*.16,z*.72,primary,wood,.035);
  legs(h*.25,.4,.01,.05);
 }else if(d.kind==='cabinet'){
  const t=Math.min(w,z)*.045;
  box(0,h*.05,0,w*.94,h*.1,z*.91,accent,0);
  for(const xx of [-1,1])box(xx*(w/2-t/2),h*.55,0,t,h*.9,z);
  box(0,h-t/2,0,w,t,z);box(0,h*.12,0,w,t,z);box(0,h*.55,-z/2+t/2,w,h*.9,t,accent,0);
  if(d.variant==='open'){const count=d.shelves||4;for(let i=1;i<count;i++)box(0,h*.12+(h*.85)*i/count,0,w,t,z);}
  else{
   const count=d.panels||2;
   for(let i=0;i<count;i++){
    if(d.variant==='drawers'){const dh=h*.84/count,y=h*.13+dh*(i+.5);box(0,y,z*.48,w*.94,dh*.95,t);box(0,y,z*.51,w*.25,.012,.016,accent,0,.002);}
    else{const dw=w*.95/count,x=(i-(count-1)/2)*dw;box(x,h*.55,z*.48,dw*.97,h*.85,t);box(x+dw*.3,h*.56,z*.515,.012,h*.1,.018,accent,0,.002);if(d.variant==='locker')for(let j=0;j<3;j++)box(x,h*.81-j*h*.025,z*.505,dw*.4,.006,.008,accent,0,.001);}
   }
  }
 }else if(d.kind==='bed'){
  box(0,h*.25,z*.015,w,h*.24,z*.97,primary,wood,.02);box(0,h*.51,-z*.47,w,h*.98,z*.06,primary,wood,.012);
  box(0,h*.43,z*.03,w*.94,h*.18,z*.88,accent,0,.04);
  for(const xx of [-1,1])box(xx*w*.235,h*.55,-z*.27,w*.4,h*.09,z*.19,accent,0,.045);
  legs(h*.2,.42,.01,.06);
 }else if(d.kind==='vanity'){
  box(0,h*.48,z*.08,w,.035,z*.85);legs(h*.48,.42,.01,.035);
  box(0,h*.76,-z*.38,w*.65,h*.48,.025,accent,0,.015);box(0,h*.76,-z*.36,w*.59,h*.43,.018,[.66,.73,.72],2,.01);
  box(-w*.29,h*.4,z*.07,w*.35,h*.12,z*.8);
 }else if(d.kind==='counter'){
  box(0,h*.46,-z*.04,w*.94,h*.88,z*.88);box(0,h-.025,0,w,.05,z,accent,0,.012);
  box(0,h*.035,z*.1,w*.92,h*.07,z*.88,accent,0,.004);
  for(const xx of [-1,0,1])box(xx*w*.31,h*.46,z*.41,w*.3,h*.78,.018,primary,wood,.002);
 }else if(d.kind==='bench'){
  const seat=d.variant==='backrest'?h*.52:h-.04;
  for(let i=0;i<4;i++)box(0,seat,(i/3-.5)*z*.75,w,.04,z*.22,primary,wood,.008);
  legs(seat-.02,.4,.01,.05);
  if(d.variant==='backrest'){for(let i=0;i<3;i++)box(0,h*.67+i*h*.13,-z*.45,w,h*.105,.025);for(const xx of [-1,1])beam([xx*w*.4,seat,-z*.45],[xx*w*.4,h,-z*.45],.035);}
 }else if(d.kind==='vase'){
  lathe([[0,0],[.02,.3],[.12,.44],[.38,.5],[.66,.4],[.87,.23],[1,.27],[1,.22],[.87,.18],[.66,.34],[.15,.37],[.07,0]]);
 }else if(d.kind==='planter'||d.kind==='hanging-planter'){
  const hanging=d.kind==='hanging-planter';const potH=h*(hanging?.38:.47),y=hanging?h*.08:0;
  cylinder(0,y+potH/2,0,w*.37,z*.37,potH,primary,wood,1.27);
  cylinder(0,y+potH*.97,0,w*.46,z*.46,potH*.04,[.23,.2,.15],0);
  foliage(0,y+potH,0,h*.52);
  if(hanging)for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam([Math.cos(a)*w*.44,y+potH*.9,Math.sin(a)*z*.44],[0,h,0],.008,accent,0);}
 }else if(d.kind==='mirror'){
  const bottom=d.variant==='standing'?h*.12:0, mh=h-bottom;
  box(0,bottom+mh/2,-z*.1,w,mh,Math.min(z*.16,.03),accent,0,.012);
  box(0,bottom+mh/2,-z*.1+.018,w*.88,mh*.94,.012,primary,2,.006);
  if(d.variant==='standing'){for(const xx of [-1,1])beam([xx*w*.4,.01,z*.4],[xx*w*.4,h*.82,-z*.12],.028,accent,0);beam([-w*.4,.01,-z*.4],[w*.4,.01,-z*.4],.03,accent,0);}
 }else if(d.kind==='wall-shelf'){
  box(0,h*.88,0,w,h*.12,z);for(const xx of [-1,1]){beam([xx*w*.34,h*.02,-z*.4],[xx*w*.34,h*.83,z*.4],.025);box(xx*w*.34,h*.45,-z*.45,.03,h*.9,.03,accent,0);}
 }else if(d.kind==='sculpture'){
  cylinder(0,h*.07,0,w*.5,z*.5,h*.14,accent,0);
  ellipsoid(0,h*.35,0,w*.4,h*.23,z*.4);
  ellipsoid(w*.08,h*.72,0,w*.31,h*.29,z*.31,primary,wood);
 }else if(d.kind==='plant-stand'){
  for(let i=0;i<3;i++){const x=(i-1)*w*.3,y=h*(.4+i*.25);box(x,y,0,w*.35,.025,z);for(const zz of [-1,1])beam([x,.01,zz*z*.38],[x,y,zz*z*.38],.025);}
 }else if(d.kind==='partition'){
  if(d.variant==='slatted'){for(let i=0;i<9;i++)box((i/8-.5)*w*.94,h*.51,0,w*.055,h*.98,z*.25);}
  else box(0,h*.53,0,w,h*.94,Math.min(z*.15,.04),primary,wood,.015);
  if(d.variant==='corner')box(-w*.47,h*.53,z*.25,w*.06,h*.94,z*.5);
  for(const xx of [-1,1])box(xx*w*.36,.025,0,.06,.05,z,accent,0);
 }else if(d.kind==='office-chair'){
  box(0,h*.42,0,w*.84,h*.1,z*.8,primary,wood,.04);box(0,h*.75,-z*.36,w*.76,h*.5,z*.14,primary,wood,.04);
  cylinder(0,h*.2,0,.025,.025,h*.4,accent,2);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.cos(a)*w*.45,zz=Math.sin(a)*z*.45;beam([0,.055,0],[x,.025,zz],.035);ellipsoid(x,.02,zz,.027,.02,.027,accent,0);}
  for(const xx of [-1,1]){box(xx*w*.45,h*.55,0,.04,.035,z*.55,accent,0);beam([xx*w*.4,h*.4,0],[xx*w*.45,h*.55,0],.025);}
 }else if(d.kind==='pendant'){
  cylinder(0,h*.98,0,w*.16,z*.16,h*.04,accent,0);beam([0,h*.98,0],[0,h*.34,0],.008,accent,0);
  cylinder(0,h*.17,0,w*.5,z*.5,h*.34,primary,wood,.28);cylinder(0,.006,0,w*.47,z*.47,.012,[.93,.88,.72],0);
 }else if(d.kind==='chandelier'){
  cylinder(0,h*.93,0,w*.12,z*.12,h*.14,accent,0);beam([0,h*.9,0],[0,h*.3,0],.02);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,x=Math.cos(a)*w*.36,zz=Math.sin(a)*z*.36;beam([0,h*.3,0],[x,h*.42,zz],.025);ellipsoid(x,h*.29,zz,w*.12,h*.17,z*.12,primary,wood);}
 }else if(d.kind==='wall-light'){
  box(0,h*.57,-z*.4,w*.35,h*.55,.025,accent,0);beam([0,h*.4,-z*.4],[0,h*.4,z*.15],.025);
  cylinder(0,h*.66,z*.12,w*.5,z*.35,h*.68,primary,wood,.6);
 }else if(d.kind==='board'){
  const bottom=h*.3;
  box(0,bottom+(h-bottom)/2,-z*.05,w,h-bottom,.035,accent,0,.008);box(0,bottom+(h-bottom)/2,-z*.05+.024,w*.92,(h-bottom)*.92,.012,primary,wood,.004);
  if(d.variant==='a-frame'){for(const xx of [-1,1])for(const zz of [-1,1])beam([xx*w*.43,0,zz*z*.44],[xx*w*.43,h*.96,0],.025);}
  else for(const xx of [-1,1]){box(xx*w*.38,bottom/2,0,.025,bottom,.025,accent,0);box(xx*w*.38,.02,0,.06,.04,z,accent,0);}
 }else if(d.kind==='laptop-stand'){
  box(0,h*.07,0,w*.8,h*.14,z*.9,accent,0);beam([0,h*.12,-z*.2],[0,h*.75,z*.1],.05,accent,0);
  box(0,h*.91,0,w,h*.12,z,primary,wood,.01);box(0,h*.98,z*.45,w*.9,h*.04,.02,accent,0);
 }else if(d.kind==='tier-stand'){
  const count=d.shelves||3;for(const xx of [-1,1])box(xx*w*.4,h/2,-z*.25,.03,h,.03,accent,0);
  for(let i=0;i<count;i++)box(0,.025+(h-.05)*i/(count-1),0,w*(1-i*.12),.04,z*(1-i*.1));
 }else if(d.kind==='rail'){
  for(const xx of [-1,1]){box(xx*w*.47,h/2,0,.035,h,.035,accent,0);box(xx*w*.47,.025,0,.07,.05,z,accent,0);}
  beam([-w*.47,h-.02,0],[w*.47,h-.02,0],.03,primary,wood);
  if(d.variant==='shelf')box(0,h*.12,0,w,.025,z);
 }else if(d.kind==='accessory'){
  box(0,.02,0,w,.04,z,accent,0);box(0,h*.5,0,.025,h,.025,primary,wood);
  for(const yy of [.55,.95])beam([-w*.45,h*yy,0],[w*.45,h*yy,0],.025,primary,wood);
 }else if(d.kind==='brochure'){
  box(0,h*.025,0,w,.05*h,z,accent,0);box(0,h*.48,-z*.22,.035,h*.9,.035,accent,0);
  for(let i=0;i<3;i++){const y=h*(.33+i*.25);box(0,y,-z*.1,w*.9,h*.22,.02,primary,wood,.003);box(0,y-h*.1,z*.12,w,.02,z*.55,primary,wood,.003);box(0,y-h*.04,z*.38,w,h*.12,.02,primary,wood,.003);}
 }else if(d.kind==='promo'){
  box(0,h*.08,0,w,h*.16,z,accent,0,.012);box(0,h*.58,-z*.2,w*.82,h*.84,.035,primary,wood,.01);box(0,h*.25,z*.1,w,.025,z*.75,accent,0);box(0,h*.59,z*.1,w,.025,z*.75,accent,0);
 }else if(d.kind==='logo'){
  box(0,h*.06,0,w,h*.12,z,accent,0,.01);box(0,h*.23,0,w*.08,h*.3,z*.13,accent,0);
  box(-w*.22,h*.65,0,w*.18,h*.7,z*.28);box(w*.02,h*.93,0,w*.66,h*.14,z*.28);box(-w*.03,h*.67,0,w*.56,h*.14,z*.28);
 }else{throw Error('Unsupported catalog model: '+d.kind);}

 // Map the outer envelope to the requested dimensions, including frame ends.
 const data=new Float32Array(vertices), bb=bounds(data), desired=[w,h,z];
 const scale=desired.map((v,i)=>v/(bb.size[i]||1));
 for(let i=0;i<data.length;i+=10){
  for(let k=0;k<3;k++)data[i+k]=(data[i+k]-bb.min[k])*scale[k]-(k===1?0:desired[k]/2);
  const n=[data[i+3]/scale[0],data[i+4]/scale[1],data[i+5]/scale[2]],len=Math.hypot(...n)||1;
  for(let k=0;k<3;k++)data[i+3+k]=n[k]/len;
 }
 return data;
}
export function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export function unit(a){const l=Math.hypot(...a)||1;return a.map(x=>x/l);}
function normal(a,b,c){return unit(cross(b.map((x,i)=>x-a[i]),c.map((x,i)=>x-a[i])));}
export function bounds(data){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<data.length;i+=10)for(let k=0;k<3;k++){min[k]=Math.min(min[k],data[i+k]);max[k]=Math.max(max[k],data[i+k]);}return {min,max,size:max.map((v,i)=>v-min[i])};}
