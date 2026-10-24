import type {TransitState} from './transit-interiors';
/** The geometry pattern repeats at 72 units (6 × 12-unit city blocks).
 * Ride time is game presentation time, not real-world TTC speed. */
export const SCENERY_PERIOD=72;
export const RIDE_SECONDS=6;
const ACCEL=.9,BRAKE=1.2;
export function rideMotion(t:Pick<TransitState,'stage'|'mode'|'readyAt'>,now:number){
 if(t.stage!=='riding')return {speed:0,distance:0};
 const seconds=Math.max(0,Math.min(RIDE_SECONDS,(now-t.readyAt)/1000+RIDE_SECONDS));
 const cruise=t.mode==='subway'?24:t.mode==='streetcar'?15:18,brakeAt=RIDE_SECONDS-BRAKE;
 // Exact integral of the speed profile: independent of frame rate, no drift at stops.
 if(seconds<ACCEL)return {speed:cruise*seconds/ACCEL,distance:cruise*seconds*seconds/(2*ACCEL)};
 if(seconds<brakeAt)return {speed:cruise,distance:cruise*(seconds-ACCEL/2)};
 const b=seconds-brakeAt;
 return {speed:Math.max(0,cruise*(1-b/BRAKE)),distance:cruise*(brakeAt-ACCEL/2+b-b*b/(2*BRAKE))};
}
export type SceneryMotion={trip:string;base:number;offset:number};
export const newSceneryMotion=():SceneryMotion=>({trip:'',base:0,offset:0});
/** A stage or seat update must not restart the movement or snap scenery back.
 * Switching camera modes keeps this accumulator on the same scene component. */
export function advanceScenery(m:SceneryMotion,t:Pick<TransitState,'stage'|'mode'|'readyAt'|'index'>,now:number){
 if(t.stage!=='riding')return m.offset;
 const trip=t.index+':'+t.readyAt;
 if(trip!==m.trip){m.base=m.offset;m.trip=trip;}
 m.offset=(m.base+rideMotion(t,now).distance)%SCENERY_PERIOD;
 return m.offset;
}
