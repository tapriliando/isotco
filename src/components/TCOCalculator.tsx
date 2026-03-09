import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Truck, FileText, DollarSign, Sparkles, Fuel, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabaseRestSelect } from "@/lib/supabaseClient";
// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
import astraLogo from "@/assets/astra_logo.png";
const PRODUCT_TYPES = [
  { value: "TRAGA PICK UP (FD)", label: "TRAGA PICK UP (FD)", basePrice: '-' },
  { value: "NMR", label: "NMR", basePrice: '-' },
  { value: "NMR L", label: "NMR L", basePrice: '-' },
  { value: "NMR B", label: "NMR B", basePrice: '-' },
  { value: "NLR", label: "NLR", basePrice: '-' },
  { value: "GVR J", label: "GVR J", basePrice: '-' },
  { value: "FVM U", label: "FVM U", basePrice: '-' },
  { value: "FVM N", label: "FVM N", basePrice: '-' },
  { value: "NMR H.D 5.8", label: "NMR H.D 5.8", basePrice: '-' },
];

const REGISTRATION_TYPES = [
  { value: "on-road", label: "On-road" },
  { value: "off-road", label: "Off-road" },
];

const PLATE_COLORS = [
  { value: "yellow", label: "Yellow Plate" },
  { value: "white", label: "White Plate" },
];

const APPLICATIONS = [
  { value: "bus", label: "Bus" },
  { value: "pickup", label: "Pickup" },
  { value: "dump-truck", label: "Dump Truck" },
  { value: "box-truck", label: "Box Truck" },
  { value: "tanker", label: "Tanker" },
  { value: "trailer", label: "Trailer" },
];

const LIFECYCLE_OPTIONS = [
  { value: "4", label: "4 Years" },
  { value: "5", label: "5 Years" },
  { value: "6", label: "6 Years" },
  { value: "7", label: "7 Years" },
];

const KM_PER_YEAR_OPTIONS = [
  { value: "10000", label: "10,000 km" },
  { value: "20000", label: "20,000 km" },
  { value: "30000", label: "30,000 km" },
  { value: "40000", label: "40,000 km" },
  { value: "50000", label: "50,000 km" },
  { value: "60000", label: "60,000 km" },
  { value: "70000", label: "70,000 km" },
  { value: "80000", label: "80,000 km" },
];

const DOWN_PAYMENT_OPTIONS = [
  { value: "0.15", label: "15%" },
  { value: "0.20", label: "20%" },
  { value: "0.25", label: "25%" },
  { value: "0.30", label: "30%" },
  { value: "0.50", label: "50%" },
  { value: "0.75", label: "75%" },
];

const DEPRECIATION_OPTIONS = [
  { value: "0.70", label: "70%" },
  { value: "0.65", label: "65%" },
  { value: "0.60", label: "60%" },
  { value: "0.55", label: "55%" },
  { value: "0.50", label: "50%" },
  { value: "0.45", label: "45%" },
  { value: "0.40", label: "40%" },
  { value: "0.35", label: "35%" },
];

const INSURANCE_OPTIONS = [
  { value: "0.07", label: "7%" },
  { value: "0.055", label: "5.5%" },
  { value: "0.05", label: "5%" },
  { value: "0.045", label: "4.5%" },
  { value: "0.04", label: "4%" },
  { value: "0.035", label: "3.5%" },
  { value: "0.03", label: "3%" },
];

const INTEREST_RATE_OPTIONS = [
  { value: "0.13", label: "13%" },
  { value: "0.14", label: "14%" },
  { value: "0.15", label: "15%" },
  { value: "0.16", label: "16%" },
  { value: "0.17", label: "17%" },
  { value: "0.19", label: "19%" },
  { value: "0.21", label: "21%" },
  { value: "0.23", label: "23%" },
];

const LEASE_PERIOD_OPTIONS = [
  { value: "3", label: "3 Years" },
  { value: "4", label: "4 Years" },
  { value: "5", label: "5 Years" },
];

const TAX_AMOUNT = 1000000; // Fixed 1 million IDR
const DEFAULT_GASOLINE_PRICE = 6800; // Rp. 6800/liter
const DEFAULT_FUEL_EFFICIENCY = 8; // km/liter (default assumption)

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumberId = (value: number): string => {
  return Math.round(value).toLocaleString("id-ID");
};

type SummaryCalculations = {
  costPerMonth: number;
  totalDriverSalary: number;
  totalGasolineCost: number;
  totalMaintenance: number;
  costPerYear: number;
  totalKm: number;
  lifecycleYears: number;
};

const generateMockAISummary = (calc: SummaryCalculations): string => {
  const costPerMonthFormatted = formatNumberId(calc.costPerMonth);
  const dailyRevenue = 1500000;
  const operatingDaysPerMonth = 25;
  const monthlyRevenue = dailyRevenue * operatingDaysPerMonth;
  const netProfit = monthlyRevenue - calc.costPerMonth;
  const netProfitFormatted = formatNumberId(netProfit);

  const operationalParts: string[] = [];
  if (calc.totalDriverSalary > 0) {
    const driverPerMonth = calc.totalDriverSalary / (calc.lifecycleYears * 12);
    operationalParts.push(`gaji sopir (Rp. ${formatNumberId(driverPerMonth)}/bulan)`);
  }
  if (calc.totalGasolineCost > 0) {
    const gasPerMonth = calc.totalGasolineCost / (calc.lifecycleYears * 12);
    operationalParts.push(`BBM (Rp. ${formatNumberId(gasPerMonth)}/bulan)`);
  }
  if (calc.totalMaintenance > 0) {
    const maintPerMonth = calc.totalMaintenance / (calc.lifecycleYears * 12);
    operationalParts.push(`maintenance (Rp. ${formatNumberId(maintPerMonth)}/bulan)`);
  }
  const operationalPhrase =
    operationalParts.length > 0
      ? ` Biaya operasional meliputi: ${operationalParts.join(", ")}.`
      : "";

  return `Total biaya per bulan yaitu Rp. ${costPerMonthFormatted} yang mencakup biaya kepemilikan (cicilan, asuransi, pajak) dan biaya operasional.${operationalPhrase} Dengan asumsi unit beroperasi ${operatingDaysPerMonth} hari/bulan dan revenue minimal Rp. ${formatNumberId(dailyRevenue)}/hari, revenue bulanan Rp. ${formatNumberId(monthlyRevenue)} dikurangi biaya bulanan Rp. ${costPerMonthFormatted} menghasilkan keuntungan bersih per bulan sekitar Rp. ${netProfitFormatted}.`;
};

const generateMockAISummaryBullets = (calc: SummaryCalculations): string[] => {
  const costPerMonthFormatted = formatNumberId(calc.costPerMonth);
  const dailyRevenue = 1000000;
  const operatingDaysPerMonth = 25;
  const monthlyRevenue = dailyRevenue * operatingDaysPerMonth;
  const netProfit = monthlyRevenue - calc.costPerMonth;
  const netProfitFormatted = formatNumberId(netProfit);
  const monthlyRevenueFormatted = formatNumberId(monthlyRevenue);

  const operationalParts: string[] = [];
  if (calc.totalDriverSalary > 0) {
    const driverPerMonth = calc.totalDriverSalary / (calc.lifecycleYears * 12);
    operationalParts.push(`gaji sopir (Rp. ${formatNumberId(driverPerMonth)}/bulan)`);
  }
  if (calc.totalGasolineCost > 0) {
    const gasPerMonth = calc.totalGasolineCost / (calc.lifecycleYears * 12);
    operationalParts.push(`BBM (Rp. ${formatNumberId(gasPerMonth)}/bulan)`);
  }
  if (calc.totalMaintenance > 0) {
    const maintPerMonth = calc.totalMaintenance / (calc.lifecycleYears * 12);
    operationalParts.push(`maintenance (Rp. ${formatNumberId(maintPerMonth)}/bulan)`);
  }

  const operationalSummary =
    operationalParts.length > 0
      ? `Perkiraan biaya operasional per bulan: ${operationalParts.join(", ")}.`
      : "Biaya operasional belum diisi secara lengkap.";

  return [
    `Perkiraan total biaya kepemilikan per bulan: Rp. ${costPerMonthFormatted}.`,
    operationalSummary,
    `Dengan asumsi unit beroperasi ${operatingDaysPerMonth} hari/bulan dan revenue minimal Rp. ${formatNumberId(
      dailyRevenue
    )}/hari (Rp. ${monthlyRevenueFormatted}/bulan), estimasi keuntungan bersih per bulan sekitar Rp. ${netProfitFormatted}.`,
  ];
};

type CalculationsResult = {
  vehiclePrice: number;
  downPaymentAmount: number;
  loanAmount: number;
  totalInterest: number;
  totalLoanPayment: number;
  monthlyPayment: number;
  residualValue: number;
  depreciationCost: number;
  annualInsurance: number;
  totalInsurance: number;
  totalTax: number;
  totalKm: number;
  totalMaintenance: number;
  totalDriverSalary: number;
  totalGasolineCost: number;
  totalMaintenanceBudget: number;
  totalGasolineCostBeforeAdvantages: number;
  totalGasolineCostAfterAdvantages: number;
  totalCostOfOwnershipBeforeAdvantages: number;
  totalCostOfOwnershipAfterAdvantages: number;
  totalAstraAdvantagesSaving: number;
  costPerKmBeforeAdvantages: number;
  costPerKmAfterAdvantages: number;
  costPerYearBeforeAdvantages: number;
  costPerYearAfterAdvantages: number;
  costPerMonthBeforeAdvantages: number;
  costPerMonthAfterAdvantages: number;
  totalCostOfOwnership: number;
  costPerKm: number;
  costPerYear: number;
  costPerMonth: number;
  lifecycleYears: number;
};

type PDFData = {
  // Inputs
  cabang: string;
  plArea: string;
  productType: string;
  registration: string;
  plateColor: string;
  application: string;
  lifecycle: string;
  kmPerYear: string;
  downPayment: string;
  depreciation: string;
  insurance: string;
  interestRate: string;
  leasePeriod: string;
  monthlyDriverSalary: string;
  gasolinePrice: string;
  fuelEfficiency: string;
  annualServiceBudget: string;
  annualPartBudget: string;
  annualMaterialBudget: string;
  serviceDiscount: string;
  partDiscount: string;
  materialDiscount: string;
  extendedWarrantyEnabled: boolean;
  driverTrainingEnabled: boolean;
  santunanEnabled: boolean;
  antiRustEnabled: boolean;
  outletEfficiencyEnabled: boolean;
  outletDowntimeEnabled: boolean;
  // Calculations
  calculations: CalculationsResult;
};

const generatePDFReport = (data: PDFData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Astra Isuzu TCO Calculator", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Total Cost of Ownership Report", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  const reportDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Vehicle Configuration
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Konfigurasi Kendaraan", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const vehicleConfig = [
    ["Cabang", data.cabang || "-"],
    ["PL Area", data.plArea || "-"],
    ["Tipe Kendaraan", PRODUCT_TYPES.find((p) => p.value === data.productType)?.label || data.productType],
    ["Harga Kendaraan", formatCurrency(data.calculations.vehiclePrice)],
    ["Registrasi", REGISTRATION_TYPES.find((r) => r.value === data.registration)?.label || data.registration],
    ["Warna Plat", PLATE_COLORS.find((p) => p.value === data.plateColor)?.label || data.plateColor],
    ["Aplikasi", APPLICATIONS.find((a) => a.value === data.application)?.label || data.application],
    ["Umur Operasional", `${data.lifecycle} Years`],
    ["Kilometer per Tahun", `${parseInt(data.kmPerYear).toLocaleString("id-ID")} km`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: vehicleConfig,
    theme: "striped",
    headStyles: { fillColor: [0, 100, 200], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Financial Parameters
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Parameters", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const financialParams = [
    ["Down Payment", `${(parseFloat(data.downPayment) * 100).toFixed(0)}%`],
    ["Penyusutan", `${(parseFloat(data.depreciation) * 100).toFixed(0)}%`],
    ["Insurance Rate", `${(parseFloat(data.insurance) * 100).toFixed(2)}%`],
    ["Suku Bunga", `${(parseFloat(data.interestRate) * 100).toFixed(0)}%`],
    ["Periode Sewa", `${data.leasePeriod} Years`],
    ["Pajak Tahunan", formatCurrency(TAX_AMOUNT)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: financialParams,
    theme: "striped",
    headStyles: { fillColor: [0, 100, 200], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Operational Parameters
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Operational Parameters", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const operationalParams = [
    ["Gaji Sopir per Bulan", data.monthlyDriverSalary ? formatCurrency(parseFloat(data.monthlyDriverSalary)) : "Not set"],
    ["Harga BBM per Liter", formatCurrency(parseFloat(data.gasolinePrice)) + "/liter"],
    ["Konsumsi Bahan Bakar", `${data.fuelEfficiency} km/liter`],
    ["Anggaran Service Tahunan", formatCurrency(parseFloat(data.annualServiceBudget))],
    ["Anggaran Part Tahunan", formatCurrency(parseFloat(data.annualPartBudget))],
    ["Anggaran Bahan Tahunan", formatCurrency(parseFloat(data.annualMaterialBudget))],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Parameter", "Value"]],
    body: operationalParams,
    theme: "striped",
    headStyles: { fillColor: [0, 100, 200], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // TCO Summary
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Total Cost of Ownership Summary", margin, yPos);
  yPos += 10;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(
    formatCurrency(data.calculations.totalCostOfOwnership),
    margin,
    yPos
  );
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryData = [
    [
      "TCO Before Astra Isuzu Advantages",
      formatCurrency(data.calculations.totalCostOfOwnershipBeforeAdvantages),
    ],
    [
      "TCO After Astra Isuzu Advantages",
      formatCurrency(data.calculations.totalCostOfOwnership),
    ],
    [
      "Total Savings from Astra Isuzu Advantages",
      formatCurrency(data.calculations.totalAstraAdvantagesSaving),
    ],
    [
      "Cost per Kilometer (Before)",
      formatCurrency(data.calculations.costPerKmBeforeAdvantages),
    ],
    [
      "Cost per Kilometer (After)",
      formatCurrency(data.calculations.costPerKmAfterAdvantages),
    ],
    ["Cost per Year (After)", formatCurrency(data.calculations.costPerYear)],
    [
      "Cost per Month (After)",
      formatCurrency(data.calculations.costPerMonth),
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [0, 150, 0], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10 },
    margin: { left: margin, right: margin },
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // Cost Breakdown
  checkPageBreak(80);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Cost Breakdown", margin, yPos);
  yPos += 8;

  const costBreakdown = [
    ["Vehicle Price", formatCurrency(data.calculations.vehiclePrice)],
    ["Down Payment", formatCurrency(data.calculations.downPaymentAmount)],
    ["Loan Amount", formatCurrency(data.calculations.loanAmount)],
    ["Total Interest", formatCurrency(data.calculations.totalInterest)],
    ["Monthly Payment", formatCurrency(data.calculations.monthlyPayment)],
    ["Total Insurance", formatCurrency(data.calculations.totalInsurance)],
    ["Total Tax", formatCurrency(data.calculations.totalTax)],
    ["Total Maintenance", formatCurrency(data.calculations.totalMaintenance)],
  ];

  if (data.calculations.totalDriverSalary > 0) {
    costBreakdown.push(["Total Driver Salary", formatCurrency(data.calculations.totalDriverSalary)]);
  }
  if (data.calculations.totalGasolineCost > 0) {
    costBreakdown.push(["Total Gasoline Cost", formatCurrency(data.calculations.totalGasolineCost)]);
  }

  costBreakdown.push(
    ["Depreciation Cost", formatCurrency(data.calculations.depreciationCost)],
    ["Residual Value", formatCurrency(data.calculations.residualValue)],
    ["Total Kilometers", `${data.calculations.totalKm.toLocaleString("id-ID")} km`]
  );

  autoTable(doc, {
    startY: yPos,
    head: [["Item", "Amount"]],
    body: costBreakdown,
    theme: "striped",
    headStyles: { fillColor: [0, 100, 200], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });
  yPos = doc.lastAutoTable.finalY + 10;

  // AI Summary
  checkPageBreak(40);
  const summaryCalc: SummaryCalculations = {
    costPerMonth: data.calculations.costPerMonth,
    totalDriverSalary: data.calculations.totalDriverSalary,
    totalGasolineCost: data.calculations.totalGasolineCost,
    totalMaintenance: data.calculations.totalMaintenance,
    costPerYear: data.calculations.costPerYear,
    totalKm: data.calculations.totalKm,
    lifecycleYears: data.calculations.lifecycleYears,
  };
  const aiSummary = generateMockAISummary(summaryCalc);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const splitSummary = doc.splitTextToSize(aiSummary, pageWidth - 2 * margin);
  doc.text(splitSummary, margin, yPos);
  yPos += splitSummary.length * 5 + 5;

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      "Astra Isuzu TCO Calculator - Confidential",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: "center" }
    );
  }

  // Generate filename
  const productLabel = PRODUCT_TYPES.find((p) => p.value === data.productType)?.label || "Vehicle";
  const sanitizedLabel = productLabel.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const filename = `TCO_Report_${sanitizedLabel}_${new Date().toISOString().split("T")[0]}.pdf`;

  doc.save(filename);
};

const TCOCalculator = () => {
  const [cabang, setCabang] = useState("");
  const [cabangOptions, setCabangOptions] = useState<{ value: string; label: string }[]>([]);
  const [plArea, setPlArea] = useState("");
  const [plAreaOptions, setPlAreaOptions] = useState<{ value: string; label: string }[]>([]);
  const [pricelist, setPricelist] = useState<number | null>(null);
  const [isPricelistLoading, setIsPricelistLoading] = useState(false);
  const [pricelistError, setPricelistError] = useState<string | null>(null);
  const [productType, setProductType] = useState("elf");
  const [registration, setRegistration] = useState("on-road");
  const [plateColor, setPlateColor] = useState("yellow");
  const [application, setApplication] = useState("pickup");
  const [lifecycle, setLifecycle] = useState("5");
  const [kmPerYear, setKmPerYear] = useState("60000");
  const [downPayment, setDownPayment] = useState("0.25");
  const [depreciation, setDepreciation] = useState("0.70");
  const [insurance, setInsurance] = useState("0.07");
  const [interestRate, setInterestRate] = useState("0.17");
  const [leasePeriod, setLeasePeriod] = useState("5");
  const [monthlyDriverSalary, setMonthlyDriverSalary] = useState("5000000");
  const [gasolinePrice, setGasolinePrice] = useState(DEFAULT_GASOLINE_PRICE.toString());
  const [fuelEfficiency, setFuelEfficiency] = useState(DEFAULT_FUEL_EFFICIENCY.toString());
  const [annualServiceBudget, setAnnualServiceBudget] = useState("5000000");
  const [annualPartBudget, setAnnualPartBudget] = useState("3000000");
  const [annualMaterialBudget, setAnnualMaterialBudget] = useState("2000000");
  const [serviceDiscountEnabled, setServiceDiscountEnabled] = useState(false);
  const [partDiscountEnabled, setPartDiscountEnabled] = useState(false);
  const [materialDiscountEnabled, setMaterialDiscountEnabled] = useState(false);
  const [serviceDiscount, setServiceDiscount] = useState("");
  const [partDiscount, setPartDiscount] = useState("");
  const [materialDiscount, setMaterialDiscount] = useState("");
  const [extendedWarrantyEnabled, setExtendedWarrantyEnabled] = useState(true);
  const [driverTrainingEnabled, setDriverTrainingEnabled] = useState(true);
  const [santunanEnabled, setSantunanEnabled] = useState(true);
  const [antiRustEnabled, setAntiRustEnabled] = useState(true);
  const [outletEfficiencyEnabled, setOutletEfficiencyEnabled] = useState(true);
  const [outletDowntimeEnabled, setOutletDowntimeEnabled] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);
  const [clipboardStatusMessage, setClipboardStatusMessage] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    try {
      // When embedded in Salesforce (iframe), window.self !== window.top
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(false);
    }
  }, []);

  // Load distinct Cabang and PL Area options from Supabase pricelist table
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data, error } = await supabaseRestSelect<any[]>(
          "pricelist",
          {
            select: 'Cabang,"PL Area"',
          }
        );

        if (error || !data) {
          // eslint-disable-next-line no-console
          console.error("Failed to load pricelist metadata", error);
          return;
        }

        const cabangSet = new Set<string>();
        const plAreaSet = new Set<string>();

        for (const row of data as any[]) {
          if (row.Cabang) cabangSet.add(row.Cabang as string);
          if (row["PL Area"]) plAreaSet.add(row["PL Area"] as string);
        }

        const cabangValues = Array.from(cabangSet).sort();
        const plAreaValues = Array.from(plAreaSet).sort();

        setCabangOptions(cabangValues.map((value) => ({ value, label: value })));
        setPlAreaOptions(plAreaValues.map((value) => ({ value, label: value })));

        setCabang((prev) => prev || (cabangValues[0] ?? ""));
        setPlArea((prev) => prev || (plAreaValues[0] ?? ""));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Unexpected error loading pricelist metadata", err);
      }
    };

    fetchMetadata();
  }, []);

  // Load pricelist amount for the selected Type, Cabang, and PL Area
  useEffect(() => {
    const fetchPricelist = async () => {
      if (!productType || !cabang || !plArea) {
        setPricelist(null);
        return;
      }

      setIsPricelistLoading(true);
      setPricelistError(null);

      try {
        const { data, error } = await supabaseRestSelect<any[]>(
          "pricelist",
          {
            select: "Pricelist",
            Type: `eq.${productType}`,
            Cabang: `eq.${cabang}`,
            "PL Area": `eq.${plArea}`,
            limit: "1",
          }
        );

        if (error || !data) {
          // eslint-disable-next-line no-console
          console.error("Error fetching pricelist", error);
          setPricelist(null);
          setPricelistError("Gagal mengambil pricelist dari server.");
        } else if (!data.length) {
          setPricelist(null);
          setPricelistError("Pricelist tidak ditemukan untuk kombinasi ini.");
        } else {
          const price = Number(data[0]?.Pricelist);
          setPricelist(Number.isFinite(price) ? price : null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Unexpected error fetching pricelist", err);
        setPricelist(null);
        setPricelistError("Terjadi kesalahan saat mengambil data pricelist.");
      } finally {
        setIsPricelistLoading(false);
      }
    };

    fetchPricelist();
  }, [productType, cabang, plArea]);

  const calculations = useMemo(() => {
    const vehiclePrice = pricelist ?? 0;
    const dpRate = parseFloat(downPayment);
    const depRate = parseFloat(depreciation);
    const insRate = parseFloat(insurance);
    const intRate = parseFloat(interestRate);
    const leaseYears = parseInt(leasePeriod);
    const lifecycleYears = parseInt(lifecycle);
    const annualKm = parseInt(kmPerYear);
    const driverSalary = monthlyDriverSalary ? parseFloat(monthlyDriverSalary) : 0;
    const gasPrice = gasolinePrice ? parseFloat(gasolinePrice) : DEFAULT_GASOLINE_PRICE;
    const fuelEff = fuelEfficiency ? parseFloat(fuelEfficiency) : DEFAULT_FUEL_EFFICIENCY;
    const serviceBudget = annualServiceBudget ? parseFloat(annualServiceBudget) : 0;
    const partBudget = annualPartBudget ? parseFloat(annualPartBudget) : 0;
    const materialBudget = annualMaterialBudget ? parseFloat(annualMaterialBudget) : 0;

    const serviceDiscRate =
      serviceDiscountEnabled && serviceDiscount ? parseFloat(serviceDiscount) / 100 : 0;
    const partDiscRate =
      partDiscountEnabled && partDiscount ? parseFloat(partDiscount) / 100 : 0;
    const materialDiscRate =
      materialDiscountEnabled && materialDiscount ? parseFloat(materialDiscount) / 100 : 0;

    const effectiveServiceBudget = Math.max(serviceBudget * (1 - serviceDiscRate), 0);
    const effectivePartBudget = Math.max(partBudget * (1 - partDiscRate), 0);
    const effectiveMaterialBudget = Math.max(materialBudget * (1 - materialDiscRate), 0);

    const annualMaintenanceTotal =
      effectiveServiceBudget + effectivePartBudget + effectiveMaterialBudget;

    // Calculations
    const downPaymentAmount = vehiclePrice * dpRate;
    const loanAmount = vehiclePrice - downPaymentAmount;
    const totalInterest = loanAmount * intRate * leaseYears;
    const totalLoanPayment = loanAmount + totalInterest;
    const monthlyPayment = totalLoanPayment / (leaseYears * 12);

    const residualValue = vehiclePrice * (1 - depRate);
    const depreciationCost = vehiclePrice - residualValue;

    const annualInsurance = vehiclePrice * insRate;
    const totalInsurance = annualInsurance * lifecycleYears;

    const totalTax = TAX_AMOUNT * lifecycleYears;
    const totalKm = annualKm * lifecycleYears;

    // Operational costs
    const totalDriverSalary = driverSalary * 12 * lifecycleYears;
    const totalGasolineCostBefore = (totalKm / fuelEff) * gasPrice;
    const totalMaintenanceBudget = annualMaintenanceTotal * lifecycleYears;
    const totalMaintenance = totalMaintenanceBudget;

    // Astra Isuzu advantages - savings
    let extendedWarrantySaving = 0;
    if (extendedWarrantyEnabled) {
      if (productType === "giga") {
        extendedWarrantySaving = 83250000;
      } else if (productType === "elf") {
        extendedWarrantySaving = 52160000;
      } else if (productType === "traga") {
        extendedWarrantySaving = 38800000;
      }
    }

    const santunanSaving = santunanEnabled ? 20000000 : 0;
    const antiRustSaving = antiRustEnabled ? 3500000 : 0;
    const outletEfficiencySaving = outletEfficiencyEnabled ? 150012000 : 0;
    const outletDowntimeSaving = outletDowntimeEnabled ? 1023867 : 0;

    const totalGasolineCostAfter = driverTrainingEnabled
      ? totalGasolineCostBefore * 0.82
      : totalGasolineCostBefore;
    const driverTrainingSaving = totalGasolineCostBefore - totalGasolineCostAfter;

    const totalAstraAdvantagesSaving =
      extendedWarrantySaving +
      santunanSaving +
      antiRustSaving +
      outletEfficiencySaving +
      outletDowntimeSaving +
      driverTrainingSaving;

    // Total Cost of Ownership (before and after Astra Isuzu advantages)
    const totalCostOfOwnershipBefore =
      downPaymentAmount +
      totalLoanPayment +
      totalInsurance +
      totalTax +
      totalMaintenance +
      totalDriverSalary +
      totalGasolineCostBefore;

    const totalCostOfOwnershipAfter = Math.max(
      totalCostOfOwnershipBefore - totalAstraAdvantagesSaving,
      0
    );

    const costPerKmBefore = totalKm > 0 ? totalCostOfOwnershipBefore / totalKm : 0;
    const costPerKmAfter = totalKm > 0 ? totalCostOfOwnershipAfter / totalKm : 0;
    const costPerYearBefore =
      lifecycleYears > 0 ? totalCostOfOwnershipBefore / lifecycleYears : 0;
    const costPerYearAfter =
      lifecycleYears > 0 ? totalCostOfOwnershipAfter / lifecycleYears : 0;
    const costPerMonthBefore = costPerYearBefore / 12;
    const costPerMonthAfter = costPerYearAfter / 12;

    // For backward compatibility, keep "after advantages" as primary metrics
    const totalCostOfOwnership = totalCostOfOwnershipAfter;
    const totalGasolineCost = totalGasolineCostAfter;
    const costPerKm = costPerKmAfter;
    const costPerYear = costPerYearAfter;
    const costPerMonth = costPerMonthAfter;

    return {
      vehiclePrice,
      downPaymentAmount,
      loanAmount,
      totalInterest,
      totalLoanPayment,
      monthlyPayment,
      residualValue,
      depreciationCost,
      annualInsurance,
      totalInsurance,
      totalTax,
      totalKm,
      totalMaintenance,
      totalDriverSalary,
      totalGasolineCost,
      totalMaintenanceBudget,
      totalGasolineCostBeforeAdvantages: totalGasolineCostBefore,
      totalGasolineCostAfterAdvantages: totalGasolineCostAfter,
      totalCostOfOwnershipBeforeAdvantages: totalCostOfOwnershipBefore,
      totalCostOfOwnershipAfterAdvantages: totalCostOfOwnershipAfter,
      totalAstraAdvantagesSaving,
      costPerKmBeforeAdvantages: costPerKmBefore,
      costPerKmAfterAdvantages: costPerKmAfter,
      costPerYearBeforeAdvantages: costPerYearBefore,
      costPerYearAfterAdvantages: costPerYearAfter,
      costPerMonthBeforeAdvantages: costPerMonthBefore,
      costPerMonthAfterAdvantages: costPerMonthAfter,
      totalCostOfOwnership,
      costPerKm,
      costPerYear,
      costPerMonth,
      lifecycleYears,
    };
  }, [
    pricelist,
    productType,
    downPayment,
    depreciation,
    insurance,
    interestRate,
    leasePeriod,
    lifecycle,
    kmPerYear,
    monthlyDriverSalary,
    gasolinePrice,
    fuelEfficiency,
    annualServiceBudget,
    annualPartBudget,
    annualMaterialBudget,
    serviceDiscountEnabled,
    partDiscountEnabled,
    materialDiscountEnabled,
    serviceDiscount,
    partDiscount,
    materialDiscount,
    extendedWarrantyEnabled,
    driverTrainingEnabled,
    santunanEnabled,
    antiRustEnabled,
    outletEfficiencyEnabled,
    outletDowntimeEnabled,
  ]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className={`flex flex-col items-center gap-4 ${
              isEmbedded ? "mb-2" : "mb-4"
            }`}
          >
            <img src={astraLogo} alt="Astra Isuzu Logo" className="h-16 md:h-20 w-auto" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Astra Isuzu TCO Calculator
            </h1>
          </div>
          {!isEmbedded && (
            <p className="text-muted-foreground text-lg">
              Total Cost of Ownership Calculator for Product and Service of Astra Isuzu dealership
            </p>
          )}
        </div>

        {/* Stepper & mobile summary shortcut */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center justify-center gap-4 md:justify-start">
              {[
                {
                  id: 1 as const,
                  label: "Kendaraan",
                  description: "Konfigurasi unit & penggunaan",
                },
                {
                  id: 2 as const,
                  label: "Biaya",
                  description: "Parameter finansial & operasional",
                },
                {
                  id: 3 as const,
                  label: "Keunggulan & Ringkasan",
                  description: "Astra Isuzu advantages & TCO",
                },
              ].map((step) => {
                const isActive = currentStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className="flex items-center gap-3 text-left text-sm focus:outline-none"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {step.id}
                    </div>
                    <div>
                      <div
                        className={`font-medium ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="hidden text-xs text-muted-foreground sm:block">
                        {step.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full md:w-auto md:hidden"
              onClick={() => {
                const el = document.getElementById("tco-summary");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              Lihat Ringkasan TCO
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 1 && (
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5" />
                    Vehicle Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productType">Tipe Produk</Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger id="productType" className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cabang">Cabang</Label>
                    <Select
                      value={cabang}
                      onValueChange={setCabang}
                      disabled={cabangOptions.length === 0}
                    >
                      <SelectTrigger id="cabang" className="bg-card">
                        <SelectValue placeholder="Pilih cabang" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {cabangOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plArea">PL Area</Label>
                    <Select
                      value={plArea}
                      onValueChange={setPlArea}
                      disabled={plAreaOptions.length === 0}
                    >
                      <SelectTrigger id="plArea" className="bg-card">
                        <SelectValue placeholder="Pilih PL Area" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {plAreaOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricelist">Harga Kendaraan (IDR)</Label>
                    <Input
                      id="pricelist"
                      type="text"
                      value={
                        isPricelistLoading
                          ? "Memuat..."
                          : pricelist !== null
                          ? formatCurrency(pricelist)
                          : ""
                      }
                      placeholder={
                        productType && cabang && plArea
                          ? "Pricelist tidak ditemukan"
                          : "Pilih Tipe, Cabang, dan PL Area"
                      }
                      disabled
                      className="bg-muted"
                    />
                    {pricelistError && (
                      <p className="text-xs text-red-500">{pricelistError}</p>
                    )}
                    {!pricelistError &&
                      !isPricelistLoading &&
                      productType &&
                      cabang &&
                      plArea &&
                      pricelist === null && (
                        <p className="text-xs text-muted-foreground">
                          Pricelist tidak ditemukan untuk kombinasi ini.
                        </p>
                      )}
                    <p className="text-xs text-muted-foreground">
                      Harga diambil otomatis dari database pricelist berdasarkan Tipe,
                      Cabang, dan PL Area.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration">Registrasi Polisi</Label>
                    <Select value={registration} onValueChange={setRegistration}>
                      <SelectTrigger id="registration" className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {REGISTRATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plateColor">Warna Plat Nomor</Label>
                    <Select value={plateColor} onValueChange={setPlateColor}>
                      <SelectTrigger id="plateColor" className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {PLATE_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            {color.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="application">Aplikasi</Label>
                    <Select value={application} onValueChange={setApplication}>
                      <SelectTrigger id="application" className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {APPLICATIONS.map((app) => (
                          <SelectItem key={app.value} value={app.value}>
                            {app.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lifecycle">Umur Operasional</Label>
                    <Select value={lifecycle} onValueChange={setLifecycle}>
                      <SelectTrigger id="lifecycle" className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {LIFECYCLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kmPerYear">Kilometer per tahun</Label>
                    <Select value={kmPerYear} onValueChange={setKmPerYear}>
                      <SelectTrigger id="kmPerYear" className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {KM_PER_YEAR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <>
                {/* Operational Parameters */}
                <Card className="shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Fuel className="h-5 w-5" />
                      Operational Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyDriverSalary">Gaji Bulanan Driver (IDR/bulan)</Label>
                      <Input
                        id="monthlyDriverSalary"
                        type="number"
                        placeholder="Contoh: 5.000.000"
                        value={monthlyDriverSalary}
                        onChange={(e) => setMonthlyDriverSalary(e.target.value)}
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gasolinePrice">Biaya BBM (IDR/liter)</Label>
                      <Input
                        id="gasolinePrice"
                        type="number"
                        placeholder={`Default: ${formatNumberId(DEFAULT_GASOLINE_PRICE)}`}
                        value={gasolinePrice}
                        onChange={(e) => setGasolinePrice(e.target.value)}
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fuelEfficiency">Rasio Bahan Bakar (km/liter)</Label>
                      <Input
                        id="fuelEfficiency"
                        type="number"
                        placeholder={`Default: ${DEFAULT_FUEL_EFFICIENCY}`}
                        value={fuelEfficiency}
                        onChange={(e) => setFuelEfficiency(e.target.value)}
                        className="bg-card"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nilai yang lebih tinggi berarti penggunaan BBM lebih efisien.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="annualServiceBudget">Service Budget (IDR/year)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="annualServiceBudget"
                          type="number"
                          placeholder="Contoh: 5.000.000"
                          value={annualServiceBudget}
                          onChange={(e) => setAnnualServiceBudget(e.target.value)}
                          className="bg-card"
                        />
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Checkbox
                          id="serviceDiscountEnabled"
                          checked={serviceDiscountEnabled}
                          onCheckedChange={(checked) =>
                            setServiceDiscountEnabled(checked === true)
                          }
                        />
                        <Label htmlFor="serviceDiscountEnabled" className="text-sm">
                          Tambahkan diskon servis (%)
                        </Label>
                        {serviceDiscountEnabled && (
                          <Input
                            id="serviceDiscount"
                            type="number"
                            placeholder="Contoh: 10"
                            value={serviceDiscount}
                            onChange={(e) => setServiceDiscount(e.target.value)}
                            className="w-32 bg-card"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Diskon akan mengurangi total biaya servis tahunan secara proporsional.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="annualPartBudget">Part Budget (IDR/year)</Label>
                      <Input
                        id="annualPartBudget"
                        type="number"
                        placeholder="Contoh: 3.000.000"
                        value={annualPartBudget}
                        onChange={(e) => setAnnualPartBudget(e.target.value)}
                        className="bg-card"
                      />
                      <div className="mt-1 flex items-center gap-2">
                        <Checkbox
                          id="partDiscountEnabled"
                          checked={partDiscountEnabled}
                          onCheckedChange={(checked) =>
                            setPartDiscountEnabled(checked === true)
                          }
                        />
                        <Label htmlFor="partDiscountEnabled" className="text-sm">
                          Tambahkan diskon part (%)
                        </Label>
                        {partDiscountEnabled && (
                          <Input
                            id="partDiscount"
                            type="number"
                            placeholder="Contoh: 10"
                            value={partDiscount}
                            onChange={(e) => setPartDiscount(e.target.value)}
                            className="w-32 bg-card"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="annualMaterialBudget">Material Budget (IDR/year)</Label>
                      <Input
                        id="annualMaterialBudget"
                        type="number"
                        placeholder="Contoh: 2.000.000"
                        value={annualMaterialBudget}
                        onChange={(e) => setAnnualMaterialBudget(e.target.value)}
                        className="bg-card"
                      />
                      <div className="mt-1 flex items-center gap-2">
                        <Checkbox
                          id="materialDiscountEnabled"
                          checked={materialDiscountEnabled}
                          onCheckedChange={(checked) =>
                            setMaterialDiscountEnabled(checked === true)
                          }
                        />
                        <Label htmlFor="materialDiscountEnabled" className="text-sm">
                          Tambahkan diskon material (%)
                        </Label>
                        {materialDiscountEnabled && (
                          <Input
                            id="materialDiscount"
                            type="number"
                            placeholder="Contoh: 10"
                            value={materialDiscount}
                            onChange={(e) => setMaterialDiscount(e.target.value)}
                            className="w-32 bg-card"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Parameters */}
                <Card className="shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5" />
                      Financial Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="downPayment">Down Payment</Label>
                      <Select value={downPayment} onValueChange={setDownPayment}>
                        <SelectTrigger id="downPayment" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {DOWN_PAYMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="depreciation">Depresiasi</Label>
                      <Select value={depreciation} onValueChange={setDepreciation}>
                        <SelectTrigger id="depreciation" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {DEPRECIATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insurance">Rate Asuransi</Label>
                      <Select value={insurance} onValueChange={setInsurance}>
                        <SelectTrigger id="insurance" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {INSURANCE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Suku Bunga</Label>
                      <Select value={interestRate} onValueChange={setInterestRate}>
                        <SelectTrigger id="interestRate" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {INTEREST_RATE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leasePeriod">Periode Angsuran</Label>
                      <Select value={leasePeriod} onValueChange={setLeasePeriod}>
                        <SelectTrigger id="leasePeriod" className="bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {LEASE_PERIOD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tax (Annual)</Label>
                      <Input
                        value={formatCurrency(TAX_AMOUNT)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {currentStep === 3 && (
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    Astra Isuzu Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="extendedWarrantyEnabled"
                        checked={extendedWarrantyEnabled}
                        onCheckedChange={(checked) =>
                          setExtendedWarrantyEnabled(checked === true)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="extendedWarrantyEnabled" className="font-medium">
                          Extended Warranty Astra Isuzu
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mengurangi biaya perawatan tambahan sesuai tipe unit (GIGA, ELF, TRAGA).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="driverTrainingEnabled"
                        checked={driverTrainingEnabled}
                        onCheckedChange={(checked) =>
                          setDriverTrainingEnabled(checked === true)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="driverTrainingEnabled" className="font-medium">
                          Pelatihan Pengemudi
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mengurangi biaya BBM hingga 18% berkat cara mengemudi yang lebih efisien.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="santunanEnabled"
                        checked={santunanEnabled}
                        onCheckedChange={(checked) =>
                          setSantunanEnabled(checked === true)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="santunanEnabled" className="font-medium">
                          Santunan Driver
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mengurangi risiko biaya tak terduga hingga Rp 20.000.000.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="antiRustEnabled"
                        checked={antiRustEnabled}
                        onCheckedChange={(checked) =>
                          setAntiRustEnabled(checked === true)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="antiRustEnabled" className="font-medium">
                          Anti-rust
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Melindungi bodi dari karat dan menghemat biaya perbaikan hingga Rp 3.500.000.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="outletEfficiencyEnabled"
                        checked={outletEfficiencyEnabled}
                        onCheckedChange={(checked) =>
                          setOutletEfficiencyEnabled(checked === true)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="outletEfficiencyEnabled" className="font-medium">
                          Jaringan Outlet – Efisiensi Jarak
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mengurangi biaya operasional berkat outlet yang lebih dekat (hemat hingga Rp
                          150.012.000 sepanjang lifecycle).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="outletDowntimeEnabled"
                        checked={outletDowntimeEnabled}
                        onCheckedChange={(checked) =>
                          setOutletDowntimeEnabled(checked === true)
                        }
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="outletDowntimeEnabled" className="font-medium">
                          Jaringan Outlet – Hindari Downtime
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Menekan biaya downtime hingga Rp 1.023.867 berkat perbaikan yang lebih cepat.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step navigation for mobile/tablet */}
            <div className="flex items-center justify-between pt-2 md:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentStep === 1}
                onClick={() =>
                  setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))
                }
              >
                Sebelumnya
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev))
                }
              >
                {currentStep === 3 ? "Tetap di Ringkasan" : "Berikutnya"}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* TCO Summary */}
            <Card
              id="tco-summary"
              className="shadow-lg bg-primary text-primary-foreground"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Total Cost of Ownership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold mb-4">
                  {formatCurrency(calculations.totalCostOfOwnership)}
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-t border-primary-foreground/20">
                    <span className="text-primary-foreground/80">Cost per Year</span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.costPerYear)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-primary-foreground/20">
                    <span className="text-primary-foreground/80">Cost per Month</span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.costPerMonth)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-primary-foreground/20">
                    <span className="text-primary-foreground/80">Cost per KM</span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.costPerKm)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-primary-foreground/20">
                    <span className="text-primary-foreground/80">
                      Cost per KM (Before Astra Isuzu)
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.costPerKmBeforeAdvantages)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-primary-foreground/20">
                    <span className="text-primary-foreground/80">
                      Cost per KM (After Astra Isuzu)
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.costPerKmAfterAdvantages)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-primary-foreground/80">
                      TCO Before Astra Isuzu
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.totalCostOfOwnershipBeforeAdvantages)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-foreground/80">
                      Savings from Astra Isuzu Advantages
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(calculations.totalAstraAdvantagesSaving)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                  <Button
                    onClick={async () => {
                      try {
                        setPdfStatusMessage("Menghasilkan laporan PDF...");
                        generatePDFReport({
                          cabang,
                          plArea,
                          productType,
                          registration,
                          plateColor,
                          application,
                          lifecycle,
                          kmPerYear,
                          downPayment,
                          depreciation,
                          insurance,
                          interestRate,
                          leasePeriod,
                          monthlyDriverSalary,
                          gasolinePrice,
                          fuelEfficiency,
                          annualServiceBudget,
                          annualPartBudget,
                          annualMaterialBudget,
                          serviceDiscount,
                          partDiscount,
                          materialDiscount,
                          extendedWarrantyEnabled,
                          driverTrainingEnabled,
                          santunanEnabled,
                          antiRustEnabled,
                          outletEfficiencyEnabled,
                          outletDowntimeEnabled,
                          calculations,
                        });
                        setPdfStatusMessage("Laporan PDF berhasil diunduh.");
                      } catch (error) {
                        setPdfStatusMessage(
                          "Terjadi kesalahan saat mengunduh laporan PDF. Silakan coba lagi."
                        );
                      }
                    }}
                    className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
                  <div className="mt-3 space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-primary-foreground/40 bg-primary/10 text-primary-foreground hover:bg-primary/20"
                      onClick={async () => {
                        const summaryText = [
                          `Total TCO: ${formatCurrency(calculations.totalCostOfOwnership)}`,
                          `Biaya per bulan: ${formatCurrency(calculations.costPerMonth)}`,
                          `Biaya per km: ${formatCurrency(calculations.costPerKm)}`,
                          `Penghematan Astra Isuzu: ${formatCurrency(
                            calculations.totalAstraAdvantagesSaving
                          )}`,
                        ].join(" | ");

                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(summaryText);
                            setClipboardStatusMessage(
                              "Ringkasan angka utama berhasil disalin ke clipboard."
                            );
                          } else {
                            setClipboardStatusMessage(
                              "Clipboard tidak tersedia di browser ini. Silakan salin manual."
                            );
                          }
                        } catch (error) {
                          setClipboardStatusMessage(
                            "Gagal menyalin ringkasan. Silakan coba lagi atau salin manual."
                          );
                        }
                      }}
                    >
                      Salin Ringkasan
                    </Button>
                    {clipboardStatusMessage && (
                      <p className="text-xs text-primary-foreground/80">
                        {clipboardStatusMessage}
                      </p>
                    )}
                    {pdfStatusMessage && (
                      <p className="text-xs text-primary-foreground/80">
                        {pdfStatusMessage}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Vehicle Cost
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Vehicle Price</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.vehiclePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Down Payment</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.downPaymentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Amount</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.loanAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Financing Cost
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Interest</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalInterest)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Payment</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.monthlyPayment)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Operating Costs
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Insurance</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalInsurance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tax</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalTax)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Maintenance</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalMaintenance)}
                      </span>
                    </div>
                    {calculations.totalDriverSalary > 0 && (
                      <div className="flex justify-between">
                        <span>Total Driver Salary</span>
                        <span className="font-medium">
                          {formatCurrency(calculations.totalDriverSalary)}
                        </span>
                      </div>
                    )}
                    {calculations.totalGasolineCost > 0 && (
                      <div className="flex justify-between">
                        <span>Total Gasoline Cost</span>
                        <span className="font-medium">
                          {formatCurrency(calculations.totalGasolineCost)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Asset Value
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Depreciation Cost</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.depreciationCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Residual Value</span>
                      <span className="font-medium text-secondary">
                        {formatCurrency(calculations.residualValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Usage Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Kilometers</span>
                      <span className="font-medium">
                        {calculations.totalKm.toLocaleString("id-ID")} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>TCO Before Astra Isuzu</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalCostOfOwnershipBeforeAdvantages)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>TCO After Astra Isuzu</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalCostOfOwnership)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Savings from Astra Isuzu </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(calculations.totalAstraAdvantagesSaving)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary Generated */}
            <Card className="shadow-md border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Summary Generated
                  <Badge variant="secondary" className="ml-auto text-xs font-normal">
                    AI Generated
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  {generateMockAISummaryBullets({
                    costPerMonth: calculations.costPerMonth,
                    totalDriverSalary: calculations.totalDriverSalary,
                    totalGasolineCost: calculations.totalGasolineCost,
                    totalMaintenance: calculations.totalMaintenance,
                    costPerYear: calculations.costPerYear,
                    totalKm: calculations.totalKm,
                    lifecycleYears: calculations.lifecycleYears,
                  }).map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-[2px]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCOCalculator;
