"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CalculatorResults } from "@/components/calculator-results"
import { Package, CableIcon as CalcIcon } from "lucide-react"

interface MerchantInput {
  warehouseSize: number
  ordersPerMonth: number
  averageItemsPerOrder: number
}

export function Calculator() {
  const [input, setInput] = useState<MerchantInput>({
    warehouseSize: 0,
    ordersPerMonth: 0,
    averageItemsPerOrder: 0,
  })
  const [showResults, setShowResults] = useState(false)

  const handleCalculate = () => {
    if (input.warehouseSize > 0 && input.ordersPerMonth > 0 && input.averageItemsPerOrder > 0) {
      setShowResults(true)
    }
  }

  const handleInputChange = (field: keyof MerchantInput, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setInput((prev) => ({ ...prev, [field]: numValue }))
    setShowResults(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-balance">{"Roots Fulfillment Savings Calculator\n"}</h1>
        </div>
        <p className="text-lg text-muted-foreground text-balance">
          {"Calculate your potential savings by optimizing your warehouse operations. Enter your details below to see how much you could save with Roots.\n\n"}
        </p>
      </div>

      {/* Main Calculator Layout */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
        {/* Left Panel - Inputs */}
        <Card className="p-6 lg:p-8 space-y-6 h-fit">
          <div>
            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <CalcIcon className="h-6 w-6 text-primary" />
              Calculate Your Savings
            </h2>
            <p className="text-sm text-muted-foreground">{"Add your warehouse details below to calculate potential savings from optimized fulfillment operations."}</p>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-size" className="text-base">
                Warehouse Size (sqm)
              </Label>
              <Input
                id="warehouse-size"
                type="number"
                placeholder="e.g., 500"
                min="0"
                value={input.warehouseSize || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("warehouseSize", e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orders-per-month" className="text-base">
                Orders per Month
              </Label>
              <Input
                id="orders-per-month"
                type="number"
                placeholder="e.g., 1000"
                min="0"
                value={input.ordersPerMonth || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("ordersPerMonth", e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="items-per-order" className="text-base">
                Average Items per Order
              </Label>
              <Input
                id="items-per-order"
                type="number"
                placeholder="e.g., 2"
                min="0"
                step="0.1"
                value={input.averageItemsPerOrder || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("averageItemsPerOrder", e.target.value)}
                className="text-lg"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <Button onClick={handleCalculate} size="lg" className="w-full text-lg font-semibold">
            Calculate Savings
          </Button>
        </Card>

        {/* Right Panel - Results */}
        <div className="lg:sticky lg:top-8 h-fit">
          <CalculatorResults input={input} showResults={showResults} />
        </div>
      </div>
    </div>
  )
}

