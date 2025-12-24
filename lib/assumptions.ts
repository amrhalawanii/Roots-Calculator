/**
 * Fulfillment Calculator Assumptions
 * 
 * This file contains all operational assumptions used in the savings calculator.
 * These values can be updated by admins without modifying the calculation logic.
 */

export interface Assumptions {
  storage: StorageAssumptions
  handlingIn: HandlingInAssumptions
  handlingOut: HandlingOutAssumptions
  delivery: DeliveryAssumptions
  overhead: OverheadAssumptions
}

export interface StorageAssumptions {
  /** Base storage cost per square meter per month (in USD) */
  costPerSqm: number
  /** Merchant overhead multiplier for storage (e.g., 1.25 = 25% overhead) */
  merchantOverheadMultiplier: number
}

export interface HandlingInAssumptions {
  /** Labor cost per minute (in USD) */
  laborCostPerMinute: number
  /** Merchant time to handle in one item (in minutes) */
  merchantTimePerItem: number
  /** Roots time to handle in one item (in minutes) - more efficient */
  rootsTimePerItem: number
  /** Roots efficiency multiplier (e.g., 0.85 = 15% cost reduction) */
  rootsEfficiencyMultiplier: number
}

export interface HandlingOutAssumptions {
  /** Labor cost per minute (in USD) */
  laborCostPerMinute: number
  /** Merchant time to handle out one order (in minutes) */
  merchantTimePerOrder: number
  /** Roots time to handle out one order (in minutes) - more efficient */
  rootsTimePerOrder: number
  /** Roots efficiency multiplier (e.g., 0.85 = 15% cost reduction) */
  rootsEfficiencyMultiplier: number
}

export interface DeliveryAssumptions {
  /** Delivery cost per order for merchant - Amman 24hrs (in USD) */
  deliveryAmman24hrsMerchant: number
  /** Delivery cost per order for Roots - Amman 24hrs (in USD) */
  deliveryAmman24hrsRoots: number
}

export interface OverheadAssumptions {
  /** Merchant overhead rate as percentage of subtotal (e.g., 0.2 = 20%) */
  merchantOverheadRate: number
  /** Roots overhead (typically 0 as overhead is built into pricing) */
  rootsOverhead: number
}

/**
 * Default assumptions configuration
 * These values are used in the calculator calculations
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  storage: {
    costPerSqm: 12,
    merchantOverheadMultiplier: 1.25, // 25% overhead
  },
  handlingIn: {
    laborCostPerMinute: 0.5,
    merchantTimePerItem: 2, // 2 minutes per item
    rootsTimePerItem: 1, // 1 minute per item (more efficient)
    rootsEfficiencyMultiplier: 0.85, // 15% cost reduction
  },
  handlingOut: {
    laborCostPerMinute: 0.5,
    merchantTimePerOrder: 5, // 5 minutes per order
    rootsTimePerOrder: 3, // 3 minutes per order (more efficient)
    rootsEfficiencyMultiplier: 0.85, // 15% cost reduction
  },
  delivery: {
    deliveryAmman24hrsMerchant: 2.2, // Merchant delivery cost per order (Amman 24hrs)
    deliveryAmman24hrsRoots: 2.0, // Roots delivery cost per order (Amman 24hrs)
  },
  overhead: {
    merchantOverheadRate: 0.2, // 20% overhead
    rootsOverhead: 0,
  },
}

/**
 * Get the current assumptions configuration
 * In the future, this could fetch from a database or admin configuration
 */
export function getAssumptions(): Assumptions {
  return DEFAULT_ASSUMPTIONS
}

