import { getLocale } from "next-intl/server";
import { CatalogFilterBar } from "@/components/site/catalog-filter-bar";
import { getPublishedCatalogFacets } from "@/lib/catalog-facets";

export default async function ShopLayout({children}:{children:React.ReactNode}){const[locale,facets]=await Promise.all([getLocale(),getPublishedCatalogFacets()]);return <><CatalogFilterBar locale={locale} brands={facets.brands} terms={facets.terms} attributes={facets.attributes}/>{children}</>}
