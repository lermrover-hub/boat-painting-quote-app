import {
  Anchor,
  Calculator,
  Copy,
  FileText,
  Home,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createBlankCalculation, defaultSettings, makeId, sampleCalculation, seedRateCards } from "./data/seeds";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { AreaKey, BoatCalculation, BoatType, QuoteItem, RateCardItem, Settings } from "./types";
import { boatTypes, rateCategories, units } from "./types";
import { areaLabels, emptyAreas, getEffectiveArea, recalculateBoat } from "./utils/calculations";
import { formatCurrency, formatNumber } from "./utils/format";
import { Button, Card, Field, NumberInput, PageTitle, inputClass } from "./components/ui";

type Page = "dashboard" | "boat" | "saved" | "rates" | "cost" | "settings" | "quote";

const areaKeys = Object.keys(areaLabels) as AreaKey[];

export function App() {
  const [settings, setSettings] = useLocalStorage<Settings>("boatQuote.settings", defaultSettings);
  const [rateCards, setRateCards] = useLocalStorage<RateCardItem[]>("boatQuote.rateCards", seedRateCards());
  const [calculations, setCalculations] = useLocalStorage<BoatCalculation[]>("boatQuote.calculations", [
    recalculateBoat(sampleCalculation(defaultSettings))
  ]);
  const [activeId, setActiveId] = useLocalStorage<string>("boatQuote.activeId", calculations[0]?.id ?? "");
  const [page, setPage] = useState<Page>("dashboard");

  const activeCalculation = useMemo(
    () => calculations.find((calc) => calc.id === activeId) ?? calculations[0],
    [activeId, calculations]
  );

  const saveCalculation = (next: BoatCalculation) => {
    const recalculated = recalculateBoat(next);
    setCalculations((items) => items.map((item) => (item.id === recalculated.id ? recalculated : item)));
    setActiveId(recalculated.id);
  };

  const startNewCalculation = () => {
    const calc = recalculateBoat(createBlankCalculation(settings));
    setCalculations((items) => [calc, ...items]);
    setActiveId(calc.id);
    setPage("boat");
  };

  const duplicateCalculation = () => {
    if (!activeCalculation) return;
    const copy = recalculateBoat({
      ...activeCalculation,
      id: makeId("calc"),
      boatName: `${activeCalculation.boatName || "Untitled"} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setCalculations((items) => [copy, ...items]);
    setActiveId(copy.id);
  };

  const updateRate = (item: RateCardItem) => {
    setRateCards((items) => {
      const exists = items.some((rate) => rate.id === item.id);
      const stamped = { ...item, updatedAt: new Date().toISOString() };
      return exists ? items.map((rate) => (rate.id === item.id ? stamped : rate)) : [stamped, ...items];
    });
  };

  const removeRate = (id: string) => setRateCards((items) => items.filter((item) => item.id !== id));

  const content = () => {
    if (!activeCalculation && page !== "dashboard" && page !== "rates" && page !== "settings") {
      return <EmptyState onCreate={startNewCalculation} />;
    }

    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            calc={activeCalculation}
            onNew={startNewCalculation}
            onPage={setPage}
            savedCount={calculations.length}
          />
        );
      case "saved":
        return (
          <SavedCalculations
            calculations={calculations}
            activeId={activeId}
            onOpen={(id) => {
              setActiveId(id);
              setPage("boat");
            }}
            onDelete={(id) => {
              setCalculations((items) => items.filter((calc) => calc.id !== id));
              if (id === activeId) setActiveId(calculations.find((calc) => calc.id !== id)?.id ?? "");
            }}
          />
        );
      case "boat":
        return <BoatCalculationPage calc={activeCalculation!} onChange={saveCalculation} onNext={() => setPage("cost")} />;
      case "rates":
        return <RateCardPage rateCards={rateCards} onSave={updateRate} onDelete={removeRate} />;
      case "cost":
        return (
          <CostCalculatorPage
            calc={activeCalculation!}
            rateCards={rateCards}
            onChange={saveCalculation}
            onQuote={() => setPage("quote")}
          />
        );
      case "settings":
        return (
          <SettingsPage
            settings={settings}
            onChange={(next) => {
              setSettings(next);
              if (activeCalculation) {
                saveCalculation({
                  ...activeCalculation,
                  vatEnabled: next.vatEnabled,
                  vatPercent: next.vatPercent,
                  factors: { ...activeCalculation.factors, wasteFactor: next.defaultWasteFactor }
                });
              }
            }}
          />
        );
      case "quote":
        return (
          <QuotationPage
            calc={activeCalculation!}
            settings={settings}
            onSave={() => saveCalculation(activeCalculation!)}
            onDuplicate={duplicateCalculation}
            onBack={() => setPage("cost")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto min-h-screen max-w-3xl px-4 pb-24 pt-5">{content()}</main>
      <BottomNav page={page} onPage={setPage} />
    </div>
  );
}

function Dashboard({
  calc,
  savedCount,
  onNew,
  onPage
}: {
  calc?: BoatCalculation;
  savedCount: number;
  onNew: () => void;
  onPage: (page: Page) => void;
}) {
  return (
    <>
      <PageTitle title="Boat Painting App" subtitle="Ocean Rover Marina quotation calculator" />
      <div className="grid gap-3">
        <Button className="flex items-center justify-center gap-2 text-base" onClick={onNew}>
          <Plus size={20} /> New Boat Calculation
        </Button>
        <DashboardButton icon={<Anchor />} label="Saved Calculations" detail={`${savedCount} saved`} onClick={() => onPage("saved")} />
        <DashboardButton icon={<SlidersHorizontal />} label="Rate Card" detail="Rates, units, categories" onClick={() => onPage("rates")} />
        <DashboardButton icon={<SettingsIcon />} label="VAT / Settings" detail="Company info and defaults" onClick={() => onPage("settings")} />
        <DashboardButton icon={<ReceiptText />} label="Quotation Summary" detail={calc?.boatName || "Open current quote"} onClick={() => onPage("quote")} />
      </div>
      {calc ? (
        <Card className="mt-5">
          <p className="text-xs font-semibold uppercase text-slate-500">Current calculation</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{calc.boatName || "Untitled boat"}</h2>
              <p className="text-sm text-slate-600">{calc.customerName || "No customer"} / {calc.boatType}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Grand total</p>
              <p className="text-lg font-bold text-teal-800">{formatCurrency(calc.grandTotal)}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </>
  );
}

function DashboardButton({
  icon,
  label,
  detail,
  onClick
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm">
      <span className="rounded-lg bg-teal-50 p-3 text-teal-800">{icon}</span>
      <span>
        <span className="block text-base font-bold text-slate-950">{label}</span>
        <span className="block text-sm text-slate-500">{detail}</span>
      </span>
    </button>
  );
}

function BoatCalculationPage({
  calc,
  onChange,
  onNext
}: {
  calc: BoatCalculation;
  onChange: (calc: BoatCalculation) => void;
  onNext: () => void;
}) {
  const patch = (partial: Partial<BoatCalculation>) => onChange({ ...calc, ...partial });
  const setNumber = (key: keyof BoatCalculation, value: number) => patch({ [key]: Number.isFinite(value) ? value : 0 } as Partial<BoatCalculation>);

  return (
    <>
      <PageTitle title="Boat Calculation" subtitle="Boat Info, Area Selection, Area Result, Adjustment Factor" />
      <div className="grid gap-4">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Boat Info</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Boat name"><input className={inputClass} value={calc.boatName} onChange={(e) => patch({ boatName: e.target.value })} /></Field>
            <Field label="Customer name"><input className={inputClass} value={calc.customerName} onChange={(e) => patch({ customerName: e.target.value })} /></Field>
            <Field label="Boat type"><select className={inputClass} value={calc.boatType} onChange={(e) => patch({ boatType: e.target.value as BoatType })}>{boatTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
            <Field label="Hull shape"><select className={inputClass} value={calc.hullShape} onChange={(e) => patch({ hullShape: e.target.value as BoatCalculation["hullShape"] })}><option>Normal hull</option><option>Curved hull</option><option>Catamaran</option></select></Field>
            <Field label="Brand"><input className={inputClass} value={calc.brand} onChange={(e) => patch({ brand: e.target.value })} /></Field>
            <Field label="Model"><input className={inputClass} value={calc.model} onChange={(e) => patch({ model: e.target.value })} /></Field>
            <Field label="Work type"><input className={inputClass} value={calc.workType} onChange={(e) => patch({ workType: e.target.value })} /></Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Dimensions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="LOA m"><NumberInput value={calc.loa} onChange={(v) => setNumber("loa", v)} /></Field>
            <Field label="LWL m"><NumberInput value={calc.lwl} onChange={(v) => setNumber("lwl", v)} /></Field>
            <Field label="Beam m"><NumberInput value={calc.beam} onChange={(v) => setNumber("beam", v)} /></Field>
            <Field label="Draft m"><NumberInput value={calc.draft} onChange={(v) => setNumber("draft", v)} /></Field>
            <Field label="Freeboard forward m"><NumberInput value={calc.freeboardForward} onChange={(v) => setNumber("freeboardForward", v)} /></Field>
            <Field label="Freeboard midship m"><NumberInput value={calc.freeboardMid} onChange={(v) => setNumber("freeboardMid", v)} /></Field>
            <Field label="Freeboard aft m"><NumberInput value={calc.freeboardAft} onChange={(v) => setNumber("freeboardAft", v)} /></Field>
            <Field label="Cabin length m"><NumberInput value={calc.cabinLength} onChange={(v) => setNumber("cabinLength", v)} /></Field>
            <Field label="Cabin width m"><NumberInput value={calc.cabinWidth} onChange={(v) => setNumber("cabinWidth", v)} /></Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Area Selection</h2>
          <div className="grid gap-2">
            {areaKeys.map((key) => (
              <label key={key} className="flex min-h-12 items-center justify-between rounded-lg border border-slate-200 px-3">
                <span className="font-medium text-slate-800">{areaLabels[key]}</span>
                <input
                  className="h-6 w-6 accent-teal-700"
                  type="checkbox"
                  checked={calc.selectedAreas[key]}
                  onChange={(e) => patch({ selectedAreas: { ...calc.selectedAreas, [key]: e.target.checked } })}
                />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-lg font-bold">Area Result</h2>
          <p className="mb-3 text-sm text-slate-500">Calculated area can be overridden manually.</p>
          <div className="grid gap-3">
            {areaKeys.map((key) => (
              <div key={key} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold">{areaLabels[key]}</span>
                  <span className="text-sm text-slate-500">{formatNumber(calc.calculatedAreas[key])} sq.m.</span>
                </div>
                <Field label="Override sq.m.">
                  <NumberInput
                    value={getEffectiveArea(key, calc.calculatedAreas, calc.manualOverrides)}
                    onChange={(value) => patch({ manualOverrides: { ...calc.manualOverrides, [key]: value } })}
                  />
                </Field>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Adjustment Factor</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Condition"><NumberInput value={calc.factors.conditionFactor} onChange={(v) => patch({ factors: { ...calc.factors, conditionFactor: v } })} /></Field>
            <Field label="Access"><NumberInput value={calc.factors.accessFactor} onChange={(v) => patch({ factors: { ...calc.factors, accessFactor: v } })} /></Field>
            <Field label="Finish"><NumberInput value={calc.factors.finishFactor} onChange={(v) => patch({ factors: { ...calc.factors, finishFactor: v } })} /></Field>
            <Field label="Waste"><NumberInput value={calc.factors.wasteFactor} onChange={(v) => patch({ factors: { ...calc.factors, wasteFactor: v } })} /></Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SummaryTile label="Actual Area" value={`${formatNumber(calc.actualArea)} sq.m.`} />
            <SummaryTile label="Chargeable Area" value={`${formatNumber(calc.chargeableArea)} sq.m.`} strong />
          </div>
        </Card>
        <Button onClick={onNext}>Continue to Cost Calculator</Button>
      </div>
    </>
  );
}

function RateCardPage({
  rateCards,
  onSave,
  onDelete
}: {
  rateCards: RateCardItem[];
  onSave: (item: RateCardItem) => void;
  onDelete: (id: string) => void;
}) {
  const blank = (): RateCardItem => ({
    id: makeId("rate"),
    name: "",
    category: "Other",
    unit: "sq.m.",
    rate: 0,
    defaultQuantity: 1,
    applyToArea: true,
    active: true,
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [draft, setDraft] = useState<RateCardItem>(blank());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = rateCards.filter((item) => {
    const matchesQuery = `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <>
      <PageTitle title="Rate Card" subtitle="Add Rate, Edit Rate, Delete Rate, Category Filter" />
      <Card className="mb-4">
        <h2 className="mb-3 text-lg font-bold">{rateCards.some((item) => item.id === draft.id) ? "Edit Rate" : "Add Rate"}</h2>
        <RateForm draft={draft} onChange={setDraft} />
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" disabled={!draft.name.trim()} onClick={() => { onSave(draft); setDraft(blank()); }}>Save Rate</Button>
          <Button variant="secondary" onClick={() => setDraft(blank())}>Clear</Button>
        </div>
      </Card>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="Search rate" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          {rateCategories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-950">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.category} / {item.unit}</p>
              </div>
              <p className="font-bold text-teal-800">{formatCurrency(item.rate)}</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.applyToArea ? "Applies to chargeable area" : `Default qty ${formatNumber(item.defaultQuantity)}`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setDraft(item)}>Edit</Button>
              <Button variant="secondary" onClick={() => onSave({ ...item, active: !item.active })}>{item.active ? "Set Inactive" : "Set Active"}</Button>
              <Button variant="danger" onClick={() => onDelete(item.id)}><Trash2 size={16} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function RateForm({ draft, onChange }: { draft: RateCardItem; onChange: (item: RateCardItem) => void }) {
  const patch = (partial: Partial<RateCardItem>) => onChange({ ...draft, ...partial });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Rate name"><input className={inputClass} value={draft.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
      <Field label="Category"><select className={inputClass} value={draft.category} onChange={(e) => patch({ category: e.target.value as RateCardItem["category"] })}>{rateCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Unit"><select className={inputClass} value={draft.unit} onChange={(e) => patch({ unit: e.target.value as RateCardItem["unit"] })}>{units.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Rate per unit"><NumberInput value={draft.rate} onChange={(rate) => patch({ rate })} /></Field>
      <Field label="Default quantity"><NumberInput value={draft.defaultQuantity} onChange={(defaultQuantity) => patch({ defaultQuantity })} /></Field>
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 font-semibold"><input className="h-5 w-5 accent-teal-700" type="checkbox" checked={draft.applyToArea} onChange={(e) => patch({ applyToArea: e.target.checked })} />Apply to area</label>
      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 font-semibold"><input className="h-5 w-5 accent-teal-700" type="checkbox" checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} />Active</label>
      <Field label="Description"><textarea className={inputClass} value={draft.description} onChange={(e) => patch({ description: e.target.value })} /></Field>
    </div>
  );
}

function CostCalculatorPage({
  calc,
  rateCards,
  onChange,
  onQuote
}: {
  calc: BoatCalculation;
  rateCards: RateCardItem[];
  onChange: (calc: BoatCalculation) => void;
  onQuote: () => void;
}) {
  const selectedIds = new Set(calc.selectedRateItems.map((item) => item.rateCardItemId));
  const patchItems = (items: QuoteItem[]) => onChange({ ...calc, selectedRateItems: items });
  const toggleRate = (rate: RateCardItem) => {
    if (selectedIds.has(rate.id)) {
      patchItems(calc.selectedRateItems.filter((item) => item.rateCardItemId !== rate.id));
      return;
    }
    const quantity = rate.applyToArea ? Number(calc.chargeableArea.toFixed(2)) : rate.defaultQuantity;
    patchItems([
      ...calc.selectedRateItems,
      {
        id: makeId("quote"),
        rateCardItemId: rate.id,
        name: rate.name,
        category: rate.category,
        unit: rate.unit,
        quantity,
        rate: rate.rate,
        amount: quantity * rate.rate
      }
    ]);
  };
  const updateQuoteItem = (id: string, partial: Partial<QuoteItem>) =>
    patchItems(calc.selectedRateItems.map((item) => (item.id === id ? { ...item, ...partial } : item)));

  return (
    <>
      <PageTitle title="Cost Calculator" subtitle="Select Rate Items, Quantity, Rate, Amount" />
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile label="Chargeable Area" value={`${formatNumber(calc.chargeableArea)} sq.m.`} />
          <SummaryTile label="Grand Total" value={formatCurrency(calc.grandTotal)} strong />
        </div>
      </Card>
      <Card className="mb-4">
        <h2 className="mb-3 text-lg font-bold">Select Rate Items</h2>
        <div className="grid gap-2">
          {rateCards.filter((rate) => rate.active).map((rate) => (
            <label key={rate.id} className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-slate-200 px-3">
              <span>
                <span className="block font-semibold">{rate.name}</span>
                <span className="block text-sm text-slate-500">{formatCurrency(rate.rate)} / {rate.unit}</span>
              </span>
              <input className="h-6 w-6 accent-teal-700" type="checkbox" checked={selectedIds.has(rate.id)} onChange={() => toggleRate(rate)} />
            </label>
          ))}
        </div>
      </Card>
      <div className="grid gap-3">
        {calc.selectedRateItems.map((item) => (
          <Card key={item.id}>
            <h3 className="font-bold">{item.name}</h3>
            <p className="mb-3 text-sm text-slate-500">{item.category} / {item.unit}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity"><NumberInput value={item.quantity} onChange={(quantity) => updateQuoteItem(item.id, { quantity })} /></Field>
              <Field label="Rate"><NumberInput value={item.rate} onChange={(rate) => updateQuoteItem(item.id, { rate })} /></Field>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="font-semibold">Amount</span>
              <span className="font-bold text-teal-800">{formatCurrency(item.quantity * item.rate)}</span>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount type"><select className={inputClass} value={calc.discountMode} onChange={(e) => onChange({ ...calc, discountMode: e.target.value as BoatCalculation["discountMode"] })}><option value="amount">Amount</option><option value="percent">Percent</option></select></Field>
          <Field label="Discount"><NumberInput value={calc.discountValue} onChange={(discountValue) => onChange({ ...calc, discountValue })} /></Field>
        </div>
        <QuoteTotals calc={calc} />
      </Card>
      <Button className="mt-4 w-full" onClick={onQuote}>Open Quotation Summary</Button>
    </>
  );
}

function SettingsPage({ settings, onChange }: { settings: Settings; onChange: (settings: Settings) => void }) {
  const patch = (partial: Partial<Settings>) => onChange({ ...settings, ...partial });
  return (
    <>
      <PageTitle title="VAT / Settings" subtitle="VAT On / Off, VAT %, Company Info" />
      <div className="grid gap-4">
        <Card>
          <label className="mb-3 flex min-h-12 items-center justify-between rounded-lg border border-slate-200 px-3 font-semibold">
            VAT enabled
            <input className="h-6 w-6 accent-teal-700" type="checkbox" checked={settings.vatEnabled} onChange={(e) => patch({ vatEnabled: e.target.checked })} />
          </label>
          <Field label="VAT %"><NumberInput value={settings.vatPercent} onChange={(vatPercent) => patch({ vatPercent })} /></Field>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-bold">Company Info</h2>
          <div className="grid gap-3">
            <Field label="Company name"><input className={inputClass} value={settings.companyName} onChange={(e) => patch({ companyName: e.target.value })} /></Field>
            <Field label="Company address"><textarea className={inputClass} value={settings.companyAddress} onChange={(e) => patch({ companyAddress: e.target.value })} /></Field>
            <Field label="Tax ID"><input className={inputClass} value={settings.taxId} onChange={(e) => patch({ taxId: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={settings.phone} onChange={(e) => patch({ phone: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} value={settings.email} onChange={(e) => patch({ email: e.target.value })} /></Field>
            <Field label="Default currency"><input className={inputClass} value={settings.currency} onChange={(e) => patch({ currency: e.target.value })} /></Field>
            <Field label="Default waste factor"><NumberInput value={settings.defaultWasteFactor} onChange={(defaultWasteFactor) => patch({ defaultWasteFactor })} /></Field>
            <Field label="Default quotation note"><textarea className={inputClass} value={settings.defaultQuotationNote} onChange={(e) => patch({ defaultQuotationNote: e.target.value })} /></Field>
          </div>
        </Card>
      </div>
    </>
  );
}

function QuotationPage({
  calc,
  settings,
  onSave,
  onDuplicate,
  onBack
}: {
  calc: BoatCalculation;
  settings: Settings;
  onSave: () => void;
  onDuplicate: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <PageTitle title="Quotation Summary" subtitle="Area Summary, Cost Summary, VAT, Grand Total" />
      <Card className="print-page">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold">{settings.companyName}</h2>
          <p className="whitespace-pre-line text-sm text-slate-600">{settings.companyAddress}</p>
          <p className="text-sm text-slate-600">Tax ID: {settings.taxId || "-"}</p>
          <p className="text-sm text-slate-600">{settings.phone} {settings.email}</p>
        </div>
        <Section title="Customer information">
          <Row label="Customer" value={calc.customerName || "-"} />
          <Row label="Boat" value={calc.boatName || "-"} />
        </Section>
        <Section title="Boat information">
          <Row label="Type" value={calc.boatType} />
          <Row label="Brand / Model" value={`${calc.brand || "-"} / ${calc.model || "-"}`} />
          <Row label="LOA / Beam / Draft" value={`${formatNumber(calc.loa)} / ${formatNumber(calc.beam)} / ${formatNumber(calc.draft)} m`} />
          <Row label="Work scope" value={calc.workType || "-"} />
        </Section>
        <Section title="Area calculation summary">
          {areaKeys.filter((key) => calc.selectedAreas[key]).map((key) => (
            <Row key={key} label={areaLabels[key]} value={`${formatNumber(getEffectiveArea(key, calc.calculatedAreas, calc.manualOverrides))} sq.m.`} />
          ))}
          <Row label="Actual Area" value={`${formatNumber(calc.actualArea)} sq.m.`} />
          <Row label="Chargeable Area" value={`${formatNumber(calc.chargeableArea)} sq.m.`} />
        </Section>
        <Section title="Selected rate card items">
          {calc.selectedRateItems.map((item) => (
            <QuoteItemRow key={item.id} item={item} />
          ))}
        </Section>
        <Section title="Cost summary">
          <QuoteTotals calc={calc} />
          <p className="mt-2 text-sm text-slate-600">VAT is {calc.vatEnabled ? `included at ${formatNumber(calc.vatPercent)}%` : "excluded / disabled"}.</p>
        </Section>
        <Section title="Notes">
          <p className="whitespace-pre-line text-sm text-slate-700">{calc.notes || settings.defaultQuotationNote}</p>
        </Section>
      </Card>
      <div className="no-print mt-4 grid grid-cols-2 gap-2">
        <Button onClick={onSave}><Save className="inline" size={16} /> Save quotation</Button>
        <Button variant="secondary" onClick={onDuplicate}><Copy className="inline" size={16} /> Duplicate</Button>
        <Button variant="secondary" onClick={() => window.print()}><Printer className="inline" size={16} /> Export / Print view</Button>
        <Button variant="secondary" onClick={onBack}>Back to edit</Button>
      </div>
    </>
  );
}

function SavedCalculations({
  calculations,
  activeId,
  onOpen,
  onDelete
}: {
  calculations: BoatCalculation[];
  activeId: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <PageTitle title="Saved Calculations" subtitle="Local offline calculations saved on this device" />
      <div className="grid gap-3">
        {calculations.map((calc) => (
          <Card key={calc.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{calc.boatName || "Untitled boat"} {calc.id === activeId ? <span className="text-xs text-teal-700">Current</span> : null}</h2>
                <p className="text-sm text-slate-500">{calc.customerName || "No customer"} / {calc.boatType}</p>
              </div>
              <p className="font-bold text-teal-800">{formatCurrency(calc.grandTotal)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => onOpen(calc.id)}>Open</Button>
              <Button variant="danger" onClick={() => onDelete(calc.id)}><Trash2 size={16} /></Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function QuoteTotals({ calc }: { calc: BoatCalculation }) {
  return (
    <div className="mt-4 grid gap-2 text-sm">
      <Row label="Subtotal" value={formatCurrency(calc.subtotal)} />
      <Row label="Discount" value={formatCurrency(calc.discountAmount)} />
      <Row label={`VAT ${calc.vatEnabled ? `${formatNumber(calc.vatPercent)}%` : "off"}`} value={formatCurrency(calc.vatAmount)} />
      <div className="flex items-center justify-between rounded-lg bg-teal-50 p-3 text-lg font-bold text-teal-900">
        <span>Grand Total</span>
        <span>{formatCurrency(calc.grandTotal)}</span>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 ${strong ? "text-lg font-bold text-teal-800" : "font-bold text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-200 py-4 last:border-b-0">
      <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4">
      <span className="text-slate-600">{label}</span>
      <span className="break-words font-semibold text-slate-950 sm:text-right">{value}</span>
    </div>
  );
}

function QuoteItemRow({ item }: { item: QuoteItem }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{item.name}</p>
          <p className="text-sm text-slate-500">{item.category} / {item.unit}</p>
        </div>
        <p className="text-right font-bold text-slate-950">{formatCurrency(item.quantity * item.rate)}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {formatNumber(item.quantity)} {item.unit} x {formatCurrency(item.rate)}
      </p>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <h1 className="text-xl font-bold">No calculation selected</h1>
      <p className="mt-1 text-sm text-slate-600">Create a new boat calculation to continue.</p>
      <Button className="mt-4 w-full" onClick={onCreate}>New Boat Calculation</Button>
    </Card>
  );
}

function BottomNav({ page, onPage }: { page: Page; onPage: (page: Page) => void }) {
  const items: Array<[Page, ReactNode, string]> = [
    ["dashboard", <Home size={20} />, "Home"],
    ["boat", <Calculator size={20} />, "Boat"],
    ["rates", <SlidersHorizontal size={20} />, "Rates"],
    ["cost", <ReceiptText size={20} />, "Cost"],
    ["quote", <FileText size={20} />, "Quote"]
  ];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-5 px-2 py-2">
        {items.map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => onPage(key)}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold ${page === key ? "bg-teal-50 text-teal-800" : "text-slate-500"}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
