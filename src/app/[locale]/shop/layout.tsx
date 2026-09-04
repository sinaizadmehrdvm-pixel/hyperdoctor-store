import { getLocale } from "next-intl/server";
import { CatalogFilterBar } from "@/components/site/catalog-filter-bar";
import { getCatalogFacets } from "@/lib/queries";

export default async function ShopLayout({children}:{children:React.ReactNode}){const[locale,facets]=await Promise.all([getLocale(),getCatalogFacets()]);return <><CatalogFilterBar locale={locale} brands={facets.brands} terms={facets.terms}/>{children}</>}
