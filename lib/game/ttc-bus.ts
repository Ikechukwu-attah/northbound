/** Original low-poly model inspired by the TTC Nova LFS white/red-band livery.
 * Local +Z is forward; +X is the driver's LEFT, so doors are on -X (curb side).
 * All geometry, including mirrors/rack, fits the existing 1.4 × 5.4 traffic envelope.
 * Reference: https://commons.wikimedia.org/wiki/File:TTC_nova_8531_bus_finch.jpg
 * No photograph or third-party mesh is bundled. */
export type BusPart={shape:'box'|'wheel';p:[number,number,number];s:[number,number,number];c:string;tag:string};
export type BusDecal={p:[number,number,number];size:[number,number];angle:number;tile:'destination'|'badge'|'fleet'|'accessible'};
export const BUS_LENGTH=5.4;
const white='#f4f3ec',red='#da291c',glass='#233740',rubber='#22292b',metal='#aeb6b7';
export function ttcBusParts():BusPart[]{const out:BusPart[]=[];const box=(tag:string,p:BusPart['p'],s:BusPart['s'],c:string)=>out.push({shape:'box',tag,p,s,c});
 box('body',[0,.83,0],[1.18,1.14,5.02],white);
 box('window-band',[0,1.08,0],[1.192,.57,4.82],rubber);
 box('red-belt',[0,.65,0],[1.198,.19,5.04],red);
 box('roof',[0,1.47,0],[1.18,.17,5.04],white);
 box('roof-red-stripe',[0,1.47,0],[1.193,.065,4.96],red);
 box('roof-cap',[0,1.565,0],[1.15,.035,5.01],white);
 // Visible full-size windows with slim dark mullions. Passenger doors are cut into curb side only.
 for(const side of [-1,1])for(const z of [-2.04,-1.42,-.8,-.18,.44,1.06,1.68,2.15]){
  if(side===-1&&(Math.abs(z+.8)<.4||z>1.9))continue;
  box('side-window',[side*.604,1.09,z],[.024,.49,z===2.15?.3:.55],glass);
  box('window-top-reflection',[side*.619,1.285,z],[.008,.026,z===2.15?.27:.51],'#62777c');
 }
 for(const z of [-.77,2.13]){box('curb-door',[-.614,.84,z],[.035,1.10,.56],rubber);for(const dz of [-.142,.142]){box('door-glass',[-.637,.94,z+dz],[.012,.76,.245],glass);box('door-panel',[-.64,.42,z+dz],[.012,.24,.245],metal);}box('door-centre',[-.646,.84,z],[.012,1.02,.025],metal);box('yellow-step',[-.646,.302,z],[.018,.035,.51],'#e7c24f');}
 box('windscreen',[0,1.035,2.522],[1.075,.59,.025],glass);
 box('windscreen-divider',[0,1.035,2.54],[.022,.59,.014],rubber);
 for(const x of [-.25,.25])box('wiper',[x,.81,2.545],[.34,.022,.018],rubber);
 box('destination-bezel',[0,1.43,2.526],[1.075,.19,.025],rubber);
 box('rear-window',[0,1.13,-2.523],[.96,.42,.025],glass);
 box('rear-engine-panel',[0,.62,-2.529],[.88,.39,.02],white);
 for(let i=0;i<5;i++)box('engine-vent',[0,.49+i*.058,-2.544],[.68,.019,.012],'#6c7575');
 box('front-bumper',[0,.29,2.54],[1.18,.13,.07],rubber);box('rear-bumper',[0,.29,-2.54],[1.18,.13,.07],rubber);
 for(const x of [-.46,.46]){box('headlamp-surround',[x,.58,2.531],[.16,.23,.045],rubber);box('headlamp',[x,.56,2.558],[.11,.08,.012],'#fff3cb');box('front-indicator',[x,.65,2.558],[.10,.045,.013],'#f2b43d');box('rear-light',[x,.62,-2.551],[.10,.20,.025],'#a52522');box('mirror-arm',[x*1.26,1.26,2.3],[.20,.026,.025],rubber);box('mirror',[x*1.43,1.17,2.3],[.07,.18,.09],rubber);}
 for(const x of [-.43,0,.43])box('roof-marker',[x,1.54,2.529],[.07,.035,.015],'#e5a144');
 // Four circular tires and coloured metal hubs; cylinders are oriented along the axle.
 for(const side of [-1,1])for(const z of [-1.48,1.52]){out.push({shape:'wheel',tag:'tire',p:[side*.586,.29,z],s:[.25,.13,.25],c:rubber});out.push({shape:'wheel',tag:'wheel-hub',p:[side*.657,.29,z],s:[.145,.016,.145],c:red});out.push({shape:'wheel',tag:'axle-cap',p:[side*.669,.29,z],s:[.062,.018,.062],c:metal});}
 box('hvac',[0,1.65,-1.35],[.87,.17,1.51],'#e0e3df');box('roof-hatch',[0,1.604,.73],[.65,.035,.67],'#c4cecb');
 for(let i=0;i<5;i++)box('hvac-grille',[0,1.741,-1.87+i*.22],[.67,.015,.035],'#98a5a5');
 // Folded rack stays inside the length used by queues and crossings.
 for(const x of [-.32,.32])box('bike-rack-upright',[x,.50,2.66],[.025,.42,.025],metal);
 for(const y of [.32,.46,.69])box('bike-rack-rail',[0,y,2.66],[.83,.024,.025],metal);
 return out;
}
export const BUS_DECALS:BusDecal[]=[
 {p:[0,1.43,2.544],size:[1.02,.16],angle:0,tile:'destination'},
 {p:[-.654,1.39,1.22],size:[.7,.10],angle:-Math.PI/2,tile:'destination'},
 {p:[.609,.65,-.42],size:[.32,.16],angle:Math.PI/2,tile:'badge'},
 {p:[-.65,.65,.35],size:[.32,.16],angle:-Math.PI/2,tile:'badge'},
 {p:[0,.66,2.546],size:[.27,.12],angle:0,tile:'badge'},
 {p:[.38,.78,2.546],size:[.23,.075],angle:0,tile:'fleet'},
 {p:[-.609,1.47,-1.98],size:[.28,.06],angle:-Math.PI/2,tile:'fleet'},
 {p:[-.35,.78,2.546],size:[.12,.12],angle:0,tile:'accessible'}
];
