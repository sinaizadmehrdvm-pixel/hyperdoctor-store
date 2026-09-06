import type { VerifiedCatalogMasterItem } from "./bwell-2025-2026";

type Spec = Record<string, unknown>;

const localizedNames=(model:string)=>({
  nameFa:`ویلچر دستی JTS ${model}`,
  nameTr:`JTS ${model} Manuel Tekerlekli Sandalye`,
  nameEn:`JTS ${model} Manual Wheelchair`,
  nameAr:`كرسي متحرك يدوي JTS ${model}`,
});

function item(model:string,rowNumber:number,specs:Spec,excerpt:string):VerifiedCatalogMasterItem{
  return {
    rowNumber,
    payload:{
      sku:`JTS-${model}`,
      categorySlug:"mobility-rehab",
      vertical:"MEDICAL_EQUIPMENT",
      slug:`jts-${model.toLowerCase()}-manual-wheelchair`,
      ...localizedNames(model),
      descriptionFa:"",
      descriptionTr:"",
      descriptionEn:"",
      descriptionAr:"",
      brand:"JTS",
      modelNumber:model,
      manufacturer:"جهان تجهیزات شفا",
      countryOfOrigin:"",
      price:"0",
      stock:"0",
      lowStockThreshold:"2",
      minOrderQty:"1",
      specs:JSON.stringify(specs),
      tags:JSON.stringify(["jts","wheelchair","manual",model.toLowerCase()]),
      barcode:"",
      gtin:"",
      warrantyMonths:"",
      isPublished:false,
      isFeatured:false,
      isNewArrival:false,
    },
    images:[],
    evidence:{
      source:"JTS / Jahan Tajhizat Shafa main catalogue",
      model,
      excerpt,
      verification:"catalog_master_text",
      relationshipNotice:"Hyper Doctor is not documented as an official or authorized JTS representative.",
    },
  };
}

export const JTS_MAIN_CATALOG_SOURCE={
  sourceType:"CATALOG",
  title:"JTS / Jahan Tajhizat Shafa Main Catalogue",
  reference:"55-page JTS main catalogue supplied to Hyper Doctor",
  notes:"Verified product-master staging only. Hyper Doctor is not documented as an official JTS representative. Current retail price, inventory, discount, warranty and product imagery are not inferred from this catalogue.",
} as const;

export const JTS_MANUAL_WHEELCHAIR_STARTER:VerifiedCatalogMasterItem[]=[
  item("809E",1101,{productType:"economic manual wheelchair",frameMaterial:"iron",foldable:true,frameFinish:"static paint",seatBack:"reinforced canvas",footrest:"folding and adjustable",rearWheel:"solid sport",frontWheel:"stroller type",maxUserWeightKg:100,productWeightKg:13.95},"Catalogue identifies JTS 809E as an economic manual wheelchair with iron foldable frame, reinforced canvas, folding/adjustable footrest, solid sport rear wheels, stroller-type front wheels, 100 kg capacity and 13.95 kg product weight."),
  item("809R",1201,{productType:"manual wheelchair",frameMaterial:"iron",foldable:true,frameFinish:"static paint",foldedMobility:true,seatBack:"reinforced canvas",safetyBelt:true,rearWheel:"solid sport",frontWheel:"stroller type",maxUserWeightKg:100,productWeightKg:15.3},"Catalogue identifies the standard JTS 809R separately from the metal-spoke variant and lists foldability, reinforced canvas, safety belt, solid sport rear wheel, stroller-type front wheel, 100 kg capacity and 15.3 kg weight."),
  item("809B",1301,{productType:"manual wheelchair",foldable:true,frameFinish:"steel plating",foldedMobility:true,seatBack:"reinforced canvas",safetyBelt:true,rearWheel:"solid sport",frontWheel:"stroller type",maxUserWeightKg:100,productWeightKg:15},"Catalogue lists JTS 809B as foldable with steel plating, reinforced canvas, safety belt, solid sport rear wheel, stroller-type front wheel, 100 kg capacity and 15 kg product weight."),
  item("809C",1401,{productType:"manual wheelchair",foldable:true,frameFinish:"steel plating",seatBack:"reinforced",doubleCrossBrace:true,safetyBelt:true,openingMechanism:"metal valve",frontFork:"adjustable steel",rearWheel:"solid sport",frontWheel:"7 inch PU",maxUserWeightKg:120,productWeightKg:18.1},"Catalogue lists JTS 809C with double cross brace, safety belt, adjustable steel fork, solid sport rear wheel, 7-inch PU front wheel, 120 kg capacity and 18.1 kg weight."),
  item("809P",1501,{productType:"manual wheelchair",foldable:true,frameFinish:"steel plating",seatBack:"reinforced",safetyBelt:true,rearWheel:"pneumatic metal spoke",frontWheel:"stroller type",maxUserWeightKg:100,productWeightKg:19},"Catalogue lists JTS 809P with steel plating, reinforced seat/back, safety belt, pneumatic metal-spoke rear wheel, stroller-type front wheel, 100 kg capacity and 19 kg weight."),
  item("809A",1601,{productType:"manual wheelchair",foldable:true,frameFinish:"steel plating",foldedMobility:true,seatBack:"reinforced canvas",doubleCrossBrace:true,safetyBelt:true,openingMechanism:"metal valve",frontFork:"adjustable steel",rearWheel:"pneumatic metal spoke",maxUserWeightKg:120,productWeightKg:19.3},"Catalogue lists JTS 809A as foldable with double cross brace, safety belt, adjustable steel fork, pneumatic metal-spoke rear wheel, 120 kg capacity and 19.3 kg product weight."),
  item("874A",1701,{productType:"manual wheelchair",foldable:true,frameFinish:"steel plating",seatBack:"reinforced",doubleCrossBrace:true,safetyBelt:true,openingMechanism:"metal valve",frontFork:"adjustable steel",rearWheel:"pneumatic metal spoke",maxUserWeightKg:120,productWeightKg:20},"Catalogue lists JTS 874A as foldable with reinforced seat/back, double cross brace, safety belt, adjustable steel fork, pneumatic metal-spoke rear wheel, 120 kg capacity and 20 kg product weight."),
  item("874B",1801,{productType:"manual wheelchair",foldable:true,frameFinish:"steel plating",seatBack:"reinforced",doubleCrossBrace:true,safetyBelt:true,openingMechanism:"metal valve",frontFork:"adjustable steel",rearWheel:"solid sport",frontWheel:"pneumatic 200×50",maxUserWeightKg:120,productWeightKg:18},"Catalogue lists JTS 874B with reinforced seat/back, double cross brace, safety belt, solid sport rear wheel, pneumatic 200×50 front wheel, 120 kg capacity and 18 kg product weight."),
  item("874C",1901,{productType:"manual wheelchair",frame:"reinforced",tubeDiameterMm:25,frameFinish:"hammer finish",armrest:"PU",seatBack:"reinforced",doubleCrossBrace:true,safetyBelt:true,openingMechanism:"metal valve",reinforcementTubes:true,rearWheel:"solid sport"},"Catalogue identifies JTS 874C with reinforced frame, 25 mm tubing, hammer finish, PU armrest, reinforced seat/back, double cross brace, safety belt, reinforcement tubes and solid sport rear wheel. Unread or ambiguous numeric values are deliberately omitted."),
];
