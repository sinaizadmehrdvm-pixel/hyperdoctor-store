export type SiteSkuSuggestion={
  suggestedSiteSku:string;
  confidence:"HIGH";
  source:string;
  sourceName:string;
  rationale:string;
};

// Suggestions only. They never verify identity automatically and never carry price/stock.
// These four matches are deliberately limited to unambiguous product-name matches in the
// Hyper Doctor internal inventory snapshot. Ambiguous color/firmness variants are excluded.
export const HOOSHMAND_SITE_SKU_SUGGESTIONS:Record<string,SiteSkuSuggestion>={
  "6260770225407":{
    suggestedSiteSku:"HD-4-P-120001",
    confidence:"HIGH",
    source:"hyperdoctor_products_ready_for_import.xlsx",
    sourceName:"بالش موج مديوم هوشمند",
    rationale:"Internal Hyper Doctor snapshot name matches the Hooshmand Wave Medium product without a competing size/color/firmness variant in the mapped record.",
  },
  "6260770232009":{
    suggestedSiteSku:"HD-4-P-120003",
    confidence:"HIGH",
    source:"hyperdoctor_products_ready_for_import.xlsx",
    sourceName:"بالشت مدل سفري هوشمند",
    rationale:"Internal Hyper Doctor snapshot name matches the Hooshmand Travel Pillow product.",
  },
  "6260770211561":{
    suggestedSiteSku:"HD-4-P-120004",
    confidence:"HIGH",
    source:"hyperdoctor_products_ready_for_import.xlsx",
    sourceName:"بالشت کلاسيک L هوشمند",
    rationale:"Internal Hyper Doctor snapshot explicitly identifies Hooshmand Classic L.",
  },
  "6260770211578":{
    suggestedSiteSku:"HD-4-P-120005",
    confidence:"HIGH",
    source:"hyperdoctor_products_ready_for_import.xlsx",
    sourceName:"بالشت کلاسيکXL هوشمند",
    rationale:"Internal Hyper Doctor snapshot explicitly identifies Hooshmand Classic XL.",
  },
};
