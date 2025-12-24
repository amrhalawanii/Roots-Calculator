"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingDown, Download, Mail, ArrowRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getAssumptions } from "@/lib/assumptions"
import jsPDF from "jspdf"

interface MerchantInput {
  warehouseSize: number
  ordersPerMonth: number
  averageItemsPerOrder: number
}

interface CalculatorResultsProps {
  input: MerchantInput
  showResults: boolean
}

type PackageType = "fulfillment" | "store-pack" | "sort-pack"
type ServiceType = "storage" | "handlingIn" | "handlingOut" | "delivery"

const PACKAGE_SERVICES: Record<
  PackageType,
  {
    label: string
    description: string
    services: readonly ServiceType[]
  }
> = {
  fulfillment: {
    label: "Fulfillment Package",
    description: "Complete end-to-end service",
    services: ["storage", "handlingIn", "handlingOut", "delivery"] as const,
  },
  "store-pack": {
    label: "Store & Pack Package",
    description: "Storage and packaging services",
    services: ["storage", "handlingIn", "handlingOut"] as const,
  },
  "sort-pack": {
    label: "Sort & Pack Package",
    description: "Sorting, packaging and delivery",
    services: ["handlingIn", "handlingOut", "delivery"] as const,
  },
}

function calculateSavings(input: MerchantInput, packageType: PackageType) {
  const { warehouseSize, ordersPerMonth, averageItemsPerOrder } = input
  const packageConfig = PACKAGE_SERVICES[packageType]
  const assumptions = getAssumptions()

  // Volume metrics
  const totalItems = ordersPerMonth * averageItemsPerOrder

  // Initialize all service costs
  let merchantStorage = 0
  let merchantHandlingIn = 0
  let merchantHandlingOut = 0
  let merchantDelivery = 0
  let rootsStorage = 0
  let rootsHandlingIn = 0
  let rootsHandlingOut = 0
  let rootsDelivery = 0

  if (packageConfig.services.includes("storage")) {
    merchantStorage = warehouseSize * assumptions.storage.costPerSqm * assumptions.storage.merchantOverheadMultiplier
    rootsStorage = warehouseSize * assumptions.storage.costPerSqm
  }

  if (packageConfig.services.includes("handlingIn")) {
    const merchantHandlingInTime = totalItems * assumptions.handlingIn.merchantTimePerItem
    merchantHandlingIn = merchantHandlingInTime * assumptions.handlingIn.laborCostPerMinute
    const rootsHandlingInTime = totalItems * assumptions.handlingIn.rootsTimePerItem
    rootsHandlingIn = rootsHandlingInTime * assumptions.handlingIn.laborCostPerMinute * assumptions.handlingIn.rootsEfficiencyMultiplier
  }

  if (packageConfig.services.includes("handlingOut")) {
    const merchantHandlingOutTime = ordersPerMonth * assumptions.handlingOut.merchantTimePerOrder
    merchantHandlingOut = merchantHandlingOutTime * assumptions.handlingOut.laborCostPerMinute
    const rootsHandlingOutTime = ordersPerMonth * assumptions.handlingOut.rootsTimePerOrder
    rootsHandlingOut = rootsHandlingOutTime * assumptions.handlingOut.laborCostPerMinute * assumptions.handlingOut.rootsEfficiencyMultiplier
  }

  if (packageConfig.services.includes("delivery")) {
    // Merchant: Orders Per Month * delivery_amman_24hrs_merchant
    merchantDelivery = ordersPerMonth * assumptions.delivery.deliveryAmman24hrsMerchant
    // Roots: Orders Per Month * delivery_amman_24hrs_roots
    rootsDelivery = ordersPerMonth * assumptions.delivery.deliveryAmman24hrsRoots
  }

  const merchantOverhead = (merchantStorage + merchantHandlingIn + merchantHandlingOut + merchantDelivery) * assumptions.overhead.merchantOverheadRate
  const merchantTotal = merchantStorage + merchantHandlingIn + merchantHandlingOut + merchantDelivery + merchantOverhead

  const rootsOverhead = assumptions.overhead.rootsOverhead
  const rootsTotal = rootsStorage + rootsHandlingIn + rootsHandlingOut + rootsDelivery + rootsOverhead

  const monthlySavings = merchantTotal - rootsTotal
  const yearlySavings = monthlySavings * 12
  const savingsPercentage = merchantTotal > 0 ? (monthlySavings / merchantTotal) * 100 : 0

  return {
    merchantCost: {
      storage: merchantStorage,
      handlingIn: merchantHandlingIn,
      handlingOut: merchantHandlingOut,
      delivery: merchantDelivery,
      overhead: merchantOverhead,
      total: merchantTotal,
    },
    rootsCost: {
      storage: rootsStorage,
      handlingIn: rootsHandlingIn,
      handlingOut: rootsHandlingOut,
      delivery: rootsDelivery,
      overhead: rootsOverhead,
      total: rootsTotal,
    },
    savings: {
      monthly: monthlySavings,
      yearly: yearlySavings,
      percentage: savingsPercentage,
    },
    packageConfig,
  }
}

function generateReport(input: MerchantInput, packageType: PackageType, results: ReturnType<typeof calculateSavings>) {
  const packageConfig = PACKAGE_SERVICES[packageType]
  const date = new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })

  let report = `ROOTS FULFILLMENT SAVINGS CALCULATOR REPORT
Generated: ${date}

═══════════════════════════════════════════════════════════

BUSINESS INPUTS
───────────────────────────────────────────────────────────
Warehouse Size:           ${input.warehouseSize.toLocaleString()} sqm
Orders per Month:         ${input.ordersPerMonth.toLocaleString()}
Average Items per Order:  ${input.averageItemsPerOrder.toFixed(1)}
Package Selected:         ${packageConfig.label}

═══════════════════════════════════════════════════════════

COST BREAKDOWN
───────────────────────────────────────────────────────────
`

  if (results.packageConfig.services.includes("storage")) {
    const savings = results.merchantCost.storage - results.rootsCost.storage
    const savingsPct = results.merchantCost.storage > 0 
      ? ((savings / results.merchantCost.storage) * 100).toFixed(1) 
      : "0.0"
    report += `Storage:
  Your Cost:     $${results.merchantCost.storage.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Roots Cost:     $${results.rootsCost.storage.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Savings:        $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)

`
  }

  if (results.packageConfig.services.includes("handlingIn")) {
    const savings = results.merchantCost.handlingIn - results.rootsCost.handlingIn
    const savingsPct = results.merchantCost.handlingIn > 0 
      ? ((savings / results.merchantCost.handlingIn) * 100).toFixed(1) 
      : "0.0"
    report += `Handling In:
  Your Cost:     $${results.merchantCost.handlingIn.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Roots Cost:     $${results.rootsCost.handlingIn.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Savings:        $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)

`
  }

  if (results.packageConfig.services.includes("handlingOut")) {
    const savings = results.merchantCost.handlingOut - results.rootsCost.handlingOut
    const savingsPct = results.merchantCost.handlingOut > 0 
      ? ((savings / results.merchantCost.handlingOut) * 100).toFixed(1) 
      : "0.0"
    report += `Handling Out:
  Your Cost:     $${results.merchantCost.handlingOut.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Roots Cost:     $${results.rootsCost.handlingOut.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Savings:        $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)

`
  }

  if (results.packageConfig.services.includes("delivery")) {
    const savings = results.merchantCost.delivery - results.rootsCost.delivery
    const savingsPct = results.merchantCost.delivery > 0 
      ? ((savings / results.merchantCost.delivery) * 100).toFixed(1) 
      : "0.0"
    report += `Delivery:
  Your Cost:     $${results.merchantCost.delivery.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Roots Cost:     $${results.rootsCost.delivery.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Savings:        $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)

`
  }

  report += `Overhead:
  Your Cost:     $${results.merchantCost.overhead.toLocaleString("en-US", { maximumFractionDigits: 2 })}
  Roots Cost:    $${results.rootsCost.overhead.toLocaleString("en-US", { maximumFractionDigits: 2 })}

═══════════════════════════════════════════════════════════

TOTAL COSTS
───────────────────────────────────────────────────────────
Your Total Monthly Cost:  $${results.merchantCost.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}
Roots Total Monthly Cost: $${results.rootsCost.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}

═══════════════════════════════════════════════════════════

SAVINGS SUMMARY
───────────────────────────────────────────────────────────
Monthly Savings:          $${results.savings.monthly.toLocaleString("en-US", { maximumFractionDigits: 2 })}
Yearly Savings:            $${results.savings.yearly.toLocaleString("en-US", { maximumFractionDigits: 2 })}
Savings Percentage:        ${results.savings.percentage.toFixed(1)}%

═══════════════════════════════════════════════════════════

For more information, visit: https://roots-jo.co/
Contact us: https://roots-jo.co/#contact

`

  return report
}

function downloadReport(input: MerchantInput, packageType: PackageType, results: ReturnType<typeof calculateSavings>) {
  const packageConfig = PACKAGE_SERVICES[packageType]
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20
  const margin = 20
  const lineHeight = 7
  const sectionSpacing = 10

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", isBold ? "bold" : "normal")
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - x)
    doc.text(lines, x, y)
    return lines.length * lineHeight
  }

  // Title
  yPosition += addText("ROOTS FULFILLMENT SAVINGS CALCULATOR REPORT", margin, yPosition, 16, true)
  yPosition += 5
  yPosition += addText(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, yPosition, 10)
  yPosition += sectionSpacing

  // Business Inputs
  yPosition += addText("BUSINESS INPUTS", margin, yPosition, 12, true)
  yPosition += 5
  yPosition += addText(`Warehouse Size: ${input.warehouseSize.toLocaleString()} sqm`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`Orders per Month: ${input.ordersPerMonth.toLocaleString()}`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`Average Items per Order: ${input.averageItemsPerOrder.toFixed(1)}`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`Package Selected: ${packageConfig.label}`, margin, yPosition, 10)
  yPosition += sectionSpacing

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  }

  // Cost Breakdown
  yPosition += addText("COST BREAKDOWN", margin, yPosition, 12, true)
  yPosition += 5

  if (results.packageConfig.services.includes("storage")) {
    const savings = results.merchantCost.storage - results.rootsCost.storage
    const savingsPct = results.merchantCost.storage > 0 
      ? ((savings / results.merchantCost.storage) * 100).toFixed(1) 
      : "0.0"
    yPosition += addText("Storage:", margin, yPosition, 10, true)
    yPosition += lineHeight
    yPosition += addText(`  Your Cost: $${results.merchantCost.storage.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Roots Cost: $${results.rootsCost.storage.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Savings: $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)`, margin, yPosition, 10)
    yPosition += 3
  }

  if (results.packageConfig.services.includes("handlingIn")) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }
    const savings = results.merchantCost.handlingIn - results.rootsCost.handlingIn
    const savingsPct = results.merchantCost.handlingIn > 0 
      ? ((savings / results.merchantCost.handlingIn) * 100).toFixed(1) 
      : "0.0"
    yPosition += addText("Handling In:", margin, yPosition, 10, true)
    yPosition += lineHeight
    yPosition += addText(`  Your Cost: $${results.merchantCost.handlingIn.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Roots Cost: $${results.rootsCost.handlingIn.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Savings: $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)`, margin, yPosition, 10)
    yPosition += 3
  }

  if (results.packageConfig.services.includes("handlingOut")) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }
    const savings = results.merchantCost.handlingOut - results.rootsCost.handlingOut
    const savingsPct = results.merchantCost.handlingOut > 0 
      ? ((savings / results.merchantCost.handlingOut) * 100).toFixed(1) 
      : "0.0"
    yPosition += addText("Handling Out:", margin, yPosition, 10, true)
    yPosition += lineHeight
    yPosition += addText(`  Your Cost: $${results.merchantCost.handlingOut.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Roots Cost: $${results.rootsCost.handlingOut.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Savings: $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)`, margin, yPosition, 10)
    yPosition += 3
  }

  if (results.packageConfig.services.includes("delivery")) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }
    const savings = results.merchantCost.delivery - results.rootsCost.delivery
    const savingsPct = results.merchantCost.delivery > 0 
      ? ((savings / results.merchantCost.delivery) * 100).toFixed(1) 
      : "0.0"
    yPosition += addText("Delivery:", margin, yPosition, 10, true)
    yPosition += lineHeight
    yPosition += addText(`  Your Cost: $${results.merchantCost.delivery.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Roots Cost: $${results.rootsCost.delivery.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
    yPosition += lineHeight
    yPosition += addText(`  Savings: $${savings.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${savingsPct}%)`, margin, yPosition, 10)
    yPosition += 3
  }

  if (yPosition > pageHeight - 50) {
    doc.addPage()
    yPosition = 20
  }

  yPosition += addText("Overhead:", margin, yPosition, 10, true)
  yPosition += lineHeight
  yPosition += addText(`  Your Cost: $${results.merchantCost.overhead.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`  Roots Cost: $${results.rootsCost.overhead.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
  yPosition += sectionSpacing

  // Total Costs
  if (yPosition > pageHeight - 50) {
    doc.addPage()
    yPosition = 20
  }
  yPosition += addText("TOTAL COSTS", margin, yPosition, 12, true)
  yPosition += 5
  yPosition += addText(`Your Total Monthly Cost: $${results.merchantCost.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`Roots Total Monthly Cost: $${results.rootsCost.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
  yPosition += sectionSpacing

  // Savings Summary
  if (yPosition > pageHeight - 50) {
    doc.addPage()
    yPosition = 20
  }
  yPosition += addText("SAVINGS SUMMARY", margin, yPosition, 12, true)
  yPosition += 5
  yPosition += addText(`Monthly Savings: $${results.savings.monthly.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`Yearly Savings: $${results.savings.yearly.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText(`Savings Percentage: ${results.savings.percentage.toFixed(1)}%`, margin, yPosition, 10)
  yPosition += sectionSpacing

  // Footer
  if (yPosition > pageHeight - 40) {
    doc.addPage()
    yPosition = 20
  }
  yPosition += addText("For more information, visit: https://roots-jo.co/", margin, yPosition, 10)
  yPosition += lineHeight
  yPosition += addText("Contact us: https://roots-jo.co/#contact", margin, yPosition, 10)

  // Save PDF
  doc.save(`roots-savings-report-${new Date().toISOString().split("T")[0]}.pdf`)
}

function ServiceBreakdown({ packageType, input }: { packageType: PackageType; input: MerchantInput }) {
  const results = calculateSavings(input, packageType)

  const chartData = []
  if (results.packageConfig.services.includes("storage")) {
    chartData.push({
      name: "Storage",
      "Your Cost": results.merchantCost.storage,
      "Roots Cost": results.rootsCost.storage,
    })
  }
  if (results.packageConfig.services.includes("handlingIn")) {
    chartData.push({
      name: "Handling In",
      "Your Cost": results.merchantCost.handlingIn,
      "Roots Cost": results.rootsCost.handlingIn,
    })
  }
  if (results.packageConfig.services.includes("handlingOut")) {
    chartData.push({
      name: "Handling Out",
      "Your Cost": results.merchantCost.handlingOut,
      "Roots Cost": results.rootsCost.handlingOut,
    })
  }
  if (results.packageConfig.services.includes("delivery")) {
    chartData.push({
      name: "Delivery",
      "Your Cost": results.merchantCost.delivery,
      "Roots Cost": results.rootsCost.delivery,
    })
  }

  return (
    <div className="space-y-6">
      {/* Savings Highlights */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1">Monthly Savings</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-500">
            ${results.savings.monthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {results.savings.percentage.toFixed(1)}% less than in-house
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="text-sm font-medium text-muted-foreground mb-1">Yearly Savings</div>
          <div className="text-3xl font-bold text-primary">
            ${results.savings.yearly.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {results.savings.percentage.toFixed(1)}% less than in-house • Over 12 months
          </div>
        </div>
      </div>

      {/* Cost Comparison Chart */}
      <div>
        <h3 className="font-semibold mb-4">Cost Breakdown Comparison</h3>
        <div className="h-[300px] w-full text-card-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="Your Cost" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Roots Cost" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold text-sm">Detailed Cost Analysis</h3>
        {chartData.map((item) => {
          const yourCost = item["Your Cost"]
          const rootsCost = item["Roots Cost"]
          const savings = yourCost - rootsCost
          const savingsPercentage = yourCost > 0 ? (savings / yourCost) * 100 : 0

          return (
            <div key={item.name} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.name}:</span>
              <div className="flex items-center gap-3">
                <span className="line-through text-muted-foreground">
                  ${yourCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-600 dark:text-green-500">
                    ${rootsCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded">
                    -{savingsPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="grid sm:grid-cols-2 gap-3 pt-4">
        <Button 
          variant="outline" 
          className="w-full bg-transparent"
          onClick={() => downloadReport(input, packageType, results)}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <Button 
          className="w-full"
          onClick={() => window.open("https://roots-jo.co/#contact", "_blank")}
        >
          <Mail className="h-4 w-4 mr-2" />
          Contact Sales
        </Button>
      </div>
    </div>
  )
}

export function CalculatorResults({ input, showResults }: CalculatorResultsProps) {
  const [activePackage, setActivePackage] = useState<PackageType>("fulfillment")

  if (!showResults) {
    return (
      <Card className="p-8 lg:p-12 flex flex-col items-center justify-center text-center min-h-[500px] bg-muted/30">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <TrendingDown className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Your Savings Await</h3>
          <p className="text-muted-foreground">
            Enter your business details on the left and click "Calculate Savings" to see how much you could save with
            Roots
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-green-600" />
          Your Potential Savings
        </h2>
        <p className="text-sm text-muted-foreground">Compare packages to find the best fit for your needs</p>
      </div>

      <Tabs value={activePackage} onValueChange={(value) => setActivePackage(value as PackageType)}>
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="fulfillment" className="text-xs sm:text-sm">
            Fulfillment
          </TabsTrigger>
          <TabsTrigger value="store-pack" className="text-xs sm:text-sm">
            Store & Pack
          </TabsTrigger>
          <TabsTrigger value="sort-pack" className="text-xs sm:text-sm">
            Sort & Pack
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fulfillment">
          <ServiceBreakdown packageType="fulfillment" input={input} />
        </TabsContent>

        <TabsContent value="store-pack">
          <ServiceBreakdown packageType="store-pack" input={input} />
        </TabsContent>

        <TabsContent value="sort-pack">
          <ServiceBreakdown packageType="sort-pack" input={input} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
