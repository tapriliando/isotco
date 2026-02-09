import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Calculator, Truck, FileText, DollarSign, Sparkles, Fuel, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  { value: "elf", label: "ELF Type", basePrice: 350000000 },
  { value: "traga", label: "TRAGA Type", basePrice: 450000000 },
  { value: "giga", label: "GIGA Type", basePrice: 750000000 },
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
];

const KM_PER_YEAR_OPTIONS = [
  { value: "60000", label: "60,000 km" },
  { value: "70000", label: "70,000 km" },
  { value: "80000", label: "80,000 km" },
];

const DOWN_PAYMENT_OPTIONS = [
  { value: "0.25", label: "25%" },
  { value: "0.30", label: "30%" },
  { value: "0.50", label: "50%" },
];

const DEPRECIATION_OPTIONS = [
  { value: "0.70", label: "70%" },
  { value: "0.65", label: "65%" },
  { value: "0.60", label: "60%" },
];

const INSURANCE_OPTIONS = [
  { value: "0.07", label: "7%" },
  { value: "0.055", label: "5.5%" },
  { value: "0.05", label: "5%" },
];

const INTEREST_RATE_OPTIONS = [
  { value: "0.17", label: "17%" },
  { value: "0.19", label: "19%" },
  { value: "0.21", label: "21%" },
];

const LEASE_PERIOD_OPTIONS = [
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
  const dailyRevenue = 1000000;
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
  totalCostOfOwnership: number;
  costPerKm: number;
  costPerYear: number;
  costPerMonth: number;
  lifecycleYears: number;
};

type PDFData = {
  // Inputs
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
  customPrice: string;
  monthlyDriverSalary: string;
  gasolinePrice: string;
  fuelEfficiency: string;
  annualMaintenanceBudget: string;
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
  doc.text("Vehicle Configuration", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const vehicleConfig = [
    ["Product Type", PRODUCT_TYPES.find((p) => p.value === data.productType)?.label || data.productType],
    ["Vehicle Price", formatCurrency(data.calculations.vehiclePrice)],
    ["Registration", REGISTRATION_TYPES.find((r) => r.value === data.registration)?.label || data.registration],
    ["Plate Color", PLATE_COLORS.find((p) => p.value === data.plateColor)?.label || data.plateColor],
    ["Application", APPLICATIONS.find((a) => a.value === data.application)?.label || data.application],
    ["Lifecycle", `${data.lifecycle} Years`],
    ["Kilometers per Year", `${parseInt(data.kmPerYear).toLocaleString("id-ID")} km`],
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
    ["Depreciation", `${(parseFloat(data.depreciation) * 100).toFixed(0)}%`],
    ["Insurance Rate", `${(parseFloat(data.insurance) * 100).toFixed(2)}%`],
    ["Interest Rate", `${(parseFloat(data.interestRate) * 100).toFixed(0)}%`],
    ["Lease Period", `${data.leasePeriod} Years`],
    ["Annual Tax", formatCurrency(TAX_AMOUNT)],
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
    ["Monthly Driver Salary", data.monthlyDriverSalary ? formatCurrency(parseFloat(data.monthlyDriverSalary)) : "Not set"],
    ["Gasoline Price", formatCurrency(parseFloat(data.gasolinePrice)) + "/liter"],
    ["Fuel Efficiency", `${data.fuelEfficiency} km/liter`],
    ["Annual Maintenance Budget", formatCurrency(parseFloat(data.annualMaintenanceBudget))],
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
  doc.text(formatCurrency(data.calculations.totalCostOfOwnership), margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryData = [
    ["Cost per Year", formatCurrency(data.calculations.costPerYear)],
    ["Cost per Month", formatCurrency(data.calculations.costPerMonth)],
    ["Cost per Kilometer", formatCurrency(data.calculations.costPerKm)],
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
  const [customPrice, setCustomPrice] = useState("");
  const [monthlyDriverSalary, setMonthlyDriverSalary] = useState("");
  const [gasolinePrice, setGasolinePrice] = useState(DEFAULT_GASOLINE_PRICE.toString());
  const [fuelEfficiency, setFuelEfficiency] = useState(DEFAULT_FUEL_EFFICIENCY.toString());
  const [annualMaintenanceBudget, setAnnualMaintenanceBudget] = useState("10000000");

  const calculations = useMemo(() => {
    const selectedProduct = PRODUCT_TYPES.find((p) => p.value === productType);
    const vehiclePrice = customPrice ? parseFloat(customPrice) : (selectedProduct?.basePrice || 0);
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
    const maintBudget = annualMaintenanceBudget ? parseFloat(annualMaintenanceBudget) : 0;

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

    // Estimated maintenance cost (varies by product type)
    const maintenanceCostPerKm = productType === "giga" ? 1500 : productType === "traga" ? 1200 : 1000;
    const maintenanceFromKm = totalKm * maintenanceCostPerKm;
    
    // Operational costs
    const totalDriverSalary = driverSalary * 12 * lifecycleYears;
    const totalGasolineCost = (totalKm / fuelEff) * gasPrice;
    const totalMaintenanceBudget = maintBudget * lifecycleYears;
    
    // Use the higher of maintenance from km or maintenance budget
    const totalMaintenance = Math.max(maintenanceFromKm, totalMaintenanceBudget);

    // Total Cost of Ownership
    const totalCostOfOwnership =
      downPaymentAmount +
      totalLoanPayment +
      totalInsurance +
      totalTax +
      totalMaintenance +
      totalDriverSalary +
      totalGasolineCost;

    const costPerKm = totalKm > 0 ? totalCostOfOwnership / totalKm : 0;
    const costPerYear = lifecycleYears > 0 ? totalCostOfOwnership / lifecycleYears : 0;
    const costPerMonth = costPerYear / 12;

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
      totalCostOfOwnership,
      costPerKm,
      costPerYear,
      costPerMonth,
      lifecycleYears,
    };
  }, [
    productType,
    downPayment,
    depreciation,
    insurance,
    interestRate,
    leasePeriod,
    lifecycle,
    kmPerYear,
    customPrice,
    monthlyDriverSalary,
    gasolinePrice,
    fuelEfficiency,
    annualMaintenanceBudget,
  ]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center gap-4 mb-4">
            <img src={astraLogo} alt="Astra Isuzu Logo" className="h-16 md:h-20 w-auto" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Astra Isuzu TCO Calculator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Total Cost of Ownership Calculator for Product and Service of Astra Isuzu dealership
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Configuration */}
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5" />
                  Vehicle Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
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
                  <Label htmlFor="customPrice">Vehicle Price (IDR)</Label>
                  <Input
                    id="customPrice"
                    type="number"
                    placeholder={`Default: ${formatCurrency(PRODUCT_TYPES.find(p => p.value === productType)?.basePrice || 0)}`}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration">Police Registration</Label>
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
                  <Label htmlFor="plateColor">Plate Number Colour</Label>
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
                  <Label htmlFor="application">Application</Label>
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
                  <Label htmlFor="lifecycle">Operational Lifecycle</Label>
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
                  <Label htmlFor="kmPerYear">Kilometers per Year</Label>
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
                  <Label htmlFor="monthlyDriverSalary">Monthly Driver Salary (IDR)</Label>
                  <Input
                    id="monthlyDriverSalary"
                    type="number"
                    placeholder="e.g., 5000000"
                    value={monthlyDriverSalary}
                    onChange={(e) => setMonthlyDriverSalary(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gasolinePrice">Gasoline Price (IDR/liter)</Label>
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
                  <Label htmlFor="fuelEfficiency">Fuel Efficiency (km/liter)</Label>
                  <Input
                    id="fuelEfficiency"
                    type="number"
                    placeholder={`Default: ${DEFAULT_FUEL_EFFICIENCY}`}
                    value={fuelEfficiency}
                    onChange={(e) => setFuelEfficiency(e.target.value)}
                    className="bg-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualMaintenanceBudget">Maintenance Budget (IDR/year)</Label>
                  <Input
                    id="annualMaintenanceBudget"
                    type="number"
                    placeholder="e.g., 10000000"
                    value={annualMaintenanceBudget}
                    onChange={(e) => setAnnualMaintenanceBudget(e.target.value)}
                    className="bg-card"
                  />
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
                  <Label htmlFor="depreciation">Depreciation</Label>
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
                  <Label htmlFor="insurance">Insurance Rate</Label>
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
                  <Label htmlFor="interestRate">Interest Rate</Label>
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
                  <Label htmlFor="leasePeriod">Lease Period</Label>
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
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* TCO Summary */}
            <Card className="shadow-lg bg-primary text-primary-foreground">
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
                </div>
                <div className="mt-4 pt-4 border-t border-primary-foreground/20">
                  <Button
                    onClick={() => {
                      generatePDFReport({
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
                        customPrice,
                        monthlyDriverSalary,
                        gasolinePrice,
                        fuelEfficiency,
                        annualMaintenanceBudget,
                        calculations,
                      });
                    }}
                    className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {generateMockAISummary({
                  costPerMonth: calculations.costPerMonth,
                  totalDriverSalary: calculations.totalDriverSalary,
                  totalGasolineCost: calculations.totalGasolineCost,
                  totalMaintenance: calculations.totalMaintenance,
                  costPerYear: calculations.costPerYear,
                  totalKm: calculations.totalKm,
                  lifecycleYears: calculations.lifecycleYears,
                })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCOCalculator;
