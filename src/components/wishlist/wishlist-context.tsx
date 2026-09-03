"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"

type WishlistContextType={items:string[];addItem:(id:string)=>Promise<void>;removeItem:(id:string)=>Promise<void>;toggleItem:(id:string)=>Promise<void>;isInWishlist:(id:string)=>boolean}
const WishlistContext=createContext<WishlistContextType|undefined>(undefined)
export function WishlistProvider({children}:{children:ReactNode}){
 const {data:session}=useSession(); const [items,setItems]=useState<string[]>([])
 useEffect(()=>{const stored=localStorage.getItem("noore_wishlist");if(stored){try{setItems(JSON.parse(stored))}catch{setItems([])}}},[])
 useEffect(()=>{localStorage.setItem("noore_wishlist",JSON.stringify(items))},[items])
 useEffect(()=>{if(!session?.user)return;fetch("/api/wishlist").then(r=>r.ok?r.json():null).then(d=>{if(d?.items)setItems(d.items.map((x:{productId:string})=>x.productId))}).catch(()=>{})},[session?.user?.id])
 const addItem=async(id:string)=>{setItems(p=>p.includes(id)?p:[...p,id]);if(session?.user) await fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id})})}
 const removeItem=async(id:string)=>{setItems(p=>p.filter(x=>x!==id));if(session?.user) await fetch("/api/wishlist",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:id})})}
 const toggleItem=async(id:string)=>items.includes(id)?removeItem(id):addItem(id)
 return <WishlistContext.Provider value={{items,addItem,removeItem,toggleItem,isInWishlist:id=>items.includes(id)}}>{children}</WishlistContext.Provider>
}
export function useWishlist(){const c=useContext(WishlistContext);if(!c)throw new Error("useWishlist must be used within WishlistProvider");return c}
