/** A model is about 1.8 units tall; exterior doors are 2.5 and one storey is 2.3. */
export const CITY_HUMAN_SCALE=1.05;
export const CITY_NAME_HEIGHT=2.3;
export const PLAYER_MARKER_RADIUS=.38;
/** The rig's seated hip must sit above the cushion, independent of model or height. */
export function seatedRootHeight(hipY:number,scale:number,height:number,seatSurface:number){return seatSurface+.1-hipY*scale*height;}
export const SEATED_FORWARD=.42;
