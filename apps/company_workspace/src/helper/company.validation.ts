import { z } from "zod";

export const createCompanySchema = z.object({
  // Basic Company Info
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters"),
  legalName: z.string().min(2, "Legal name must be at least 2 characters"),
  companyType: z.enum([
    "supplier",
    "manufacturer",
    "distributor",
    "retailer",
    "service",
  ]),
  industry: z.enum(["water", "other"]),

  // Optional basic info
  companyLogo: z.string().url().optional(),
  companyWebsite: z.string().url().optional(),
  companyDescription: z.string().max(500).optional(),
  foundingDate: z.coerce.date().optional(),

  // Business Registration
  taxIdentificationNumber: z
    .string()
    .min(5, "Tax ID must be at least 5 characters"),
  vatNumber: z.string().optional(),
  identityDocuments: z.object({
    registrationNumber: z.string().optional(),
    registrationCertificate: z.string().optional(),
    panNumber: z.string().min(4, "PAN number must be at least 4 characters"),
    panPhoto: z.string().optional(),
    taxClearanceCertificate: z.string().optional(),
    vatRegistrationCertificate: z.string().optional(),
  }),

  // Contact Information
  primaryEmail: z.string().email("Invalid email address"),
  primaryPhone: z.string().min(7, "Phone number must be at least 7 digits"),
  secondaryPhone: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relation: z.string().optional(),
    })
    .optional(),

  // Addresses
  operationalAddress: z.object({
    district: z.string().min(2),
    municipality: z.string().optional(),
    city: z.string().optional(),
    tole: z.string().optional(),
    nearFamousPlace: z.string().optional(),
    country: z.string().default("Nepal"),
    province: z.string().min(2),
    zip: z.string().min(3),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }),

  warehouseLocations: z
    .array(
      z.object({
        district: z.string().min(2),
        municipality: z.string().optional(),
        city: z.string().optional(),
        tole: z.string().optional(),
        nearFamousPlace: z.string().optional(),
        country: z.string().default("Nepal"),
        province: z.string().min(2),
        zip: z.string().min(3),
        coordinates: z.tuple([z.number(), z.number()]).optional(),
      })
    )
    .optional(),

  // Financial Information
  bankDetails: z
    .array(
      z.object({
        accountNumber: z.string().min(5),
        bankName: z.string().min(2),
        branchName: z.string().optional(),
        accountHolderName: z.string().min(2),
        bankQRCode: z.string().optional(),
        eSewaID: z.string().optional(),
        eSewaQRCode: z.string().optional(),
        khaltiID: z.string().optional(),
        khaltiQRCode: z.string().optional(),
      })
    )
    .default([]),

  paymentMethods: z.array(z.string()).default([]),

  // Business Operations
  operatingHours: z
    .object({
      days: z.array(z.string()),
      openingTime: z.string(),
      closingTime: z.string(),
    })
    .optional(),
  deliveryRadius: z.number().optional(),
  deliveryFee: z.number().optional(),
  serviceAreas: z.array(z.string()).default([]),
});
