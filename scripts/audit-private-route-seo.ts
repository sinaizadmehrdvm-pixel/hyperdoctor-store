import fs from "node:fs";

const policy=fs.readFileSync("src/lib/private-route-metadata.ts","utf8");
for(const token of ["index: false","follow: false","noarchive: true","nosnippet: true","noimageindex: true"]){
  if(!policy.includes(token))throw new Error(`private route metadata policy missing ${token}`);
}
for(const file of [
  "src/app/[locale]/cart/layout.tsx",
  "src/app/[locale]/checkout/layout.tsx",
  "src/app/[locale]/account/layout.tsx",
  "src/app/[locale]/order/layout.tsx",
]){
  const source=fs.readFileSync(file,"utf8");
  if(!source.includes("privateRouteMetadata"))throw new Error(`${file} does not enforce private-route metadata`);
}
console.log("private route SEO audit passed");
