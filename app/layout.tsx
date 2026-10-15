import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Northbound — A Toronto Life',description:'A little north. A whole new life. Explore a miniature 3D Toronto, find your people, and write your own story.',icons:{icon:'/favicon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f6f3eb'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
