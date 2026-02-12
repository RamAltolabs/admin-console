// Type definitions for Merchant and API operations

// Address DTO matching API schema
export interface AddressDTO {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  county?: string;
  phone_numbers: string[];
  email_addresses: string[];
}

// Contact DTO matching API schema
export interface ContactDTO {
  first_name: string;
  last_name: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  county?: string;
  phone_numbers?: string[];
}

// Merchant interface for internal use
export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status?: 'active' | 'inactive' | 'suspended' | 'unknown';
  cluster: string;
  businessType?: string;
  createdAt: string;
  updatedAt: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
  channels?: string[];
  products?: any[];
  caption?: string;
  website?: string;
  timeZone?: string;
  contactFirstName?: string;
  contactLastName?: string;
}

// API Response structures
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MerchantResponse {
  id: string;
  merchant: Record<string, any>;
}

export interface PageResponseMerchantResponse {
  content: MerchantResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// Create Merchant Request matching API schema
export interface CreateMerchantRequest {
  merchantName: string;
  type: string;
  currency: string;
  status?: string;
  autoApproveOrder?: boolean;
  address: AddressDTO;
  contacts?: ContactDTO[];
  channels?: string[];
  taxPercent?: Record<string, any>;
  delivery?: Record<string, any>;
  products?: Record<string, any>[];
  discount?: Record<string, any>[];
  images?: Record<string, string>;
}

// Update Merchant Request matching API schema
export interface UpdateMerchantRequest {
  merchantName?: string;
  type?: string;
  currency?: string;
  status?: string;
  autoApproveOrder?: boolean;
  address?: AddressDTO;
  contacts?: ContactDTO[];
  channels?: string[];
  taxPercent?: Record<string, any>;
  delivery?: Record<string, any>;
  products?: Record<string, any>[];
  discount?: Record<string, any>[];
  images?: Record<string, string>;
}

// Status Update Request matching API schema
export interface UpdateStatusRequest {
  status: 'Active' | 'Inactive';
}

// Backward compatibility - keeping old interfaces
export interface CreateMerchantPayload {
  name?: string; // Kept for backward compatibility
  email: string;
  phone?: string;
  cluster: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  taxId?: string;
  // New account creation fields
  userName?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  authType?: string;
  role?: string;
}

export interface UpdateMerchantPayload extends Partial<CreateMerchantPayload> {
  status?: 'active' | 'inactive' | 'suspended';
}

export interface Cluster {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'inactive';
  gcpProject?: string;
}

// Prompt types for merchant prompts
export interface Prompt {
  id: string;
  merchantId: string;
  promptText: string;
  title?: string;
  type?: string;
  modelId?: number | string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  status?: string;
  merchantInfo?: any;
  version?: number;
  requestParams?: any;
  knowledgeBaseId?: number;
  [key: string]: any; // Allow for additional properties from API
}

export interface PageResponsePrompt {
  content: Prompt[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// Knowledge Base types
export interface KnowledgeBase {
  knowledgeBaseId: number;
  knowledgeBaseName: string;
  knowledgeBaseDesc?: string;
  modelId?: string;
  modelName?: string;
  status?: string;
  aiTrainingStatus?: string;
  createdDate?: string;
  modifiedDate?: string;
  // Backward compatibility/fallbacks
  id?: string;
  title?: string;
  content?: string;
  [key: string]: any;
}

export interface PageResponseKnowledgeBase {
  content: KnowledgeBase[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// Ontology types
export interface Ontology {
  id: string;
  name: string;
  description?: string;
  merchantId: string;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Intent types
export interface Intent {
  id: string;
  name: string;
  description?: string;
  merchantId: string;
  utterances?: string[];
  slots?: any[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  [key: string]: any;
}

// Raw Visitor types
export interface RawVisitor {
  id: string;
  merchantId: string;
  visitorId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  visitedAt?: string;
  pageUrl?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  location?: string;
  [key: string]: any;
}

export interface PageResponseRawVisitor {
  content: RawVisitor[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// Merchant Attribute types
export interface MerchantAttribute {
  id: string;
  merchantId: string;
  attributeKey: string;
  attributeValue: string;
  dataType?: string;
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface PageResponseMerchantAttribute {
  content: MerchantAttribute[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// AI Artifact types
export interface AIArtifact {
  id: string | number;
  name: string;
  provider?: string;
  providerDomain?: string[];
  icon?: {
    url: string;
    filename?: string;
    id?: string;
    storageType?: string;
  } | null;
  tags?: string[];
  description?: string;
  type: string;
  documentation?: string;
  notes?: string[];
  host?: string;
  authentication?: {
    type: string;
    value: {
      token: string;
      pathToCertificate?: string;
      certPassword?: string;
      [key: string]: any;
    };
  };
  status?: string;
  access?: string;
  merchantId?: string;
  ownerMerchantId?: string;
  createdBy?: string;
  createdDate?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  otherAttributes?: { key: string; value: string }[];
  category?: string | null;
  businessType?: string;
  [key: string]: any;
}

export interface PageResponseAIArtifact {
  content: AIArtifact[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}
// Engagement types
export interface Engagement {
  id: string;
  merchantId: string;
  engagementName: string;
  engagementType?: string;
  channelName?: string;
  engagementUrl?: string;
  status?: string;
  startDate?: string;
  createdAt?: string;
  updatedAt?: string;
  aiAgentName?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  userEmail?: string;
  engagementId?: string; // Numeric ID from response
  botTemplateName?: string;
  [key: string]: any;
}

export interface PageResponseEngagement {
  content: Engagement[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// Payload for updateMerchantAttributes API
export interface UpdateMerchantAttributesPayload {
  id: string;
  merchantName: string;
  type: string;
  address: {
    email_addresses: string[];
    phone_numbers: string[];
  };
  contacts: {
    first_name: string;
    last_name: string;
  }[];
  timeZone: string;
  other_params: {
    caption: string;
    workinghours: any[];
    website: string;
    location: string;
  };
  customConfig?: Record<string, any>;
}

export interface MerchantUser {
  id: string | number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  merchantId: string | number;
  createTime: string;
  modifiedTime: string;
  available: boolean;
  authType: string;
  supervisorId?: string | number;
}

export interface PageResponseMerchantUser {
  content: MerchantUser[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}
