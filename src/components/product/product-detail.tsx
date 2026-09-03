"use client"

import { useMemo, useState } from "react"
import { useCart } from "@/components/cart/cart-context"
import { ProductCard } from "./product-card"

type Variant = { id: string; color: string; size: string; sku: string; price: number | null; stock: number; images: string[] }
type Product = { id:string; name:string; slug:string; description:string|null; price:number; salePrice:number|null; images:string[]; category:string; subcategory:string|null; stock:number; sku:string; variants:Variant[] }

type Props = { product: Product; relatedProducts: any[] }

export function ProductDetail({ product, relatedProducts }: Props) {
  const { addItem } = useCart(); const [selectedImage,setSelectedImage]=useState(0); const [quantity,setQuantity]=useState(1)
  const [selectedColor,setSelectedColor]=useState(product.variants[0]?.color || ""); const [selectedSize,setSelectedSize]=useState(product.variants[0]?.size || "")
  const colors=useMemo(()=>Array.from(new Set(product.variants.map(v=>v.color))),[product.variants]); const sizes=useMemo(()=>Array.from(new Set(product.variants.map(v=>v.size))),[product.variants])
  const selectedVariant=product.variants.length ? (product.variants.find(v=>v.color===selectedColor&&v.size===selectedSize) || product.variants.find(v=>v.color===selectedColor) || product.variants[0]) : null
  const currentPrice=selectedVariant?.price ?? product.salePrice ?? product.price; const regularPrice=product.price; const isOnSale=!selectedVariant?.price && !!product.salePrice && product.salePrice<product.price; const discount=isOnSale?Math.round(((product.price-product.salePrice!)/product.price)*100):0
  const inStock=selectedVariant ? selectedVariant.stock>0 : product.stock>0; const availableStock=selectedVariant?.stock ?? product.stock
  const images=selectedVariant?.images?.length ? selectedVariant.images : product.images

  const chooseColor=(color:string)=>{setSelectedColor(color); const match=product.variants.find(v=>v.color===color&&v.size===selectedSize); if(!match){const first=product.variants.find(v=>v.color===color); if(first)setSelectedSize(first.size)}; setSelectedImage(0)}
  const chooseSize=(size:string)=>{setSelectedSize(size); const match=product.variants.find(v=>v.color===selectedColor&&v.size===size); if(!match){const first=product.variants.find(v=>v.size===size); if(first)setSelectedColor(first.color)}; setSelectedImage(0)}
  const handleAddToCart=()=>{ if(!inStock)return; addItem({id:selectedVariant?.id || product.id,productId:product.id,variantId:selectedVariant?.id,name:product.name,price:currentPrice,image:images[0]||"/placeholder.jpg",slug:product.slug,quantity,variantLabel:selectedVariant?`${selectedVariant.color} / ${selectedVariant.size}`:undefined}); }

  return <div>
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      <div><div className="aspect-[3/4] bg-cream rounded-lg overflow-hidden"><img src={images[selectedImage]||"/placeholder.jpg"} alt={product.name} className="w-full h-full object-cover" /></div>{images.length>1&&<div className="flex gap-2 mt-4">{images.map((img,i)=><button key={i} onClick={()=>setSelectedImage(i)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage===i?"border-charcoal":"border-cream"}`}><img src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" /></button>)}</div>}</div>
      <div>
        <div className="flex items-center gap-2 text-sm text-secondary"><span>{product.category}</span>{product.subcategory&&<><span>•</span><span>{product.subcategory}</span></>}</div>
        <h1 className="font-editorial text-3xl md:text-4xl font-semibold mt-2">{product.name}</h1><p className="text-sm text-secondary mt-1">SKU: {selectedVariant?.sku || product.sku}</p>
        <div className="flex items-center gap-3 mt-4"><span className="text-2xl font-bold">PKR {currentPrice.toLocaleString()}</span>{isOnSale&&<><span className="text-lg text-secondary line-through">PKR {regularPrice.toLocaleString()}</span><span className="bg-red-100 text-red-600 text-sm font-semibold px-2 py-1 rounded">{discount}% OFF</span></>}</div>
        <div className="mt-4"><p className={`text-sm font-medium ${inStock?"text-green-600":"text-red-600"}`}>{inStock?`✅ In Stock (${availableStock} available)`:"❌ Out of Stock"}</p></div>
        {product.variants.length>0&&<div className="mt-6 space-y-4"><div><label className="block text-sm font-medium mb-2">Color: <span className="font-normal">{selectedColor}</span></label><div className="flex flex-wrap gap-2">{colors.map(color=><button type="button" key={color} onClick={()=>chooseColor(color)} className={`px-4 py-2 rounded border text-sm ${selectedColor===color?"border-charcoal bg-charcoal text-white":"border-cream hover:border-charcoal"}`}>{color}</button>)}</div></div><div><label className="block text-sm font-medium mb-2">Size: <span className="font-normal">{selectedSize}</span></label><div className="flex flex-wrap gap-2">{sizes.map(size=><button type="button" key={size} onClick={()=>chooseSize(size)} className={`px-4 py-2 rounded border text-sm ${selectedSize===size?"border-charcoal bg-charcoal text-white":"border-cream hover:border-charcoal"}`}>{size}</button>)}</div></div></div>}
        {product.description&&<div className="mt-6 border-t border-cream pt-4"><p className="text-secondary text-sm leading-relaxed">{product.description}</p></div>}
        <div className="mt-6 space-y-4"><div className="flex items-center gap-4"><label className="text-sm font-medium">Quantity</label><div className="flex border border-cream rounded"><button onClick={()=>setQuantity(Math.max(1,quantity-1))} className="px-3 py-1">-</button><span className="px-4 py-1 min-w-[40px] text-center">{quantity}</span><button onClick={()=>setQuantity(Math.min(Math.max(1,availableStock),quantity+1))} className="px-3 py-1">+</button></div></div><div className="flex flex-col sm:flex-row gap-3"><button onClick={handleAddToCart} disabled={!inStock} className={`flex-1 py-3 px-6 rounded font-medium ${inStock?"bg-charcoal text-white hover:bg-charcoal/80":"bg-gray-200 text-gray-500 cursor-not-allowed"}`}>{inStock?"Add to Bag":"Out of Stock"}</button><button className="py-3 px-6 border border-cream rounded font-medium">♡ Wishlist</button></div></div>
      </div>
    </div>
    {relatedProducts.length>0&&<div className="mt-16"><h2 className="font-editorial text-2xl font-semibold mb-6">You May Also Like</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{relatedProducts.map((p:any)=><ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={p.price} salePrice={p.salePrice} image={p.images[0]||"/placeholder.jpg"} category={p.category} stock={p.stock}/>)}</div></div>}
  </div>
}
