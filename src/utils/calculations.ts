import type { AreaKey, AreaValues, BoatCalculation, BoatType, Factors, QuoteItem } from "../types";

export const areaLabels: Record<AreaKey, string> = {
  bottom: "Bottom / Antifouling",
  topside: "Hull Topside",
  transom: "Transom",
  deck: "Deck",
  cabin: "Cabin / Superstructure",
  keel: "Keel",
  rudder: "Rudder",
  swimPlatform: "Swim Platform",
  manualExtra: "Manual Extra Area",
  deduction: "Deduction Area"
};

export const hullCoefficient: Record<BoatType, number> = {
  Powerboat: 0.75,
  "Motor Yacht": 0.8,
  "Sailing Monohull": 0.9,
  Catamaran: 1.25,
  RIB: 0.7
};

export const deckCoverageFactor: Record<BoatType, number> = {
  Powerboat: 0.45,
  "Motor Yacht": 0.6,
  "Sailing Monohull": 0.5,
  Catamaran: 0.7,
  RIB: 0.35
};

export const getCurvatureFactor = (hullShape: BoatCalculation["hullShape"]) => {
  if (hullShape === "Curved hull") return 1.2;
  if (hullShape === "Catamaran") return 1.35;
  return 1.1;
};

export const emptyAreas = (): AreaValues => ({
  bottom: 0,
  topside: 0,
  transom: 0,
  deck: 0,
  cabin: 0,
  keel: 0,
  rudder: 0,
  swimPlatform: 0,
  manualExtra: 0,
  deduction: 0
});

export const calculateBaseAreas = (calc: BoatCalculation): AreaValues => {
  const avgFreeboard = (calc.freeboardForward + calc.freeboardMid + calc.freeboardAft) / 3;
  return {
    bottom: calc.lwl * (calc.beam + calc.draft) * hullCoefficient[calc.boatType],
    topside: calc.loa * avgFreeboard * 2 * getCurvatureFactor(calc.hullShape),
    transom: calc.beam * calc.freeboardAft * 0.7,
    deck: calc.loa * calc.beam * deckCoverageFactor[calc.boatType],
    cabin: calc.cabinLength * calc.cabinWidth * 1.5,
    keel: calc.calculatedAreas?.keel || 0,
    rudder: calc.calculatedAreas?.rudder || 0,
    swimPlatform: calc.calculatedAreas?.swimPlatform || 0,
    manualExtra: calc.calculatedAreas?.manualExtra || 0,
    deduction: calc.calculatedAreas?.deduction || 0
  };
};

export const getEffectiveArea = (key: AreaKey, calculatedAreas: AreaValues, overrides: Partial<AreaValues>) =>
  overrides[key] ?? calculatedAreas[key] ?? 0;

export const calculateActualArea = (calc: BoatCalculation) =>
  (Object.keys(areaLabels) as AreaKey[]).reduce((sum, key) => {
    if (!calc.selectedAreas[key]) return sum;
    const value = getEffectiveArea(key, calc.calculatedAreas, calc.manualOverrides);
    return key === "deduction" ? sum - value : sum + value;
  }, 0);

export const applyFactors = (actualArea: number, factors: Factors) =>
  actualArea * factors.conditionFactor * factors.accessFactor * factors.finishFactor * factors.wasteFactor;

export const calculateQuoteTotals = (
  items: QuoteItem[],
  discountMode: BoatCalculation["discountMode"],
  discountValue: number,
  vatEnabled: boolean,
  vatPercent: number
) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const rawDiscount = discountMode === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal);
  const taxable = Math.max(subtotal - discountAmount, 0);
  const vatAmount = vatEnabled ? taxable * (vatPercent / 100) : 0;
  return {
    subtotal,
    discountAmount,
    vatAmount,
    grandTotal: taxable + vatAmount
  };
};

export const recalculateBoat = (calc: BoatCalculation): BoatCalculation => {
  const calculatedAreas = calculateBaseAreas(calc);
  const actualArea = calculateActualArea({ ...calc, calculatedAreas });
  const chargeableArea = applyFactors(actualArea, calc.factors);
  const selectedRateItems = calc.selectedRateItems.map((item) => ({
    ...item,
    amount: item.quantity * item.rate
  }));
  const totals = calculateQuoteTotals(
    selectedRateItems,
    calc.discountMode,
    calc.discountValue,
    calc.vatEnabled,
    calc.vatPercent
  );

  return {
    ...calc,
    calculatedAreas,
    actualArea,
    chargeableArea,
    selectedRateItems,
    ...totals,
    updatedAt: new Date().toISOString()
  };
};
