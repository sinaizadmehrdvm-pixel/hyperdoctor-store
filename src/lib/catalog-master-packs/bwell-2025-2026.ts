export type VerifiedCatalogMasterItem={
  rowNumber:number;
  payload:Record<string,unknown>;
  images:string[];
  evidence:Record<string,unknown>;
};

const names=(model:string,type:{fa:string;tr:string;en:string;ar:string})=>({
  nameFa:`${type.fa} B.Well ${model}`,
  nameTr:`B.Well ${model} ${type.tr}`,
  nameEn:`B.Well ${model} ${type.en}`,
  nameAr:`${type.ar} B.Well ${model}`,
});

const nebulizer={fa:"نبولایزر",tr:"Nebülizatör",en:"Nebulizer",ar:"جهاز رذاذ"};
const pulseOximeter={fa:"پالس اکسیمتر",tr:"Pulse Oksimetre",en:"Pulse Oximeter",ar:"مقياس التأكسج النبضي"};

function product(model:string,categorySlug:string,slug:string,localized:ReturnType<typeof names>,specs:Record<string,unknown>,page:number,sourceExcerpt:string):VerifiedCatalogMasterItem{
  return {
    rowNumber:page*100+Number(model.replace(/\D/g,"").slice(-2)||0),
    payload:{
      sku:model,
      categorySlug,
      vertical:"MEDICAL_EQUIPMENT",
      slug,
      ...localized,
      descriptionFa:"",
      descriptionTr:"",
      descriptionEn:"",
      descriptionAr:"",
      brand:"B.Well",
      modelNumber:model,
      manufacturer:"B.Well Swiss AG",
      countryOfOrigin:"",
      price:"0",
      stock:"0",
      lowStockThreshold:"2",
      minOrderQty:"1",
      specs:JSON.stringify(specs),
      tags:JSON.stringify(["bwell",model.toLowerCase()]),
      isPublished:false,
      isFeatured:false,
      isNewArrival:false,
    },
    images:[],
    evidence:{
      source:"B.Well Catalogue 2025-2026 EN",
      page,
      model,
      excerpt:sourceExcerpt,
      verification:"catalog_text",
    },
  };
}

export const BWELL_2025_2026_SOURCE={
  sourceType:"CATALOG",
  title:"B.Well Catalogue 2025-2026 EN",
  reference:"Catalogue_2025-2026_EN_compressed.pdf",
  notes:"Verified starter master derived only from the supplied B.Well 2025-2026 English catalogue. No current Hyper Doctor price, stock, warranty, barcode, GTIN or product image is inferred.",
} as const;

export const BWELL_2025_2026_STARTER:VerifiedCatalogMasterItem[]=[
  product("PRO-118","respiratory","bwell-pro-118-steam-inhaler",names("PRO-118",{fa:"دستگاه بخور و استنشاق بخار",tr:"Buhar İnhalatörü",en:"Steam Inhaler",ar:"جهاز استنشاق بالبخار"}),{type:"steam inhaler",sizeMm:"235 × 90 × 260",weightKg:"~0.560",capacityMl:80,particleSize:">10 μm",nebulizationRate:"~10.6 ml/min"},28,"Technical table lists steam inhaler size, weight, 80 ml capacity, particle size >10 μm and ~10.6 ml/min rate."),
  product("PRO-110","respiratory","bwell-pro-110-compressor-nebulizer",names("PRO-110",{fa:"نبولایزر کمپرسوری",tr:"Kompresörlü Nebülizatör",en:"Compressor Nebulizer",ar:"جهاز رذاذ ضاغط"}),{type:"compressor",sizeMm:"137 × 173 × 96",weightKg:"1.345",medicineCapacityMl:"2-8",mmad:"~3.16 μm",fpd:">=70%",nebulizationRate:"0.4 ml/min"},28,"Technical table lists compressor type, 137 × 173 × 96 mm, 1.345 kg, 2-8 ml, MMAD ~3.16 μm, FPD >=70% and 0.4 ml/min."),
  product("PRO-100","respiratory","bwell-pro-100-compressor-nebulizer",names("PRO-100",{fa:"نبولایزر کمپرسوری",tr:"Kompresörlü Nebülizatör",en:"Compressor Nebulizer",ar:"جهاز رذاذ ضاغط"}),{type:"compressor",sizeMm:"115 × 85 × 140",weightKg:"0.85",medicineCapacityMl:"2-6",mmad:"~2.1 μm",fpd:"72%",nebulizationRate:"0.3 ml/min"},28,"Technical table lists 115 × 85 × 140 mm, 0.85 kg, 2-6 ml, MMAD ~2.1 μm, FPD 72% and 0.3 ml/min."),
  product("MED-120","respiratory","bwell-med-120-nebulizer",names("MED-120",nebulizer),{sizeMm:"100 × 54 × 51",weightKg:"0.235",medicineCapacityMl:"2-6",mmad:"<=2.9 μm",fpd:">=71%",nebulizationRate:"0.3 ml/min"},28,"Technical table lists 100 × 54 × 51 mm, 0.235 kg, 2-6 ml, MMAD <=2.9 μm, FPD >=71% and 0.3 ml/min."),
  product("MED-130","respiratory","bwell-med-130-compressor-nebulizer",names("MED-130",{fa:"نبولایزر کمپرسوری",tr:"Kompresörlü Nebülizatör",en:"Compressor Nebulizer",ar:"جهاز رذاذ ضاغط"}),{type:"compressor",sizeMm:"137 × 173 × 96",weightKg:"1.3",mmad:"~2.1 μm",fpd:"85%",nebulizationRate:"0.2-0.4 ml/min"},28,"Technical table lists 137 × 173 × 96 mm, 1.3 kg, MMAD ~2.1 μm, FPD 85% and 0.2-0.4 ml/min."),
  product("MED-111","respiratory","bwell-med-111-compressor-nebulizer",names("MED-111",{fa:"نبولایزر کمپرسوری",tr:"Kompresörlü Nebülizatör",en:"Compressor Nebulizer",ar:"جهاز رذاذ ضاغط"}),{type:"compressor",sizeMm:"238 × 148 × 120",weightKg:"1.3"},28,"Technical table identifies MED-111 at 238 × 148 × 120 mm and 1.3 kg; no unambiguous additional numeric fields are inferred here."),
  product("MED-325","home-care","bwell-med-325-pulse-oximeter",names("MED-325",pulseOximeter),{measurements:["SpO2","perfusion index (PI)","pulse rate"],display:["histogram","pulse waveform"],displayFormats:6,antiShake:true},19,"Catalogue states simultaneous SpO2, PI, pulse rate, histogram and waveform display, six display formats and anti-shaking technology."),
  product("PRO-310","home-care","bwell-pro-310-pulse-oximeter",names("PRO-310",pulseOximeter),{measurements:["SpO2","perfusion index (PI)","pulse rate"],display:["histogram","pulse waveform"],autoRotatingDisplay:true},20,"Catalogue lists SpO2, PI, pulse rate, histogram and waveform with an auto-rotating display."),
  product("MED-320","home-care","bwell-med-320-pulse-oximeter",names("MED-320",pulseOximeter),{},20,"Catalogue identifies MED-320 as a fingertip pulse oximeter; no unsupported technical values are inferred in this starter record."),
];
