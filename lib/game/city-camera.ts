/** A street view, not a freely spinning model viewer. Zoom stays close to the player. */
export const CITY_CAMERA={polar:.9,azimuth:Math.atan2(34,42),turn:.28,radius:68,nearRadius:2,sceneryRadius:6,far:250} as const;
export const cityZoomMin=(width:number,height:number)=>Math.max(width/72,height/80);
export const cityZoomMax=(width:number,height:number)=>cityZoomMin(width,height)*6;
