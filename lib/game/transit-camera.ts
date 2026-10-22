/** Fixed transit camera envelopes. World coordinates use +z toward the rear. */
export const TRANSIT_CAMERA={rotate:false,pan:false,insideFov:64,insideFar:36,insideFogStart:22,insideFogEnd:32,insideTarget:[0,1.65,-8] as [number,number,number],insidePosition:[0,1.65,3] as [number,number,number],minDistance:7,maxDistance:12,cutawayPosition:[16,20,22] as [number,number,number],stationPosition:[-16,20,22] as [number,number,number]};
export function transitCameraLimits(width:number,height:number,vehicle:boolean){
 // Bound BOTH frustum axes: a fixed minZoom exposes the ends on wide screens.
 const minZoom=Math.max(width/32,height/28),maxZoom=Math.max(minZoom*2.8,65);
 const preferred=vehicle?Math.min(width/15,height/17):Math.min(width/(width<620?22:16),height/(width<620?21:19));
 return {minZoom,maxZoom,zoom:Math.max(minZoom,Math.min(maxZoom,preferred))};
}
/** Relative to the direction of travel: right-hand running gives island platforms
 * left doors, side platforms right doors. Union uses its two separate platforms.
 * Source: TTC Subway Station Design Standard (2025), station classifications,
 * https://www.toronto.ca/legdocs/mmis/2025/ttc/bgrd/backgroundfile-256301.pdf
 * Unknown game stops conservatively use side-platform presentation. */
const CENTRE:Record<string,Set<string>>={
 '1':new Set(['vaughan','highway407','pioneer','yorku','finchwest','downsview','sheppardwest','wilson','yorkdale','lawrencewest','glencairn','cedarvale','stgeorge','museum','queenspark','stpatrick','osgoode','standrew','yorkmills','lawrence','eglinton','sheppard','nyc','finch']),
 '2':new Set(['kipling','islington','stgeorge','bay','bloor','victoriapark','warden','kennedy']),
 '4':new Set(['bayview','bessarion','leslie','donmills'])
};
export function stationDoorSide(line:string,stop:string):1|-1{return CENTRE[line]?.has(stop)?-1:1;}
