import {NextResponse} from "next/server";
import {getPublicProductCollections} from "@/lib/catalog-extensions";

const SAFE_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request:Request){
  const productId=new URL(request.url).searchParams.get("productId")?.trim()||"";
  if(!SAFE_ID.test(productId))return NextResponse.json({collections:[]},{status:400,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  const collections=await getPublicProductCollections(productId);
  return NextResponse.json({collections},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600","X-Content-Type-Options":"nosniff"}});
}
