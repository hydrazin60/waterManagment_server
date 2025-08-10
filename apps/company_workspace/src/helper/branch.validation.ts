import { z } from "zod";

// Helper schemas for nested objects
const AddressSchema = z.object({
    country: z.string().default("Nepal"),
    province: z.string().default("bagmati"),
    district: z.string().optional(),
    municipality: z.string().optional(),
    city: z.string().optional(),
    tole: z.string().optional(),
    nearFamousPlace: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(), // [longitude, latitude]
});

const ContactSchema = z.object({
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email().optional().or(z.literal("")),
    emergencyContact: z.object({
        name: z.string(),
        phone: z.string(),
    }).optional(),
});

const OperatingHoursSchema = z.object({
    days: z.array(z.string()),
    openingTime: z.string().default("08:00"),
    closingTime: z.string().default("17:00"),
    is24Hours: z.boolean().default(false),
});

const StorageLocationSchema = z.object({
    name: z.string().min(1, "Storage location name is required"),
    type: z.enum(["warehouse", "coldStorage", "dispensary"]),
    capacity: z.number().optional(),
    currentStock: z.number().optional(),
});

const DeliveryScheduleSchema = z.object({
    day: z.string(),
    timeSlots: z.array(z.string()),
});

const ImageSchema = z.object({
    public_id: z.string(),
    url: z.string(),
    caption: z.string().optional(),
});

const AccessPermissionsSchema = z.object({
    inventoryManagement: z.boolean().default(false),
    salesAccess: z.boolean().default(true),
    purchaseApproval: z.boolean().default(false),
});

// Main Branch validation schema
export const BranchValidationSchema = z.object({
    // Basic Branch Info
    branchName: z.string().min(1, "Branch name is required"),
    // branchCode: z.string().min(1, "Branch code is required"),
    description: z.string().default("Water Factory Branch"),
    branchType: z.enum(["retail", "distribution", "production", "headOffice"]).default("retail"),
    isActive: z.boolean().default(true),

    // Contact Information
    contact: ContactSchema,
    branchManager: z.string().optional(), // Assuming this will be converted to ObjectId later

    // Location & Address
    address: AddressSchema,
    operatingHours: OperatingHoursSchema.optional(),
    deliveryRadius: z.number().optional(),
    serviceAreas: z.array(z.string()).optional(),

    // Company Reference
    // company: z.string().min(1, "Company ID is required"), // Will be converted to ObjectId

    // Staff & Workers
    staff: z.array(z.string()).optional(), // Array of Worker IDs
    assignedDrivers: z.array(z.string()).optional(), // Array of Worker IDs

    // Inventory & Products
    rawMaterials: z.array(z.string()).optional(), // Array of RawMaterial IDs
    finishedProducts: z.array(z.string()).optional(), // Array of FinishedProduct IDs
    storageLocations: z.array(StorageLocationSchema).optional(),

    // Suppliers & Purchases
    suppliers: z.array(z.string()).optional(), // Array of Supplier IDs
    purchaseInvoices: z.array(z.string()).optional(), // Array of PurchaseInvoice IDs

    // Sales & Orders
    salesInvoices: z.array(z.string()).optional(), // Array of SalesInvoice IDs
    pendingOrders: z.array(z.string()).optional(), // Array of Order IDs
    completedOrders: z.array(z.string()).optional(), // Array of Order IDs

    // Vehicles & Logistics
    assignedVehicles: z.array(z.string()).optional(), // Array of Vehicle IDs
    deliverySchedules: z.array(DeliveryScheduleSchema).optional(),

    // Financial Tracking
    dailySales: z.number().default(0),
    monthlyTarget: z.number().optional(),
    expenseInvoices: z.array(z.string()).optional(), // Array of ExpenseInvoice IDs

    // Branch Security & Access
    branchPassword: z.string().optional(),
    resetPasswordToken: z.string().optional(),
    accessPermissions: AccessPermissionsSchema.optional(),

    // Images & Branding
    branchLogo: z.object({
        public_id: z.string(),
        url: z.string(),
    }).optional(),
    branchImages: z.array(ImageSchema).optional(),

    // // Metadata
    // createdBy: z.string().min(1, "Creator ID is required"), // Will be converted to ObjectId
});

// Type for TypeScript usage
export type BranchInput = z.infer<typeof BranchValidationSchema>;

// Validation function
// Updated validation function with proper error handling
export const validateBranchData = (data: unknown) => {
  const result = BranchValidationSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    return {
      success: false,
      errors: formattedErrors,
      data: null
    };
  }

  return {
    success: true,
    errors: null,
    data: result.data
  };
};