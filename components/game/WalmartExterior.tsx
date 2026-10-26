'use client';
import type {Spot} from '@/lib/game/data';
import {Box} from './CityAssets';
import StoreSign from './StoreSign';
export default function WalmartExterior({spot:p}:{spot:Spot}){return <group position={[p.x,0,p.z]}>
 <Box p={[0,2.8,-.15]} s={[12.4,5.6,7.7]} c="#d5cdb9"/>
 {[-1,1].map(side=><Box key={side} p={[side*3.65,2.8,3.9]} s={[5.1,5.6,.2]} c="#0879c5"/>)}
 <Box p={[0,4.4,3.9]} s={[2.2,2.4,.2]} c="#0879c5"/>
 <Box p={[0,5.75,0]} s={[12.7,.3,8.25]} c="#e9e7db"/>
 <Box p={[0,1.4,3.82]} s={[2.2,2.8,.04]} c="#183a4b"/>
 <Box p={[0,3.2,4.3]} s={[4.2,.18,.9]} c="#b9c7c7"/>
 <StoreSign text="Walmart ✦" position={[0,4.6,4.02]} width={9.6} height={1.35}/>
 <StoreSign text="SUPERCENTRE · GROCERIES & MORE" position={[0,3.65,4.03]} width={9.3} height={.5}/>
 {[-4.4,-2.8,2.8,4.4].map(x=><Box key={x} p={[x,1.4,4.02]} s={[1.4,2,.04]} c="#97b4ac"/>)}
 </group>}
