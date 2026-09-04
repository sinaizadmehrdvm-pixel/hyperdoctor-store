import { getLocale } from "next-intl/server";
import { CatalogFilterBar } from "@/components/site/catalog-filter-bar";
import { getCatalogFacets,getShopFilterState } from "@/lib/queries";

export default async function ShopLayout({children}:{children:React.ReactNode}){const[locale,facets,state]=await Promise.all([getLocale(),getCatalogFacets(),getShopFilterState()]);return <><CatalogFilterBar locale={locale} brands={facets.brands} terms={facets.terms} brandId={state.brandId} termIds={state.termIds}/>{children}</>}
