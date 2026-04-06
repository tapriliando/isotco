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
import { supabaseRestSelect, supabaseRestSelectCached } from "@/lib/supabaseClient";
// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
import appLogo from "@/assets/app_logo.png";
const PRODUCT_TYPES = [
  { value: "[RTU] MICROBUS IAMI LONG E4", label: "[RTU] MICROBUS IAMI LONG E4", basePrice: "-" },
  { value: "[RTU] MICROBUS IAMI SHORT E4", label: "[RTU] MICROBUS IAMI SHORT E4", basePrice: "-" },
  {
    value: "[RTU-IAMI] TRAGA BOX (SEMI AL.) E4",
    label: "[RTU-IAMI] TRAGA BOX (SEMI AL.) E4",
    basePrice: "-",
  },
  { value: "FRR Q E4", label: "FRR Q E4", basePrice: "-" },
  { value: "FTR P E4", label: "FTR P E4", basePrice: "-" },
  { value: "FTR S E4", label: "FTR S E4", basePrice: "-" },
  { value: "FTR T E4", label: "FTR T E4", basePrice: "-" },
  { value: "FVM N E4", label: "FVM N E4", basePrice: "-" },
  { value: "FVM N Hi Power ABS E4", label: "FVM N Hi Power ABS E4", basePrice: "-" },
  { value: "FVM U E4", label: "FVM U E4", basePrice: "-" },
  { value: "FVM U Hi Power E4", label: "FVM U Hi Power E4", basePrice: "-" },
  { value: "FVR L Dump E4", label: "FVR L Dump E4", basePrice: "-" },
  { value: "FVR P E4", label: "FVR P E4", basePrice: "-" },
  { value: "FVR Q E4", label: "FVR Q E4", basePrice: "-" },
  { value: "FVR S E4", label: "FVR S E4", basePrice: "-" },
  { value: "FVR U E4", label: "FVR U E4", basePrice: "-" },
  { value: "FVZ L Hi Power Mixer E4", label: "FVZ L Hi Power Mixer E4", basePrice: "-" },
  { value: "FVZ N Hi Power E4", label: "FVZ N Hi Power E4", basePrice: "-" },
  {
    value: "FVZ N HP E4 - SPEC. MINING",
    label: "FVZ N HP E4 - SPEC. MINING",
    basePrice: "-",
  },
  { value: "FVZ U Hi Power E4", label: "FVZ U Hi Power E4", basePrice: "-" },
  { value: "GVR J E4", label: "GVR J E4", basePrice: "-" },
  { value: "GVR J Hi Power ABS E4", label: "GVR J Hi Power ABS E4", basePrice: "-" },
  { value: "GVZ K Hi Power ABS E4", label: "GVZ K Hi Power ABS E4", basePrice: "-" },
  { value: "GXZ K ABS E4", label: "GXZ K ABS E4", basePrice: "-" },
  { value: "NLR B E4", label: "NLR B E4", basePrice: "-" },
  { value: "NLR B L E4", label: "NLR B L E4", basePrice: "-" },
  { value: "NLR T E4", label: "NLR T E4", basePrice: "-" },
  { value: "NLR T L E4", label: "NLR T L E4", basePrice: "-" },
  { value: "NMR E4", label: "NMR E4", basePrice: "-" },
  { value: "NMR HD 5.8 E4", label: "NMR HD 5.8 E4", basePrice: "-" },
  { value: "NMR HD 6.5 E4", label: "NMR HD 6.5 E4", basePrice: "-" },
  { value: "NMR L E4", label: "NMR L E4", basePrice: "-" },
  { value: "NPS E4", label: "NPS E4", basePrice: "-" },
  { value: "NQR B E4", label: "NQR B E4", basePrice: "-" },
  { value: "TRAGA BUS E4", label: "TRAGA BUS E4", basePrice: "-" },
  { value: "TRAGA CHASSIS BUS E4", label: "TRAGA CHASSIS BUS E4", basePrice: "-" },
  { value: "TRAGA CHASSIS E4", label: "TRAGA CHASSIS E4", basePrice: "-" },
  { value: "TRAGA FD E4", label: "TRAGA FD E4", basePrice: "-" },
  {
    value: "TRAGA FD E4 [BLACK PREMIUM]",
    label: "TRAGA FD E4 [BLACK PREMIUM]",
    basePrice: "-",
  },
];

const REGISTRATION_TYPES = [
  { value: "on-road", label: "On-road" },
  { value: "off-road", label: "Off-road" },
];

const PLATE_COLORS = [
  { value: "yellow", label: "Kuning" },
  { value: "white", label: "Putih" },
];

const RUTE_OPERATIONAL_OPTIONS = [
  { value: "Pulau Bali & Nusa Tenggara", label: "Pulau Bali & Nusa Tenggara" },
  { value: "Pulau Jawa", label: "Pulau Jawa" },
  { value: "Pulau Sumatera", label: "Pulau Sumatera" },
  { value: "Pulau Kalimantan", label: "Pulau Kalimantan" },
  { value: "Pulau Sulawesi", label: "Pulau Sulawesi" },
  { value: "Pulau Maluku & Papua", label: "Maluku & Papua" },
  { value: "Pulau Jawa - Sumatera", label: "Pulau Jawa - Sumatera" },
];

/** Classify product type into series for extended warranty: F/G = giga, N/Microbus = elf, T/TRAGA = traga */
function getProductSeries(productType: string): "giga" | "elf" | "traga" | null {
  if (!productType || typeof productType !== "string") return null;
  const upper = productType.trim().toUpperCase();
  if (upper.includes("MICROBUS") || upper.startsWith("N")) return "elf";
  if (upper.startsWith("F") || upper.startsWith("G")) return "giga";
  if (upper.includes("TRAGA") || upper.startsWith("T")) return "traga";
  return null;
}

const PL_AREA_OPTIONS = [
  { value: "BALI", label: "BALI" },
  { value: "BODETABEK", label: "BODETABEK" },
  { value: "DIY", label: "DIY" },
  { value: "DKI", label: "DKI" },
  { value: "JABAR", label: "JABAR" },
  { value: "JAMBI", label: "JAMBI" },
  { value: "JATENG", label: "JATENG" },
  { value: "JATIM", label: "JATIM" },
  { value: "KALSEL", label: "KALSEL" },
  { value: "KALTIM", label: "KALTIM" },
  { value: "LAMPUNG", label: "LAMPUNG" },
  { value: "RIAU", label: "RIAU" },
  { value: "SULSEL", label: "SULSEL" },
  { value: "SULTRA", label: "SULTRA" },
  { value: "SULUT", label: "SULUT" },
  { value: "SUMBAR", label: "SUMBAR" },
  { value: "SUMSEL", label: "SUMSEL" },
  { value: "SUMUT", label: "SUMUT" },
];

const PROVINCE_OPTIONS = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kep. Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "NTB",
  "NTT",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
].map((p) => ({ value: p, label: p }));

const SEGMENTASI_OPTIONS = [
  "Agriculture, Forestry & Fishing",
  "Mining & Quarrying",
  "Refinery",
  "Manufacturing",
  "Construction",
  "Distributor & Retail",
  "Public Transporter",
  "General Transporter",
  "Industrial Transporter",
  "Courier",
  "Freight Forwarder",
  "Private Bus",
  "Total Logistic",
  "Rental",
  "Accommodation",
  "Information & Communication",
  "Financial",
  "Real Estate",
  "Government",
  "Education",
  "Others",
].map((s) => ({ value: s, label: s }));

const CABANG_OPTIONS = [
  { value: "BALIKPAPAN", label: "BALIKPAPAN" },
  { value: "BANDUNG", label: "BANDUNG" },
  { value: "BANJARMASIN", label: "BANJARMASIN" },
  { value: "BATURAJA", label: "BATURAJA" },
  { value: "BOGOR", label: "BOGOR" },
  { value: "CILEGON", label: "CILEGON" },
  { value: "CILEUNGSI", label: "CILEUNGSI" },
  { value: "CIPUTAT", label: "CIPUTAT" },
  { value: "CIREBON", label: "CIREBON" },
  { value: "DAAN MOGOT", label: "DAAN MOGOT" },
  { value: "DELI SERDANG", label: "DELI SERDANG" },
  { value: "DENPASAR", label: "DENPASAR" },
  { value: "DURI", label: "DURI" },
  { value: "GIANYAR", label: "GIANYAR" },
  { value: "GSO & FLEET", label: "GSO & FLEET" },
  { value: "HARAPAN INDAH", label: "HARAPAN INDAH" },
  { value: "JAMBI", label: "JAMBI" },
  { value: "KARAWANG", label: "KARAWANG" },
  { value: "KENDARI", label: "KENDARI" },
  { value: "LAMPUNG", label: "LAMPUNG" },
  { value: "MAKASSAR", label: "MAKASSAR" },
  { value: "MALANG", label: "MALANG" },
  { value: "MANADO", label: "MANADO" },
  { value: "MEDAN", label: "MEDAN" },
  { value: "PADANG", label: "PADANG" },
  { value: "PALEMBANG", label: "PALEMBANG" },
  { value: "PASURUAN", label: "PASURUAN" },
  { value: "PEKALONGAN", label: "PEKALONGAN" },
  { value: "PEKANBARU", label: "PEKANBARU" },
  { value: "PRABUMULIH", label: "PRABUMULIH" },
  { value: "RANCAEKEK", label: "RANCAEKEK" },
  { value: "SAMARINDA", label: "SAMARINDA" },
  { value: "SANGATTA", label: "SANGATTA" },
  { value: "SEMARANG", label: "SEMARANG" },
  { value: "SIDRAP", label: "SIDRAP" },
  { value: "SINGARAJA", label: "SINGARAJA" },
  { value: "SOLO", label: "SOLO" },
  { value: "SUKABUMI", label: "SUKABUMI" },
  { value: "SUNTER", label: "SUNTER" },
  { value: "SURABAYA - KOMBES DURYAT", label: "SURABAYA - KOMBES DURYAT" },
  { value: "SURABAYA - MARGOMULYO", label: "SURABAYA - MARGOMULYO" },
  { value: "SURABAYA - WARU", label: "SURABAYA - WARU" },
  { value: "TANGERANG", label: "TANGERANG" },
  { value: "TANJUNG", label: "TANJUNG" },
  { value: "TULANG BAWANG", label: "TULANG BAWANG" },
  { value: "YOGYAKARTA", label: "YOGYAKARTA" },
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
  { value: "0.30", label: "30%" },
  { value: "0.25", label: "25%" },
];

// Insurance and interest rate will be entered manually as percentages by the user.

const LEASE_PERIOD_OPTIONS = [
  { value: "3", label: "3 Years" },
  { value: "4", label: "4 Years" },
  { value: "5", label: "5 Years" },
];

const TAX_AMOUNT = 1000000; // Default/fallback tax amount (IDR)
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

type CalculationsResult = {
  vehiclePrice: number;
  rawVehiclePrice: number;
  discountAmount: number;
  karoseriAmount: number;
  downPaymentAmount: number;
  loanAmount: number;
  totalInterest: number;
  totalLoanPayment: number;
  monthlyPayment: number;
  residualValue: number;
  depreciationCost: number;
  annualInsurance: number;
  totalInsurance: number;
  annualTax: number;
  totalTax: number;
  totalKm: number;
  totalMaintenance: number;
  annualTireCost: number;
  totalTireCost: number;
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
  segmentasi: string;
  province: string;
  city: string;
  operationalRoute: string;
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
    ["Harga Karoseri", formatCurrency(data.calculations.karoseriAmount)],
    ["Diskon", formatCurrency(data.calculations.discountAmount)],
    ["Registrasi", REGISTRATION_TYPES.find((r) => r.value === data.registration)?.label || data.registration],
    ["Warna Plat", data.registration === "off-road" ? "-" : (PLATE_COLORS.find((p) => p.value === data.plateColor)?.label || data.plateColor)],
    ["Aplikasi", data.application || "-"],
    ["Segmentasi", data.segmentasi || "-"],
    ["Provinsi", data.province || "-"],
    ["Kota/Kabupaten", data.city || "-"],
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
    ["Insurance Rate", `${parseFloat(data.insurance).toFixed(2)}%`],
    ["Suku Bunga", `${parseFloat(data.interestRate).toFixed(0)}%`],
    ["Periode Sewa", `${data.leasePeriod} Years`],
    ["Pajak Tahunan", formatCurrency(data.calculations.annualTax)],
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
    [
      "Biaya Penggantian Ban per Tahun",
      data.calculations.annualTireCost
        ? formatCurrency(data.calculations.annualTireCost)
        : "Not set",
    ],
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
  if (data.calculations.totalTireCost > 0) {
    // Note: totalMaintenance already includes totalTireCost (tire replacement is a component of maintenance).
    costBreakdown.push(["Penggantian Ban", formatCurrency(data.calculations.totalTireCost)]);
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
  const [cabang, setCabang] = useState(CABANG_OPTIONS[0]?.value ?? "");
  const [plArea, setPlArea] = useState(PL_AREA_OPTIONS[0]?.value ?? "");
  const [productTypeOptions, setProductTypeOptions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [pricelist, setPricelist] = useState<number | null>(null);
  const [isPricelistLoading, setIsPricelistLoading] = useState(false);
  const [pricelistError, setPricelistError] = useState<string | null>(null);
  const [discount, setDiscount] = useState("0");
  const [karoseri, setKaroseri] = useState("");
  const [productType, setProductType] = useState("");
  const [registration, setRegistration] = useState("on-road");
  const [plateColor, setPlateColor] = useState("yellow");
  const [applicationOptions, setApplicationOptions] = useState<{ value: string; label: string }[]>([]);
  const [application, setApplication] = useState("");
  const [segmentasi, setSegmentasi] = useState<string>(SEGMENTASI_OPTIONS[0]?.value ?? "");
  const [provinceOptions] = useState<{ value: string; label: string }[]>(PROVINCE_OPTIONS);
  const [province, setProvince] = useState(PROVINCE_OPTIONS[0]?.value ?? "");
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([]);
  const [city, setCity] = useState("");
  const [operationalRoute, setOperationalRoute] = useState("");
  const [lifecycle, setLifecycle] = useState("5");
  const [kmPerYear, setKmPerYear] = useState("60000");
  const [downPayment, setDownPayment] = useState("0.25");
  const [depreciation, setDepreciation] = useState("0.70");
  // Store insurance and interest rate as percentage strings (e.g. "7" for 7%)
  const [insurance, setInsurance] = useState("7");
  const [interestRate, setInterestRate] = useState("17");
  const [leasePeriod, setLeasePeriod] = useState("5");
  const [monthlyDriverSalary, setMonthlyDriverSalary] = useState("5000000");
  const [gasolinePrice, setGasolinePrice] = useState(DEFAULT_GASOLINE_PRICE.toString());
  const [fuelEfficiency, setFuelEfficiency] = useState(DEFAULT_FUEL_EFFICIENCY.toString());
  const [annualServiceBudget, setAnnualServiceBudget] = useState("5000000");
  const [annualPartBudget, setAnnualPartBudget] = useState("3000000");
  const [annualMaterialBudget, setAnnualMaterialBudget] = useState("2000000");
  const [tireReplacementCost, setTireReplacementCost] = useState("0");
  const [tireReplacementMileage, setTireReplacementMileage] = useState("40000");
  const [serviceDiscountEnabled, setServiceDiscountEnabled] = useState(false);
  const [partDiscountEnabled, setPartDiscountEnabled] = useState(false);
  const [materialDiscountEnabled, setMaterialDiscountEnabled] = useState(false);
  const [serviceDiscount, setServiceDiscount] = useState("");
  const [partDiscount, setPartDiscount] = useState("");
  const [materialDiscount, setMaterialDiscount] = useState("");
  // Default advantages are unchecked (user explicitly opts-in).
  const [extendedWarrantyEnabled, setExtendedWarrantyEnabled] = useState(false);
  const [driverTrainingEnabled, setDriverTrainingEnabled] = useState(false);
  const [santunanEnabled, setSantunanEnabled] = useState(false);
  const [antiRustEnabled, setAntiRustEnabled] = useState(false);
  const [outletEfficiencyEnabled, setOutletEfficiencyEnabled] = useState(false);
  const [outletDowntimeEnabled, setOutletDowntimeEnabled] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [pdfStatusMessage, setPdfStatusMessage] = useState<string | null>(null);
  const [clipboardStatusMessage, setClipboardStatusMessage] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [annualTax, setAnnualTax] = useState<number>(TAX_AMOUNT);
  const [isTaxLoading, setIsTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);

  const isMiningQuarrying = segmentasi === "Mining & Quarrying";

  const extendedWarrantyBenefitAmount = useMemo(() => {
    if (isMiningQuarrying) return 0;
    const series = getProductSeries(productType);
    if (series === "giga") return 83250000;
    if (series === "elf") return 52160000;
    if (series === "traga") return 38800000;
    return 0;
  }, [isMiningQuarrying, productType]);

  // Mining & Quarrying customers are not eligible for Extended Warranty benefits.
  useEffect(() => {
    if (isMiningQuarrying && extendedWarrantyEnabled) {
      setExtendedWarrantyEnabled(false);
    }
  }, [isMiningQuarrying, extendedWarrantyEnabled]);

  useEffect(() => {
    try {
      // When embedded in Salesforce (iframe), window.self !== window.top
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(false);
    }
  }, []);

  // Load application options from Supabase table "application" (column "Row Labels")
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data, error } = await supabaseRestSelectCached<any[]>("application", {
          // Column name in Supabase is literally `Row Labels` (with space, capital R/L)
          // so we must quote it for PostgREST.
          select: "\"Row Labels\"",
          order: "\"Row Labels\".asc",
        });
        if (error || !data) {
          console.error("Failed to load application list", error);
          return;
        }
        const options = (data as any[])
          .map((row) => {
            const label = row["Row Labels"] ?? row.row_labels ?? "";
            return { value: String(label), label: String(label) };
          })
          .filter((o) => o.value.trim() !== "");
        setApplicationOptions(options);
        if (options.length && !application) setApplication(options[0].value);
      } catch (err) {
        console.error("Unexpected error loading application list", err);
      }
    };
    fetchApplications();
  }, []);

  // Province dropdown is hardcoded (see PROVINCE_OPTIONS) to avoid dependency on Supabase for province labels.

  // Load city options based on selected province
  useEffect(() => {
    const fetchCities = async () => {
      try {
        if (!province) {
          setCityOptions([]);
          setCity("");
          return;
        }

        const { data, error } = await supabaseRestSelectCached<any[]>("province_cities", {
          select: "cities",
          province: `eq.${province}`,
          order: "cities.asc",
        });

        if (error || !data) {
          console.error("Failed to load cities list", error);
          setCityOptions([]);
          setCity("");
          return;
        }

        // Deduplicate in case your table contains repeated city names.
        const unique = new Set<string>();
        const options = (data as any[])
          .map((row) => {
            const name = row.cities ?? "";
            const normalized = String(name).trim();
            if (!normalized) return null;
            if (unique.has(normalized)) return null;
            unique.add(normalized);
            return { value: normalized, label: normalized };
          })
          .filter(Boolean) as { value: string; label: string }[];

        setCityOptions(options);
        setCity((prev) => (options.length ? (prev && unique.has(prev) ? prev : options[0].value) : ""));
      } catch (err) {
        console.error("Unexpected error loading cities list", err);
        setCityOptions([]);
        setCity("");
      }
    };

    fetchCities();
  }, [province]);

  // Load annual tax amount from Supabase table "tax"
  // Debounced to avoid timeout when user changes multiple dropdowns quickly.
  // Ensure public.tax has index: CREATE INDEX idx_tax_lookup ON public.tax (application, police_registration, province, cities, type);
  useEffect(() => {
    if (!productType || !application || !province || !city) {
      setAnnualTax(TAX_AMOUNT);
      setTaxError(null);
      return;
    }
    if (registration !== "off-road" && !plateColor) {
      setAnnualTax(TAX_AMOUNT);
      setTaxError(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const fetchTax = async () => {
        setIsTaxLoading(true);
        setTaxError(null);

        const policeRegistration =
          registration === "off-road"
            ? "Off-road"
            : plateColor === "yellow"
            ? "Kuning"
            : plateColor === "white"
            ? "Putih"
            : plateColor;

        try {
          const { data, error } = await supabaseRestSelect<any[]>("tax", {
            select: "tax",
            application: `eq.${application}`,
            police_registration: `eq.${policeRegistration}`,
            province: `eq.${province}`,
            cities: `eq.${city}`,
            type: `eq.${productType}`,
            limit: "1",
          });

          if (error || !data) {
            console.error("Error fetching tax", error);
            setAnnualTax(TAX_AMOUNT);
            setTaxError("Gagal mengambil pajak dari server, menggunakan nilai default.");
          } else if (!data.length) {
            setAnnualTax(TAX_AMOUNT);
            setTaxError("Pajak tidak ditemukan untuk kombinasi ini, menggunakan nilai default.");
          } else {
            const value = Number((data[0] as any)?.tax);
            if (Number.isFinite(value) && value >= 0) {
              setAnnualTax(value);
              setTaxError(null);
            } else {
              setAnnualTax(TAX_AMOUNT);
              setTaxError("Nilai pajak tidak valid, menggunakan nilai default.");
            }
          }
        } catch (err) {
          console.error("Unexpected error fetching tax", err);
          setAnnualTax(TAX_AMOUNT);
          setTaxError("Terjadi kesalahan saat mengambil pajak, menggunakan nilai default.");
        } finally {
          setIsTaxLoading(false);
        }
      };

      fetchTax();
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [productType, application, plateColor, province, city]);

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
        const { data, error } = await supabaseRestSelect<any[]>("pricelist", {
          // match new schema: product_type, cabang, pl_area, pricelist
          select: "pricelist",
          product_type: `eq.${productType}`,
          cabang: `eq.${cabang}`,
          pl_area: `eq.${plArea}`,
          limit: "1",
        });

        if (error || !data) {
          // eslint-disable-next-line no-console
          console.error("Error fetching pricelist", error);
          setPricelist(null);
          setPricelistError("Gagal mengambil pricelist dari server.");
        } else if (!data.length) {
          setPricelist(null);
          setPricelistError("Pricelist tidak ditemukan untuk kombinasi ini.");
        } else {
          const price = Number((data[0] as any)?.pricelist);
          setPricelist(Number.isFinite(price) ? price : null);
          setPricelistError(null);
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
    const rawVehiclePrice = pricelist ?? 0;
    const karoseriValue = karoseri ? parseFloat(karoseri) || 0 : 0;
    const discountValue = discount ? parseFloat(discount) || 0 : 0;
    // Option B: discount applies after karoseri is added to vehicle price.
    const vehiclePrice = Math.max(rawVehiclePrice + karoseriValue - discountValue, 0);
    const dpRate = parseFloat(downPayment);
    const depRate = parseFloat(depreciation);
    const insRate = parseFloat(insurance) / 100 || 0;
    const intRate = parseFloat(interestRate) / 100 || 0;
    const leaseYears = parseInt(leasePeriod);
    const lifecycleYears = parseInt(lifecycle);
    const annualKm = parseInt(kmPerYear);
    const driverSalary = monthlyDriverSalary ? parseFloat(monthlyDriverSalary) : 0;
    const gasPrice = gasolinePrice ? parseFloat(gasolinePrice) : DEFAULT_GASOLINE_PRICE;
    const fuelEff = fuelEfficiency ? parseFloat(fuelEfficiency) : DEFAULT_FUEL_EFFICIENCY;
    const serviceBudget = annualServiceBudget ? parseFloat(annualServiceBudget) : 0;
    const partBudget = annualPartBudget ? parseFloat(annualPartBudget) : 0;
    const materialBudget = annualMaterialBudget ? parseFloat(annualMaterialBudget) : 0;
    const tireCostPerReplacement = tireReplacementCost
      ? parseFloat(tireReplacementCost)
      : 0;
    const tireMileage = tireReplacementMileage ? parseFloat(tireReplacementMileage) : 0;

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

    const totalTax = annualTax * lifecycleYears;
    const totalKm = annualKm * lifecycleYears;

    // Operational costs
    const totalDriverSalary = driverSalary * 12 * lifecycleYears;
    const totalGasolineCostBefore = (totalKm / fuelEff) * gasPrice;
    const totalMaintenanceBudget = annualMaintenanceTotal * lifecycleYears;

    // Tire cost: annual cost based on annual km, then total over lifecycle
    let annualTireCost = 0;
    let totalTireCost = 0;
    if (tireCostPerReplacement > 0 && tireMileage > 0 && annualKm > 0) {
      const replacementsPerYear = annualKm / tireMileage;
      annualTireCost = replacementsPerYear * tireCostPerReplacement;
      totalTireCost = annualTireCost * lifecycleYears;
    }

    const totalMaintenance = totalMaintenanceBudget + totalTireCost;

    // Astra Isuzu advantages - savings (series: F/G = giga, N/Microbus = elf, T/TRAGA = traga)
    let extendedWarrantySaving = 0;
    if (extendedWarrantyEnabled) {
      const series = getProductSeries(productType);
      if (series === "giga") {
        extendedWarrantySaving = 83250000;
      } else if (series === "elf") {
        extendedWarrantySaving = 52160000;
      } else if (series === "traga") {
        extendedWarrantySaving = 38800000;
      }
    }

    const santunanSaving = santunanEnabled ? 20000000 : 0;
    const antiRustSaving = antiRustEnabled ? 3500000 : 0;
    const outletEfficiencySaving = (() => {
      if (!outletEfficiencyEnabled) return 0;
      switch (operationalRoute) {
        case "Pulau Bali & Nusa Tenggara":
          return 4104000;
        case "Pulau Jawa":
          return 67104000;
        case "Pulau Sumatera":
          return 45144000;
        case "Pulau Kalimantan":
          return 18468000;
        case "Pulau Sulawesi":
          return 15192000;
        default:
          return 45144000;
      }
    })();
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
      rawVehiclePrice,
      discountAmount: Math.max(discountValue, 0),
      karoseriAmount: Math.max(karoseriValue, 0),
      downPaymentAmount,
      loanAmount,
      totalInterest,
      totalLoanPayment,
      monthlyPayment,
      residualValue,
      depreciationCost,
      annualInsurance,
      totalInsurance,
      annualTax,
      totalTax,
      totalKm,
      totalMaintenance,
      annualTireCost,
      totalTireCost,
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
    discount,
    karoseri,
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
    tireReplacementCost,
    tireReplacementMileage,
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
    annualTax,
  ]);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div
            className={`relative flex items-center gap-3 ${
              isEmbedded ? "mb-2" : "mb-4"
            }`}
          >
            <img
              src={appLogo}
              alt="TCO Logo"
              className="h-10 w-10 md:h-12 md:w-12 shrink-0 object-contain"
            />
            <div className="flex-1" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="min-w-0 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight truncate">
                  Astra Isuzu TCO
                </h1>
                {!isEmbedded && (
                  <p className="text-muted-foreground text-sm md:text-base leading-snug">
                    Total Cost of Ownership Calculator for Product and Service of Astra Isuzu dealership
                  </p>
                )}
              </div>
            </div>
          </div>
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
                    className="flex items-center gap-3 text-left text-sm transition-transform rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:active:scale-100"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-200 ${
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
                        {(productTypeOptions.length ? productTypeOptions : PRODUCT_TYPES).map(
                          (type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cabang">Cabang</Label>
                    <Select
                      value={cabang}
                      onValueChange={setCabang}
                    >
                      <SelectTrigger id="cabang" className="bg-card">
                        <SelectValue placeholder="Pilih cabang" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {CABANG_OPTIONS.map((c) => (
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
                    >
                      <SelectTrigger id="plArea" className="bg-card">
                        <SelectValue placeholder="Pilih PL Area" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {PL_AREA_OPTIONS.map((option) => (
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
                    <Label htmlFor="karoseri">Harga Karoseri (IDR)</Label>
                    <Input
                      id="karoseri"
                      type="number"
                      placeholder="Masukkan harga karoseri (opsional)"
                      value={karoseri}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setKaroseri(value);
                      }}
                      className="bg-card"
                    />
                    <p className="text-xs text-muted-foreground">
                      Harga karoseri akan ditambahkan ke harga kendaraan sebelum diskon.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Diskon (IDR)</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="Masukkan diskon jika ada"
                      value={discount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setDiscount(value);
                      }}
                      className="bg-card"
                    />
                    <p className="text-xs text-muted-foreground">
                      Diskon akan mengurangi harga kendaraan sebelum perhitungan TCO.
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
                    <Select
                      value={plateColor}
                      onValueChange={setPlateColor}
                      disabled={registration === "off-road"}
                    >
                      <SelectTrigger id="plateColor" className="bg-card" disabled={registration === "off-road"}>
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
                    {registration === "off-road" && (
                      <p className="text-xs text-muted-foreground">
                        Kendaraan off-road tidak memiliki plat nomor (tanpa izin berkendara di jalan umum).
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="application">Aplikasi</Label>
                    <Select
                      value={application}
                      onValueChange={setApplication}
                    >
                      <SelectTrigger id="application" className="bg-card">
                        <SelectValue placeholder={applicationOptions.length === 0 ? "Memuat..." : "Pilih aplikasi"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {applicationOptions.map((app) => (
                          <SelectItem key={app.value} value={app.value}>
                            {app.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segmentasi">Segmentasi</Label>
                    <Select value={segmentasi} onValueChange={setSegmentasi}>
                      <SelectTrigger id="segmentasi" className="bg-card">
                        <SelectValue placeholder="Pilih segmentasi" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {SEGMENTASI_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isMiningQuarrying && (
                      <p className="text-xs text-muted-foreground">
                        Extended Warranty Astra Isuzu tidak tersedia untuk segment ini.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Select
                      value={province}
                      onValueChange={setProvince}
                    >
                      <SelectTrigger id="province" className="bg-card">
                        <SelectValue placeholder={provinceOptions.length === 0 ? "Memuat..." : "Pilih provinsi"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {provinceOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Kota/Kabupaten</Label>
                    <Select
                      value={city}
                      onValueChange={setCity}
                    >
                      <SelectTrigger id="city" className="bg-card">
                        <SelectValue placeholder={cityOptions.length === 0 ? "Memuat..." : "Pilih kota/kabupaten"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {cityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operationalRoute">Rute Operational</Label>
                    <Select
                      value={operationalRoute}
                      onValueChange={setOperationalRoute}
                    >
                      <SelectTrigger id="operationalRoute" className="bg-card">
                        <SelectValue placeholder="Pilih rute operasional" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {RUTE_OPERATIONAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                    </p>
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
                      <Label htmlFor="tireReplacementCost">Penggantian Ban (IDR per sekali ganti)</Label>
                      <Input
                        id="tireReplacementCost"
                        type="number"
                        placeholder="Contoh: 5.000.000"
                        value={tireReplacementCost}
                        onChange={(e) => setTireReplacementCost(e.target.value)}
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tireReplacementMileage">
                        Mileage Penggantian Ban (km per sekali ganti)
                      </Label>
                      <Input
                        id="tireReplacementMileage"
                        type="number"
                        placeholder="Contoh: 40.000"
                        value={tireReplacementMileage}
                        onChange={(e) => setTireReplacementMileage(e.target.value)}
                        className="bg-card"
                      />
                      <p className="text-xs text-muted-foreground">
                        Jarak tempuh standar sebelum 1 kali penggantian ban.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="annualServiceBudget">Service Spending (IDR/year)</Label>
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
                      <Label htmlFor="annualPartBudget">Part Spending (IDR/year)</Label>
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
                      <Label htmlFor="annualMaterialBudget">Material Spending (IDR/year)</Label>
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
                      <Label htmlFor="insurance">Rate Asuransi (%)</Label>
                      <Input
                        id="insurance"
                        type="number"
                        placeholder="Contoh: 7"
                        value={insurance}
                        onChange={(e) => setInsurance(e.target.value)}
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Suku Bunga (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        placeholder="Contoh: 17"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="bg-card"
                      />
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
                        value={formatCurrency(annualTax)}
                        disabled
                        className="bg-muted"
                      />
                      {isTaxLoading && (
                        <p className="text-xs text-muted-foreground">Memuat pajak...</p>
                      )}
                      {taxError && !isTaxLoading && (
                        <p className="text-xs text-red-500">{taxError}</p>
                      )}
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
                        disabled={isMiningQuarrying}
                        onCheckedChange={(checked) => {
                          if (isMiningQuarrying) return;
                          setExtendedWarrantyEnabled(checked === true);
                        }}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="extendedWarrantyEnabled" className="font-medium">
                          Extended Warranty Astra Isuzu
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mengurangi biaya perawatan tambahan sesuai tipe unit (GIGA, ELF, TRAGA).
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Benefit:{" "}
                          {isMiningQuarrying
                            ? "N/A"
                            : extendedWarrantyBenefitAmount > 0
                              ? formatCurrency(extendedWarrantyBenefitAmount)
                              : "Pilih tipe unit terlebih dahulu"}
                        </p>
                        {isMiningQuarrying && (
                          <p className="text-xs text-red-500">Tidak tersedia untuk Mining & Quarrying.</p>
                        )}
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
                          Mengurangi biaya operasional berkat outlet yang lebih dekat{" "}
                          {outletEfficiencyEnabled && operationalRoute
                            ? `(hemat sekitar Rp ${formatNumberId(
                                (() => {
                                  switch (operationalRoute) {
                                    case "Pulau Bali & Nusa Tenggara":
                                      return 4104000;
                                    case "Pulau Jawa":
                                      return 67104000;
                                    case "Pulau Sumatera":
                                      return 45144000;
                                    case "Pulau Kalimantan":
                                      return 18468000;
                                    case "Pulau Sulawesi":
                                      return 15192000;
                                    default:
                                      return 45144000;
                                  }
                                })()
                              )} sepanjang lifecycle)`
                            : "(hemat biaya operasional sepanjang lifecycle)"}
                          .
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
                          segmentasi,
                          province,
                          city,
                          operationalRoute,
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
                        {formatCurrency(calculations.rawVehiclePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harga Karoseri</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.karoseriAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.discountAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vehicle Price After Discount</span>
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
                      <span>Total Insurance</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.totalInsurance)}
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
                    {calculations.totalTireCost > 0 && (
                      <div className="flex justify-between">
                        <span>Penggantian Ban</span>
                        <span className="font-medium">
                          {formatCurrency(calculations.totalTireCost)}
                        </span>
                      </div>
                    )}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCOCalculator;
