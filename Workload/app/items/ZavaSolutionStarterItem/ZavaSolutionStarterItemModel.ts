/**
 * Zava Solution Starter Item Model
 * 
 * This item provides a Center of Excellence onboarding experience for Fabric users.
 * It guides users through initial setup before providing access to solution resources.
 */

/**
 * Configuration data collected during onboarding
 */
export interface OnboardingFormData {
  /** User's name (auto-populated from token) */
  userName: string;
  /** Selected cost center from predefined list */
  costCenter: string;
  /** User-provided purpose for using Fabric */
  purpose: string;
  /** Selected department from predefined list */
  department: string;
  /** Timestamp when onboarding was completed */
  onboardedAt?: Date;
}

/**
 * Predefined cost centers available for selection
 */
export const COST_CENTERS = [
  { key: "CC001", text: "Marketing & Communications" },
  { key: "CC002", text: "Sales & Customer Success" },
  { key: "CC003", text: "Engineering & Development" },
  { key: "CC004", text: "Data & Analytics" },
  { key: "CC005", text: "Finance & Operations" },
  { key: "CC006", text: "Human Resources" },
  { key: "CC007", text: "IT & Infrastructure" },
  { key: "CC008", text: "Research & Development" },
];

/**
 * Predefined departments available for selection
 */
export const DEPARTMENTS = [
  { key: "DEPT001", text: "Business Intelligence" },
  { key: "DEPT002", text: "Data Science" },
  { key: "DEPT003", text: "Data Engineering" },
  { key: "DEPT004", text: "Analytics" },
  { key: "DEPT005", text: "Product Management" },
  { key: "DEPT006", text: "Strategy & Planning" },
  { key: "DEPT007", text: "Operations" },
  { key: "DEPT008", text: "Quality Assurance" },
];

/**
 * Request for data access
 */
export interface DataAccessRequest {
  /** Unique identifier for the request */
  id: string;
  /** Name of the data source or dataset requested */
  dataSourceName: string;
  /** Business justification for access */
  justification: string;
  /** Status of the request */
  status: DataAccessRequestStatus;
  /** Timestamp when request was created */
  requestedAt: Date;
  /** User who made the request */
  requestedBy: string;
}

/**
 * Status of a data access request
 */
export enum DataAccessRequestStatus {
  Pending = "Pending",
  Approved = "Approved",
  Denied = "Denied",
  InReview = "InReview",
}

/**
 * Solution resource that users can access
 */
export interface SolutionResource {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the resource */
  description: string;
  /** Type of resource (notebook, dataset, report, etc.) */
  type: string;
  /** Optional icon URL */
  icon?: string;
  /** Optional URL to access the resource */
  url?: string;
}

/**
 * Main definition for Zava Solution Starter Item
 */
export interface ZavaSolutionStarterItemDefinition {
  /** Whether the user has completed onboarding */
  isOnboarded: boolean;
  /** Onboarding form data collected from the user */
  onboardingData?: OnboardingFormData;
  /** Available solution resources */
  resources?: SolutionResource[];
  /** Data access requests made by the user */
  dataAccessRequests?: DataAccessRequest[];
}
