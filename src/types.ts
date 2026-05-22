export type BoatType = "Powerboat" | "Sailing Monohull" | "Catamaran" | "RIB" | "Motor Yacht";
export type Unit = "sq.m." | "meter" | "liter" | "job" | "day" | "hour" | "item";
export type DiscountMode = "amount" | "percent";

export const boatTypes: BoatType[] = ["Powerboat", "Sailing Monohull", "Catamaran", "RIB", "Motor Yacht"];

export const rateCategories = [
  "Pressure Wash",
  "Scraping / Barnacle Removal",
  "Sanding",
  "Masking",
  "Fairing / Putty",
  "Primer",
  "Antifouling",
  "Topcoat",
  "Deck Paint",
  "Non-skid",
  "Polish",
  "Consumables",
  "Equipment",
  "Yard Service",
  "Management Fee",
  "Other"
] as const;

export type RateCategory = (typeof rateCategories)[number];

export const units: Unit[] = ["sq.m.", "meter", "liter", "job", "day", "hour", "item"];

export type AreaKey =
  | "bottom"
  | "topside"
  | "transom"
  | "deck"
  | "cabin"
  | "keel"
  | "rudder"
  | "swimPlatform"
  | "manualExtra"
  | "deduction";

export type SelectedAreas = Record<AreaKey, boolean>;
export type AreaValues = Record<AreaKey, number>;
export type ManualOverrides = Partial<Record<AreaKey, number>>;

export interface Factors {
  conditionFactor: number;
  accessFactor: number;
  finishFactor: number;
  wasteFactor: number;
}

export interface RateCardItem {
  id: string;
  name: string;
  category: RateCategory;
  unit: Unit;
  rate: number;
  defaultQuantity: number;
  applyToArea: boolean;
  active: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  rateCardItemId: string;
  name: string;
  category: string;
  unit: Unit;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Settings {
  vatEnabled: boolean;
  vatPercent: number;
  companyName: string;
  companyAddress: string;
  taxId: string;
  phone: string;
  email: string;
  currency: string;
  defaultWasteFactor: number;
  defaultQuotationNote: string;
}

export interface BoatCalculation {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  boatName: string;
  boatType: BoatType;
  brand: string;
  model: string;
  loa: number;
  lwl: number;
  beam: number;
  draft: number;
  freeboardForward: number;
  freeboardMid: number;
  freeboardAft: number;
  hullShape: "Normal hull" | "Curved hull" | "Catamaran";
  workType: string;
  cabinLength: number;
  cabinWidth: number;
  selectedAreas: SelectedAreas;
  calculatedAreas: AreaValues;
  manualOverrides: ManualOverrides;
  factors: Factors;
  actualArea: number;
  chargeableArea: number;
  selectedRateItems: QuoteItem[];
  subtotal: number;
  discountMode: DiscountMode;
  discountValue: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  notes: string;
}
