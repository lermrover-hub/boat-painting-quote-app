import type { BoatCalculation, RateCardItem, Settings } from "../types";
import { emptyAreas } from "../utils/calculations";

const now = () => new Date().toISOString();
export const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const defaultSettings: Settings = {
  vatEnabled: true,
  vatPercent: 7,
  companyName: "Ocean Rover Marina",
  companyAddress: "Boat yard / marina",
  taxId: "",
  phone: "",
  email: "",
  currency: "THB",
  defaultWasteFactor: 1.1,
  defaultQuotationNote: "Quotation valid for 15 days. Final price may change after vessel inspection."
};

export const seedRateCards = (): RateCardItem[] => {
  const rows: Array<[string, RateCardItem["category"], RateCardItem["unit"], number, number, boolean]> = [
    ["Pressure Wash", "Pressure Wash", "sq.m.", 120, 1, true],
    ["Light Sanding", "Sanding", "sq.m.", 250, 1, true],
    ["Heavy Sanding", "Sanding", "sq.m.", 450, 1, true],
    ["Antifouling 1 Coat Labor", "Antifouling", "sq.m.", 300, 1, true],
    ["Antifouling 2 Coats Labor", "Antifouling", "sq.m.", 550, 1, true],
    ["Primer Application", "Primer", "sq.m.", 450, 1, true],
    ["Topcoat Application", "Topcoat", "sq.m.", 900, 1, true],
    ["Non-skid Deck Paint", "Non-skid", "sq.m.", 750, 1, true],
    ["Consumables", "Consumables", "job", 1500, 1, false],
    ["Masking", "Masking", "meter", 80, 1, false],
    ["Project Management Fee", "Management Fee", "job", 2500, 1, false]
  ];

  return rows.map(([name, category, unit, rate, defaultQuantity, applyToArea]) => ({
    id: makeId("rate"),
    name,
    category,
    unit,
    rate,
    defaultQuantity,
    applyToArea,
    active: true,
    description: "",
    createdAt: now(),
    updatedAt: now()
  }));
};

export const createBlankCalculation = (settings: Settings): BoatCalculation => {
  const areas = emptyAreas();
  return {
    id: makeId("calc"),
    createdAt: now(),
    updatedAt: now(),
    customerName: "",
    boatName: "",
    boatType: "Powerboat",
    brand: "",
    model: "",
    loa: 0,
    lwl: 0,
    beam: 0,
    draft: 0,
    freeboardForward: 0,
    freeboardMid: 0,
    freeboardAft: 0,
    hullShape: "Normal hull",
    workType: "Antifouling",
    cabinLength: 0,
    cabinWidth: 0,
    selectedAreas: {
      bottom: true,
      topside: false,
      transom: true,
      deck: false,
      cabin: false,
      keel: false,
      rudder: false,
      swimPlatform: false,
      manualExtra: false,
      deduction: false
    },
    calculatedAreas: areas,
    manualOverrides: {},
    factors: {
      conditionFactor: 1,
      accessFactor: 1,
      finishFactor: 1,
      wasteFactor: settings.defaultWasteFactor
    },
    actualArea: 0,
    chargeableArea: 0,
    selectedRateItems: [],
    subtotal: 0,
    discountMode: "amount",
    discountValue: 0,
    discountAmount: 0,
    vatEnabled: settings.vatEnabled,
    vatPercent: settings.vatPercent,
    vatAmount: 0,
    grandTotal: 0,
    notes: settings.defaultQuotationNote
  };
};

export const sampleCalculation = (settings: Settings): BoatCalculation => ({
  ...createBlankCalculation(settings),
  id: makeId("calc"),
  customerName: "Sample Customer",
  boatName: "Ocean Trial",
  boatType: "Sailing Monohull",
  brand: "Beneteau",
  model: "Oceanis 38",
  loa: 11.5,
  lwl: 10.7,
  beam: 3.9,
  draft: 1.95,
  freeboardForward: 1.25,
  freeboardMid: 1.1,
  freeboardAft: 0.95,
  hullShape: "Curved hull",
  workType: "Antifouling + topside touch-up",
  cabinLength: 4.5,
  cabinWidth: 2.8,
  selectedAreas: {
    bottom: true,
    topside: true,
    transom: true,
    deck: false,
    cabin: false,
    keel: true,
    rudder: true,
    swimPlatform: false,
    manualExtra: false,
    deduction: false
  },
  calculatedAreas: {
    ...emptyAreas(),
    keel: 5,
    rudder: 2
  }
});
