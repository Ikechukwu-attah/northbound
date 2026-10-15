export type DistrictId = 'toronto'|'north-york'|'scarborough'|'etobicoke'|'york'|'east-york';
export type Need = 'energy'|'hunger'|'fun'|'social'|'hygiene'|'bladder';
export type SpotKind = 'cafe'|'park'|'market'|'landmark'|'library'|'home'|'service';
export type Spot = {id:string;name:string;kind:SpotKind;x:number;z:number;color:string;description:string;activity:string};
export type District = {id:DistrictId;name:string;subtitle:string;blurb:string;color:string;spots:Spot[]};
export const DISTRICTS:District[] = [
 {id:'toronto',name:'Old Toronto',subtitle:'BIG CITY. YOUR STORY.',blurb:'Streetcars, skyline views, and a little possibility on every corner.',color:'#bc7650',spots:[
  {id:'kensington',name:'Kensington Market',kind:'market',x:-14,z:-12,color:'#ce8169',description:'Colourful storefronts, vintage finds and something delicious around the corner.',activity:'Taste the neighbourhood'},
  {id:'queen',name:'Queen West Café',kind:'cafe',x:13,z:0,color:'#e9c477',description:'Your new regular spot. Good coffee, warm pastries, and familiar faces.',activity:'Coffee & a sandwich'},
  {id:'cn',name:'CN Tower',kind:'landmark',x:-14,z:9,color:'#e5dfce',description:'A very Toronto kind of perspective. Take in the skyline from above.',activity:'Visit the observation deck'},
  {id:'waterfront',name:'Harbourfront',kind:'park',x:12,z:14,color:'#709686',description:'A lakeside breather with sailboats, fresh air and a view that never gets old.',activity:'Walk by the lake'},
  {id:'reference',name:'City Library',kind:'library',x:13,z:-12,color:'#b5977b',description:'A quiet corner to learn something new and invest in your next chapter.',activity:'Build your skills'},
  {id:'home',name:'Your place',kind:'home',x:-14,z:0,color:'#b67f62',description:'A small rented room. A big beginning. Make yourself at home.',activity:'Head home'}]},
 {id:'north-york',name:'North York',subtitle:'ROOM TO GROW.',blurb:'Glass towers, neighbourhood cafés, and a quiet moment at Mel Lastman Square.',color:'#7b989a',spots:[
  {id:'mel',name:'Mel Lastman Square',kind:'park',x:12,z:13,color:'#719581',description:'A civic square for a lunch break and a little people-watching.',activity:'Enjoy the square'},
  {id:'willowdale',name:'Willowdale Café',kind:'cafe',x:-14,z:0,color:'#d3a278',description:'A friendly café tucked between the towers.',activity:'Coffee & a sandwich'},
  {id:'nylibrary',name:'North York Central Library',kind:'library',x:13,z:-12,color:'#91a5a4',description:'Find your focus and work toward a new career.',activity:'Build your skills'},
  {id:'yonges',name:'Yonge Street Shops',kind:'market',x:-14,z:-12,color:'#ba8669',description:'A lively stretch of shops and international flavours.',activity:'Taste the neighbourhood'},
  {id:'nycentre',name:'North York Centre',kind:'landmark',x:-14,z:11,color:'#8babaf',description:'A different skyline, another side of your city.',activity:'Explore the neighbourhood'}]},
 {id:'scarborough',name:'Scarborough',subtitle:'A DIFFERENT KIND OF BLUE.',blurb:'Big lake views, local flavours, and trails worth taking the long way for.',color:'#b0a080',spots:[
  {id:'bluffs',name:'Scarborough Bluffs',kind:'landmark',x:-14,z:10,color:'#d9c7a2',description:'Pale cliffs rise over the water. Enjoy the view from the marked paths.',activity:'Take in the lake views'},
  {id:'stc',name:'Scarborough Town Centre',kind:'market',x:-14,z:-12,color:'#bf9577',description:'Meet up, grab a bite and browse a little.',activity:'Taste the neighbourhood'},
  {id:'scafe',name:'Neighbourhood Kitchen',kind:'cafe',x:13,z:0,color:'#d9b477',description:'A warm meal inspired by Scarborough’s diverse food scene.',activity:'Sit down for lunch'},
  {id:'rouge',name:'Rouge Trail',kind:'park',x:13,z:13,color:'#7e9a70',description:'Trade the city bustle for a peaceful woodland walk.',activity:'Explore the trail'},
  {id:'slibrary',name:'Community Library',kind:'library',x:13,z:-12,color:'#a19b8a',description:'New skills start with one focused afternoon.',activity:'Build your skills'}]},
 {id:'etobicoke',name:'Etobicoke',subtitle:'LIFE BY THE WATER.',blurb:'Humber Bay breezes, Mimico mornings, and a slower lakeside rhythm.',color:'#769c95',spots:[
  {id:'humber',name:'Humber Bay',kind:'landmark',x:-14,z:10,color:'#b7c7c4',description:'Walk the waterfront and spot the skyline across the bay.',activity:'Take a waterfront walk'},
  {id:'mimico',name:'Mimico Bakery',kind:'cafe',x:13,z:0,color:'#ddb283',description:'Fresh bread, a hot drink, and an unhurried start.',activity:'Bakery lunch'},
  {id:'islington',name:'Islington Village',kind:'market',x:-14,z:-12,color:'#c68d75',description:'Neighbourhood shops and a creative village spirit.',activity:'Browse the village'},
  {id:'colonel',name:'Lakeshore Park',kind:'park',x:13,z:13,color:'#8d9b70',description:'Trees, lake air, and space to clear your head.',activity:'Unwind by the water'},
  {id:'elibrary',name:'Neighbourhood Library',kind:'library',x:13,z:-12,color:'#a8ada0',description:'A welcoming place to learn and plan your next move.',activity:'Build your skills'}]},
 {id:'york',name:'York',subtitle:'FIND YOUR LOCAL.',blurb:'Neighbourhood shops, the Humber River, and people who remember your name.',color:'#ba9378',spots:[
  {id:'weston',name:'Weston Village',kind:'market',x:-14,z:-12,color:'#be7c62',description:'Local storefronts and a village with a story of its own.',activity:'Explore local shops'},
  {id:'eglinton',name:'Eglinton West Kitchen',kind:'cafe',x:13,z:0,color:'#e0b171',description:'A good meal and an easy conversation in the neighbourhood.',activity:'Enjoy a neighbourhood meal'},
  {id:'humbertrail',name:'Humber River Trail',kind:'park',x:13,z:13,color:'#739072',description:'Follow the river for a restorative afternoon outdoors.',activity:'Walk the river trail'},
  {id:'yorklibrary',name:'Local Library',kind:'library',x:13,z:-12,color:'#c4a286',description:'A little time spent learning goes a long way.',activity:'Build your skills'},
  {id:'westonsquare',name:'Weston Square',kind:'landmark',x:-14,z:10,color:'#bd8b72',description:'Meet the neighbours and enjoy a slower city afternoon.',activity:'Explore the neighbourhood'}]},
 {id:'east-york',name:'East York',subtitle:'MAKE YOURSELF AT HOME.',blurb:'Leafy residential streets, friendly local spots, and room to breathe.',color:'#959c70',spots:[
  {id:'eymarket',name:'Neighbourhood Market',kind:'market',x:-14,z:-12,color:'#ca896a',description:'Pick up a bite and support a small neighbourhood shop.',activity:'Browse the local market'},
  {id:'eycafe',name:'Coxwell Café',kind:'cafe',x:13,z:0,color:'#ddba8a',description:'A sunlit table, a good sandwich and a break from the rush.',activity:'Coffee & a sandwich'},
  {id:'taylor',name:'Taylor Creek Trail',kind:'park',x:13,z:13,color:'#85976d',description:'A leafy trail through the valley for an afternoon reset.',activity:'Walk the valley trail'},
  {id:'eylibrary',name:'Community Library',kind:'library',x:13,z:-12,color:'#cbb392',description:'Bring your curiosity. Leave with more confidence.',activity:'Build your skills'},
  {id:'eycentre',name:'East York Community Centre',kind:'landmark',x:-14,z:10,color:'#c59570',description:'Meet people and feel a little more at home.',activity:'Join a community afternoon'}]}
];
export const JOBS=[
 {id:'barista',name:'Neighbourhood barista',place:'Queen West Café',pay:9600,skill:0,description:'Make coffee, learn names, brighten someone’s morning.'},
 {id:'courier',name:'Bicycle courier',place:'Citywide deliveries',pay:11000,skill:1,description:'Learn the city one delivery at a time.'},
 {id:'gallery',name:'Gallery assistant',place:'Arts & culture',pay:13500,skill:2,description:'Help Toronto’s creative side shine.'},
 {id:'developer',name:'Junior developer',place:'Downtown studio',pay:20000,skill:5,description:'Turn your library afternoons into a new career.'}
];
export const PEOPLE=[
 {id:'maya',name:'Maya',role:'Your café regular',color:'#bd6c4e',greeting:'“The best thing about this city? You can find your people anywhere.”',lines:['Try a different neighbourhood today. Your favourite spot might still be waiting for you.','My rule? Always leave a little time for the lake.','You’re becoming a familiar face around here!']},
 {id:'dev',name:'Dev',role:'Neighbour & city explorer',color:'#668b7d',greeting:'“A new city is just a collection of places you haven’t made memories in yet.”',lines:['Scarborough has some of my favourite food. Go hungry.','The streetcars are practically part of the skyline.','Let’s meet by the waterfront next time.']},
 {id:'amina',name:'Amina',role:'Library mentor',color:'#a389ad',greeting:'“Start small. Show up. You’ll be surprised how far you get.”',lines:['One study session at a time. Progress adds up.','Remember to rest. Even big dreams need a good night’s sleep.','The downtown studios are hiring people with a few skills under their belt.']}
];
export const districtById=(id:string)=>DISTRICTS.find(d=>d.id===id)!;
export const money=(cents:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:cents%100?2:0}).format(cents/100);
export const NEED_LABELS:Record<Need,string>={energy:'Energy',hunger:'Food',fun:'Happiness',social:'Social',hygiene:'Hygiene',bladder:'Comfort'};
