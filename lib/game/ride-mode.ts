import type {Journey} from './engine';
/** Keep existing in-progress saves usable; new journeys carry a server-selected mode. */
export function rideMode(j:Journey):'bus'|'streetcar'|'subway'{
 if(j.vehicleMode)return j.vehicleMode;
 if(/Blue Night|shuttle bus/i.test(j.detail))return 'bus';
 if(/Line [124]/.test(j.detail))return 'subway';
 if(/streetcar/i.test(j.detail))return 'streetcar';
 return 'bus';
}
