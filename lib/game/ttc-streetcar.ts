import type {BusPart,BusDecal} from './ttc-bus';
/** Original compact five-module TTC Flexity-inspired mesh, distinct from a road bus.
 * Reference: Alstom, Toronto Flexity supply announcement, 2 June 2021.
 * Uses the existing seven-unit traffic envelope; +Z is forward, -X is curb side. */
export const STREETCAR_LENGTH=7;
export function ttcStreetcarParts():BusPart[]{
 const out:BusPart[]=[];
 const box=(tag:string,p:BusPart['p'],s:BusPart['s'],c:string,rotation?:BusPart['rotation'])=>out.push({shape:'box',tag,p,s,c,rotation});
 for(const z of [-2.76,-1.38,0,1.38,2.76]){
  box('module-body',[0,.83,z],[1.20,1.18,1.23],'#da291c');
  box('module-roof',[0,1.48,z],[1.22,.16,1.25],'#f4f3ec');
  box('module-skirt',[0,.34,z],[1.18,.16,1.24],'#b7231b');
  for(const side of [-1,1]){
   box('window-band',[side*.607,1.08,z],[.025,.58,1.16],'#233740');
   box('window-mullion',[side*.624,1.08,z],[.014,.58,.035],'#22292b');
   box('white-waist',[side*.615,.70,z],[.02,.12,1.18],'#f4f3ec');
  }
 }
 for(const z of [-2.07,-.69,.69,2.07]){
  box('articulation',[0,.92,z],[1.12,1.14,.15],'#394348');
  for(const dz of [-.05,0,.05])box('bellows-rib',[0,.92,z+dz],[1.18,1.14,.012],'#626c6d');
 }
 for(const z of [-2.76,0,2.76])for(const side of [-1,1]){
  out.push({shape:'wheel',tag:'rail-wheel',p:[side*.53,.25,z],s:[.20,.10,.20],c:'#394348'});
 }
 for(const z of [-2.9,-1.38,1.38,2.9]){
  box('curb-door',[-.632,.87,z],[.025,.98,.43],'#18262c');
  box('door-divider',[-.65,.87,z],[.012,.98,.025],'#d9dfd9');
  box('door-threshold',[-.65,.38,z],[.03,.04,.42],'#f4c954');
 }
 box('front-cab',[0,.91,3.39],[1.06,1.08,.12],'#da291c');
 box('windscreen',[0,1.15,3.457],[.96,.57,.02],'#233740');
 box('destination-bezel',[0,1.46,3.46],[.95,.16,.025],'#18262c');
 box('bumper',[0,.32,3.43],[1.12,.13,.08],'#394348');
 for(const side of [-1,1])box('headlamp',[side*.43,.58,3.46],[.15,.07,.025],'#fff3cb');
 box('rear-window',[0,1.10,-3.388],[.98,.56,.025],'#233740');
 for(const side of [-1,1])box('rear-light',[side*.47,.55,-3.39],[.08,.15,.025],'#ff4940');
 for(const z of [-2.5,0,2.5])box('roof-equipment',[0,1.63,z],[.76,.18,.68],'#bfc8c8');
 box('pantograph-base',[0,1.68,-1.1],[.75,.12,.55],'#394348');
 for(const side of [-1,1])box('pantograph-arm',[side*.22,2.03,-1.1],[.055,.76,.055],'#394348',[0,0,side*.65]);
 box('pantograph-contact',[0,2.34,-1.1],[1,.055,.14],'#394348');
 return out;
}
export const STREETCAR_DECALS:BusDecal[]=[
 {p:[0,1.46,3.477],size:[.90,.13],angle:0,tile:'destination'},
 {p:[0,.73,3.457],size:[.27,.13],angle:0,tile:'badge'},
 {p:[.63,.52,0],size:[.32,.16],angle:Math.PI/2,tile:'badge'},
 {p:[-.65,.52,0],size:[.32,.16],angle:-Math.PI/2,tile:'badge'},
 {p:[.63,1.43,2.76],size:[.28,.07],angle:Math.PI/2,tile:'fleet'},
];
