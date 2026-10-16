import prices from '../../config/activities.json';
import type {GameState,Command} from './engine';
import type {DistrictId,Need} from './data';
import {DISTRICT_CONTENT} from './district-content';
import {placeById,entrance,distance} from './world';
import {dateKey,seasonAt,isOpen} from './calendar';
import {gameDate} from './transit';
import {advanceLife} from './life';
import {NEIGHBOURS,TOPICS,personAt} from './schedules';
export type CommunityState={version:1;completed:Record<string,string>;stamps:string[];conversations:Record<string,string>;friendDays:Record<string,string>;errand:{district:DistrictId;expires:number}|null;deliveries:Partial<Record<DistrictId,string>>};
export const initialCommunity=():CommunityState=>({version:1,completed:{},stamps:[],conversations:{},friendDays:{},errand:null,deliveries:{}});
export type Activity={id:string;district:DistrictId;place:string;title:string;description:string;minutes:number;cost:number;needs:Partial<Record<Need,number>>;hours?:[number,number];days?:number[];season?:string;unlock:number;animation:string};
// Each district has twenty distinct activities at eight different places. These are
// simulated programmes, not advertised real events. Costs live in config/activities.json.
const recipes:{key:string;slot:number;title:string;description:string;minutes:number;cost?:keyof typeof prices.costs;needs:Partial<Record<Need,number>>;hours?:[number,number];days?:number[];season?:string;unlock?:number;animation?:string}[]=[
 {key:'snack',slot:0,title:'Try a neighbourhood snack',description:'Choose a small bite and swap recommendations with a stallholder.',minutes:20,cost:'snack',needs:{hunger:30,fun:8}},
 {key:'browse',slot:7,title:'Browse the community swap shelf',description:'Discover a used book or a useful idea. No purchase needed.',minutes:20,needs:{fun:12}},
 {key:'sketch',slot:4,title:'Sketch the neighbourhood',description:'Spend a quiet half hour recording the shapes around you.',minutes:30,needs:{fun:20},animation:'sit'},
 {key:'read',slot:3,title:'Read a local story',description:'Settle in with a neighbourhood writer’s story.',minutes:30,needs:{fun:18,energy:8},animation:'sit'},
 {key:'stretch',slot:2,title:'Take a gentle stretch break',description:'Pause on the public paths and loosen up.',minutes:20,needs:{energy:15,fun:10}},
 {key:'photo',slot:6,title:'Make a garden photo journal',description:'Look for small details, textures and colours.',minutes:25,needs:{fun:18},animation:'phone'},
 {key:'coffee',slot:1,title:'Join the café conversation table',description:'Share a table and hear a few neighbourhood stories.',minutes:30,cost:'coffee',needs:{social:25,energy:10},animation:'coffee'},
 {key:'shelves',slot:3,title:'Help sort the reading shelf',description:'Help a volunteer find a home for donated books.',minutes:30,needs:{social:18,fun:12},animation:'bag'},
 {key:'studio',slot:5,title:'Try a small craft project',description:'Use shared materials to make something to remember the district.',minutes:45,cost:'studio',needs:{fun:30}},
 {key:'repair',slot:7,title:'Learn a simple mending trick',description:'Practice a small repair with reusable materials.',minutes:30,cost:'repair',needs:{fun:15,social:10}},
 {key:'lunch',slot:1,title:'Neighbourhood lunch table',description:'A relaxed lunchtime meal with a shared table.',minutes:45,cost:'lunch',needs:{hunger:55,social:20},hours:[12,14],animation:'coffee'},
 {key:'morning',slot:2,title:'Early-bird park circle',description:'Meet walkers for a gentle start to the day.',minutes:30,needs:{energy:15,social:15},hours:[7,9]},
 {key:'evening',slot:5,title:'Evening story circle',description:'Listen to residents’ fictional stories and add your own.',minutes:45,needs:{social:30,fun:25},hours:[17,20],days:[1,2,3,4,5],animation:'talk'},
 {key:'weekend',slot:7,title:'Weekend makers browse',description:'A simulated weekend gathering of local crafts and ideas.',minutes:45,cost:'market',needs:{fun:25,social:15},hours:[10,16],days:[0,6]},
 {key:'winter',slot:6,title:'Winter garden sketchbook',description:'Look for winter silhouettes from the public garden paths.',minutes:25,needs:{fun:20},hours:[10,16],season:'winter'},
 {key:'spring',slot:6,title:'Spring seed-planning circle',description:'Plan a small garden together; no tools or experience needed.',minutes:40,needs:{social:20,fun:25},hours:[10,17],season:'spring'},
 {key:'summer',slot:2,title:'Summer picnic stories',description:'Share stories in the park while the long days last.',minutes:45,needs:{social:25,fun:25},hours:[12,18],season:'summer'},
 {key:'autumn',slot:6,title:'Autumn colour journal',description:'Collect impressions of changing leaves without leaving the paths.',minutes:30,needs:{fun:25,energy:10},hours:[10,17],season:'autumn'},
 {key:'workshop',slot:5,title:'Resident-led workshop',description:'Three different district activities unlock a guided creative session.',minutes:60,cost:'workshop',needs:{fun:35,social:25},unlock:3},
 {key:'host',slot:5,title:'Help host a community session',description:'Six different activities unlock a chance to welcome new neighbours.',minutes:60,cost:'host',needs:{social:35,fun:30},hours:[14,17],unlock:6,animation:'talk'}
];
export const ACTIVITIES:Activity[]=DISTRICT_CONTENT.flatMap(d=>recipes.map(r=>({id:d.district+':'+r.key,district:d.district,place:d.places[r.slot],title:r.title,description:r.description+' Explore '+d.theme+'.',minutes:r.minutes,cost:r.cost?prices.costs[r.cost]:0,needs:r.needs,hours:r.hours,days:r.days,season:r.season,unlock:r.unlock||0,animation:r.animation||'idle'})));
export const districtStamps=(s:GameState,id:DistrictId)=>(s.community?.stamps||[]).filter(key=>ACTIVITIES.some(a=>a.id===key&&a.district===id)).length;
export const activitySchedule=(a:Activity)=>[a.season,a.days?.map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join('/'),a.hours?`${a.hours[0]}:00–${a.hours[1]}:00`:'During venue hours'].filter(Boolean).join(' · ');
export function activityTiming(a:Activity,minutes:number){if(a.season&&seasonAt(minutes)!==a.season)return `Returns in ${a.season}.`;if(a.days&&!a.days.includes(gameDate(minutes).getUTCDay()))return activitySchedule(a);const hour=(minutes%1440)/60;if(a.hours&&(hour<a.hours[0]||hour+a.minutes/60>a.hours[1]))return activitySchedule(a);if(!isOpen(placeById(a.place)!,minutes,a.minutes))return 'The venue is closed or closing.';return null;}
export function activityBlock(s:GameState,a:Activity){if(s.journey)return 'Finish your journey first.';if(s.needs.energy<20)return 'Rest before joining an activity.';if(s.needs.bladder<15)return 'Use a washroom first.';if(s.life.illUntil>s.minutes)return 'Rest until you feel well.';if(s.needs.hunger<15&&!a.needs.hunger)return 'Eat before joining an activity.';if(districtStamps(s,a.district)<a.unlock)return `Earn ${a.unlock} different activity stamps in this district.`;if(s.community?.completed[a.id]===dateKey(s.minutes))return 'Completed today. Come back tomorrow.';return activityTiming(a,s.minutes)||(s.cash<a.cost?'Not enough funds. Try a free activity.':null);}
function at(s:GameState,id:string){return !s.journey&&distance(s.position,entrance(placeById(id)!))<=3;}
function requireAt(s:GameState,id:string,duration=0){if(!at(s,id))throw new Error(`Walk to ${placeById(id)!.name} first.`);if(!isOpen(placeById(id)!,s.minutes,duration))throw new Error('The venue is closed or closing. Return during opening hours.');}
function boost(s:GameState,needs:Partial<Record<Need,number>>){for(const [key,v]of Object.entries(needs))s.needs[key as Need]=Math.min(100,s.needs[key as Need]+v!);}
export function errandFor(district:DistrictId){const d=DISTRICT_CONTENT.find(d=>d.district===district)!;return {district,from:d.places[7],to:d.places[5],title:d.label+' community delivery',description:'Carry a donated craft-material bag from the exchange to the makers room.',reward:prices.errandReward};}
export function communityAction(s:GameState,c:Command):string|null{
 const state=s.community??=initialCommunity(),today=dateKey(s.minutes);
 if(c.type==='district_activity'){
  const a=ACTIVITIES.find(a=>a.id===c.id);if(!a)throw new Error('Choose an activity from the district board.');requireAt(s,a.place,a.minutes);const reason=activityBlock(s,a);if(reason)throw new Error(reason);
  s.cash-=a.cost;advanceLife(s,a.minutes);boost(s,a.needs);state.completed[a.id]=today;const fresh=!state.stamps.includes(a.id);if(fresh)state.stamps.push(a.id);s.life.animation=a.animation;s.life.animationUntil=Date.now()+6000;
  if(a.cost)s.life.ledger=[{text:a.title,amount:-a.cost,date:today},...s.life.ledger].slice(0,100);
  const count=districtStamps(s,a.district);return `${a.title} complete.${fresh?' New community stamp!':''}${fresh&&count===3?' Resident-led workshop unlocked.':fresh&&count===6?' Community hosting unlocked.':''}`;
 }
 if(c.type==='community_errand'){
  if(!DISTRICT_CONTENT.some(d=>d.district===c.id))throw new Error('Choose a district delivery.');const errand=errandFor(c.id as DistrictId);
  if(c.mode==='abandon'){if(state.errand?.district!==errand.district)throw new Error('No matching delivery to put down.');state.errand=null;return 'Delivery released. There is no penalty or payment.';}
  if(s.needs.energy<20||s.needs.hunger<15||s.life.illUntil>s.minutes)throw new Error('Eat and rest before handling a delivery.');
  if(c.mode==='accept'){requireAt(s,errand.from,10);if(state.errand)throw new Error('Finish or release your current delivery first.');if(state.deliveries[errand.district]===today)throw new Error('This district already received a delivery today.');advanceLife(s,10);state.errand={district:errand.district,expires:s.minutes+prices.errandDeadlineMinutes};s.life.animation='bag';s.life.animationUntil=Date.now()+6000;return `Bag collected. Deliver to ${placeById(errand.to)!.name} within 36 game hours.`;}
  if(c.mode!=='deliver'||state.errand?.district!==errand.district)throw new Error('Collect the delivery bag at the exchange first.');if(s.minutes+10>state.errand.expires)throw new Error('This delivery expired. Release it and collect a new bag.');requireAt(s,errand.to,10);if(state.deliveries[errand.district]===today)throw new Error('This district already received a delivery today.');advanceLife(s,10);s.cash+=errand.reward;s.earned+=errand.reward;state.deliveries[errand.district]=dateKey(s.minutes);state.errand=null;s.life.ledger=[{text:errand.title+' · game stipend',amount:errand.reward,date:dateKey(s.minutes)},...s.life.ledger].slice(0,100);return `Delivery complete. $${errand.reward/100} game stipend received.`;
 }
 if(c.type==='talk'){
  const p=NEIGHBOURS.find(p=>p.id===c.id);if(!p)throw new Error('Choose a neighbour.');const place=personAt(p.id,s.minutes,30);if(!place)throw new Error(`${p.name} is away or about to leave. Check their schedule in People.`);requireAt(s,place,30);
  const topic=TOPICS.find(t=>t.id===(c.mode||'hello'));if(!topic)throw new Error('Choose a conversation topic.');const friendship=s.friends[p.id]||0;if(friendship<topic.friendship)throw new Error('Get to know this neighbour first.');const key=p.id+':'+topic.id;if(state.conversations[key]===today)throw new Error('You already talked about this today. Try another topic or return tomorrow.');
  state.conversations[key]=today;advanceLife(s,30);boost(s,{social:30,fun:12});if(state.friendDays[p.id]!==today){s.friends[p.id]=friendship+1;state.friendDays[p.id]=today;}s.life.animation='talk';s.life.animationUntil=Date.now()+6000;
  return `${p.name}: “${p.lines[topic.id==='local'?0:topic.id==='story'?2:1]}”${friendship===0?' Local tips unlocked.':''}`;
 }
 return null;
}
