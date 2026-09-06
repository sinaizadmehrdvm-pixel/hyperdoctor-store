import type { MetadataRoute } from "next";

function origin(){const raw=process.env.NEXT_PUBLIC_SITE_URL||"https://hyperdoctor-store.vercel.app";try{return new URL(raw).origin}catch{return "https://hyperdoctor-store.vercel.app"}}

export default function robots():MetadataRoute.Robots{
  const base=origin();
  return {
    rules:[{
      userAgent:"*",
      allow:"/",
      disallow:[
        "/admin/","/api/","/preview/",
        "/fa/account/","/tr/account/","/en/account/","/ar/account/",
        "/fa/cart","/tr/cart","/en/cart","/ar/cart",
        "/fa/checkout","/tr/checkout","/en/checkout","/ar/checkout",
        "/fa/order/","/tr/order/","/en/order/","/ar/order/"
      ]
    }],
    sitemap:`${base}/sitemap.xml`,
    host:base
  };
}
