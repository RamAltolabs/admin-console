import axios, { AxiosInstance } from 'axios';
// Ensure axios is installed in the project
// Run `npm install axios` if not already installed

import { Merchant, CreateMerchantPayload, UpdateMerchantPayload, UpdateMerchantAttributesPayload, ApiResponse, Cluster, UpdateStatusRequest, MerchantResponse, Prompt, PageResponsePrompt, KnowledgeBase, PageResponseKnowledgeBase, RawVisitor, PageResponseRawVisitor, MerchantAttribute, PageResponseMerchantAttribute, AIArtifact, PageResponseAIArtifact, Engagement, PageResponseEngagement, MerchantUser } from '../types/merchant';

class MerchantApiService {
  private api: AxiosInstance;
  private baseURL: string = process.env.IT_APP_BASE_URL || 'https://apin.neocloud.ai/';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor for error handling and session termination
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.warn('[Session Terminated] 401 Unauthorized detected. Logging out...');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          // Dispatch custom event if we want the UI to react without a hard reload
          window.dispatchEvent(new CustomEvent('auth:expired'));
          // Reload to redirect to login page
          window.location.reload();
        }
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Helper to parse weird API dates like "03/21/2018 05:03:649"
  private parseApiDate(dateStr: any): string {
    if (!dateStr || String(dateStr).trim() === '') {
      return '';
    }

    const originalStr = String(dateStr).trim();

    try {
      // 1. Try standard Date parsing
      const d = new Date(originalStr);
      if (!isNaN(d.getTime())) return d.toISOString();

      // 2. Handle non-standard format: "MM/DD/YYYY HH:mm:ms" or "MM/DD/YYYY HH:mm:ss AM/PM PST"
      // Or DD/MM/YYYY if the first part > 12

      const parts = originalStr.split(/\s+/);
      const datePart = parts[0]; // MM/DD/YYYY or DD/MM/YYYY
      const dateSubParts = datePart.split('/');

      if (dateSubParts.length === 3) {
        let p1 = dateSubParts[0];
        let p2 = dateSubParts[1];
        let yyyy = dateSubParts[2];

        if (yyyy.length === 2) yyyy = '20' + yyyy; // Handle YY

        let mm, dd;
        if (parseInt(p1) > 12) {
          // Likely DD/MM/YYYY
          dd = p1.padStart(2, '0');
          mm = p2.padStart(2, '0');
        } else {
          // Likely MM/DD/YYYY
          mm = p1.padStart(2, '0');
          dd = p2.padStart(2, '0');
        }

        let hh = '00', min = '00', ss = '00', ms = '000';

        const timePart = parts[1];
        if (timePart) {
          const timeSubParts = timePart.split(':');
          hh = (timeSubParts[0] || '00').padStart(2, '0');
          min = (timeSubParts[1] || '00').padStart(2, '0');

          if (timeSubParts[2]) {
            const val = timeSubParts[2];
            if (val.length >= 3) {
              // Likely milliseconds: 649
              ms = val.substring(0, 3);
              ss = '00';
            } else {
              // Likely seconds: 64
              ss = val.padStart(2, '0');
              if (parseInt(ss) > 59) ss = '59'; // Cap invalid seconds
            }
          }
        }

        // Handle AM/PM if present
        const isPM = parts.some(p => p.toUpperCase() === 'PM');
        if (isPM && parseInt(hh) < 12) {
          hh = String(parseInt(hh) + 12).padStart(2, '0');
        } else if (!isPM && parts.some(p => p.toUpperCase() === 'AM') && parseInt(hh) === 12) {
          hh = '00';
        }

        // Construct ISO-like string: YYYY-MM-DDTHH:mm:ss.sss
        const isoTrial = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}Z`;
        const dt = new Date(isoTrial);
        if (!isNaN(dt.getTime())) return dt.toISOString();

        // Last resort: just the date
        const dateOnly = new Date(`${yyyy}-${mm}-${dd}`);
        if (!isNaN(dateOnly.getTime())) return dateOnly.toISOString();
      }
    } catch (e) {
      // Fail silently and return empty
    }

    return '';
  }

  // Centralized normalization logic for Merchant objects
  private normalizeMerchant(item: any, clusterOverride?: string): Merchant {
    const merchant = item.merchant || item.data || item;
    console.log('[normalizeMerchant] Raw item:', item);
    console.log('[normalizeMerchant] Extracted merchant source:', merchant);

    // Robust status mapping
    let status: 'active' | 'inactive' | 'suspended' | 'unknown' = 'unknown';
    const rawStatus = merchant.status || merchant.merchantStatus || item.status || item.merchantStatus;
    const active = merchant.active !== undefined ? merchant.active : item.active;

    if (active === true) {
      status = 'active';
    } else if (active === false) {
      status = 'inactive';
    } else if (rawStatus) {
      const s = String(rawStatus).toLowerCase();
      if (s === 'active' || s.includes(' active') || s.startsWith('active')) {
        if (!s.includes('inactive')) status = 'active';
        else status = 'inactive';
      }
      else if (s.includes('inactive')) status = 'inactive';
      else if (s.includes('suspended')) status = 'suspended';
      else status = 'unknown'; // If status is present but not recognized
    }
    // If no status field is found, it remains 'unknown' as initialized

    const rawCreatedAt = merchant.createTime || item.createTime || merchant.createDate || item.createDate || merchant.createdDate || item.createdDate || merchant.createdAt || item.createdAt;
    const rawUpdatedAt = merchant.modifiedTime || item.modifiedTime || merchant.lastModifiedDate || item.lastModifiedDate || merchant.updatedAt || item.updatedAt || merchant.modifiedDate || item.modifiedDate;

    // Mapping new fields structure with fallbacks to old structure
    const id = merchant.merchantId || merchant.id || item.id || '';
    const name = merchant.businessName || merchant.merchantName || merchant.name ||
      (merchant.firstName ? `${merchant.firstName} ${merchant.lastName || ''}`.trim() :
        (merchant.contactFirstName ? `${merchant.contactFirstName} ${merchant.contactLastName || ''}`.trim() : 'Unknown'));

    // Email mapping
    let email = 'N/A';
    if (merchant.emailAddress) email = merchant.emailAddress;
    else if (merchant.address?.email_addresses?.[0]) email = merchant.address.email_addresses[0];

    // Phone mapping
    let phone = 'N/A';
    if (merchant.phone) phone = merchant.phone;
    else if (merchant.address?.phone_numbers?.[0]) phone = merchant.address.phone_numbers[0];

    // Address parts
    const address = merchant.street || merchant.address?.address1 || '';
    const city = merchant.city || merchant.address?.city || '';
    const state = merchant.state || merchant.address?.state || '';
    const country = merchant.country || merchant.address?.country || '';
    const taxId = merchant.licenseId || merchant.taxId || '';
    const region = clusterOverride || merchant.region || merchant.type || 'Unknown';

    return {
      id: String(id),
      name: name,
      email: email,
      phone: phone,
      cluster: region, // Using region as cluster/type
      businessType: merchant.businessType || merchant.type || 'N/A',
      status,
      createdAt: this.parseApiDate(rawCreatedAt),
      updatedAt: this.parseApiDate(rawUpdatedAt),
      address,
      city,
      state,
      country,
      taxId: String(taxId), // Convert number to string if needed
      channels: (() => {
        const channelConfig = merchant.channelConfig || item.channelConfig;
        if (Array.isArray(channelConfig) && channelConfig.length > 0) {
          return channelConfig.map((ch: any) => {
            const provider = ch.provider || 'Unknown';
            const phoneNumber = ch.phoneNumber || ch.name || '';
            return phoneNumber ? `${provider} (${phoneNumber})` : provider;
          });
        }
        return merchant.channels || item.channels || [];
      })(),
      caption: merchant.caption || merchant.other_params?.caption || '',
      website: merchant.website || merchant.other_params?.website || '',
      timeZone: merchant.timeZone || '',
      contactFirstName: merchant.contactFirstName || merchant.firstName || '',
      contactLastName: merchant.contactLastName || merchant.lastName || '',
    };
  }

  private normalizeUser(item: any): MerchantUser {
    return {
      id: item.id || '',
      userName: item.userName || '',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      role: item.role || 'USER',
      status: item.status || 'INACTIVE',
      merchantId: item.merchantId || '',
      createTime: this.parseApiDate(item.createTime),
      modifiedTime: this.parseApiDate(item.modifiedTime),
      available: (item.available === true || String(item.available).toLowerCase() === 'true' || item.available === 1 || item.available === '1' ||
        item.isOnline === true || String(item.isOnline).toLowerCase() === 'true' ||
        item.online === true || String(item.online).toLowerCase() === 'true'),
      authType: item.authType || 'N/A',
      supervisorId: item.supervisorId,
    };
  }

  // Helper to determine base URL based on cluster
  private getClusterBaseURL(clusterId?: string): string {
    switch (clusterId?.toLowerCase()) {
      case 'app6':
      case 'app6a':
        return process.env.APP6A_BASE_URL || 'https://api6a.neocloud.ai/';
      case 'app6e':
        return process.env.APP6E_BASE_URL || 'https://api6e.neocloud.ai/';
      case 'app30a':
        return process.env.APP30A_BASE_URL || 'https://api30a.neocloud.ai/';
      case 'app30b':
        return process.env.APP30B_BASE_URL || 'https://api30b.neocloud.ai/';
      case 'it-app':
      default:
        return process.env.IT_APP_BASE_URL || 'https://apin.neocloud.ai/';
    }
  }

  // Health Check
  async ping(): Promise<boolean> {
    try {
      const response = await this.api.get('/ping');
      console.log('Health check response:', response.data);
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Cluster operations
  async getClusters(): Promise<Cluster[]> {
    try {
      const envConfig = process.env.CLUSTERS_CONFIG;
      if (envConfig) {
        // Remove potential single quotes if they were included in the env value 
        // (some shells/loaders might keep them)
        const sanitizedConfig = envConfig.trim().replace(/^'|'$/g, '');
        return JSON.parse(sanitizedConfig);
      }
    } catch (err) {
      console.error('Failed to parse CLUSTERS_CONFIG from env:', err);
    }

    // Fallback to hardcoded clusters if env is missing or invalid
    return [
      { id: 'it-app', name: 'IT-APP', region: 'US-Central', status: 'active', gcpProject: 'GCP Project Name: Nebula' },
      { id: 'app6a', name: 'APP6A', region: 'US-Central', status: 'active', gcpProject: 'GCP Project Name: Pluto' },
      { id: 'app6e', name: 'APP6E', region: 'Asia-South', status: 'active', gcpProject: 'GCP Project Name: Pluto' },
      { id: 'app30a', name: 'APP30A', region: 'US-Central', status: 'active', gcpProject: 'GCP Project Name: Earth' },
      { id: 'app30b', name: 'APP30B', region: 'US-Central', status: 'active', gcpProject: 'GCP Project Name: Earth' },
    ];
  }

  // Merchant operations - Using regular merchants endpoint
  async getMerchants(cluster?: string, page: number = 0, size: number = 100): Promise<Merchant[]> {
    try {
      const params: any = {};

      // Determine the correct base URL for this request
      const baseURL = this.getClusterBaseURL(cluster);

      // Axios treats full URLs as absolute, overriding the instance baseURL
      // Ensure we construct the full URL correctly
      const url = `${baseURL}curo/merchant/getMerchants`;

      const response = await this.api.get<any>(url, { params });

      console.log(`[getMerchants] API response for cluster=${cluster} (${url}):`, response.data);

      // Handle cases where response.data might be a stringified JSON
      let rawData = response.data;
      if (typeof rawData === 'string') {
        try {
          rawData = JSON.parse(rawData);
          console.log('[getMerchants] Parsed stringified JSON response');
        } catch (e) {
          console.warn('[getMerchants] Response is a string but not valid JSON');
        }
      }

      // Handle different response formats
      let merchantsData: any[] = [];

      if (rawData && rawData.content && Array.isArray(rawData.content)) {
        merchantsData = rawData.content;
      } else if (Array.isArray(rawData)) {
        merchantsData = rawData;
      } else if (rawData && rawData.data && Array.isArray(rawData.data)) {
        merchantsData = rawData.data;
      } else {
        console.error('Unexpected API response format:', rawData);
        // Fallback or empty return
      }

      // Normalize the response to match the Merchant type
      return merchantsData.map(item => this.normalizeMerchant(item, cluster));
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      // Return empty array with a message instead of throwing
      return [];
    }
  }

  async getMerchantById(id: string, cluster?: string): Promise<Merchant | null> {
    try {
      console.log(`[getMerchantById] Fetching full merchant data for ID ${id} on cluster ${cluster}`);

      // Step 1: Try fetching full attributes first since it contains "full merchant informations"
      // like AI Artifacts, AI Configs, etc.
      const attributesResponse = await this.getMerchantAttributes(id, 0, 1, cluster);

      if (attributesResponse.content && attributesResponse.content.length > 0) {
        console.log(`[getMerchantById] Successfully fetched full attributes for ID ${id}`);
        return this.normalizeMerchant(attributesResponse.content[0], cluster);
      }

      // Step 2: Fallback to direct merchant ID endpoint if attributes are not found
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/merchant/merchantId/${id}`;

      const response = await this.api.get<any>(url);
      console.log(`[getMerchantById] Fallback API response for id=${id}:`, response.data);

      const rawData = response.data;
      let merchantData: any = null;

      if (Array.isArray(rawData) && rawData.length > 0) {
        merchantData = rawData[0];
      } else if (rawData && typeof rawData === 'object') {
        merchantData = rawData.merchant || rawData.data || rawData;
      }

      if (!merchantData) {
        console.warn(`[getMerchantById] No merchant data found for ID ${id}`);
        return null;
      }

      return this.normalizeMerchant(merchantData, cluster);
    } catch (error) {
      console.error(`Failed to fetch merchant ${id}:`, error);
      return null;
    }
  }

  async createMerchant(payload: CreateMerchantPayload, cluster?: string): Promise<Merchant> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      // New endpoint for account creation as requested by user
      const url = `${baseURL}curo/merchant/createAccount`;

      // Map the payload to the structure expected by createAccount API
      const accountPayload = {
        email: payload.email,
        userName: payload.userName,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        authType: payload.authType || 'PG',
        role: payload.role || 'ADMIN',
      };

      console.log('[createMerchant] Requesting account creation:', { ...accountPayload, password: '***' });

      const response = await this.api.put<any>(url, accountPayload);

      console.log('[createMerchant] API Response:', response.data);

      const rawData = response.data;
      const merchantData = rawData?.data || rawData;

      if (!merchantData) {
        throw new Error('Failed to create merchant: No data returned');
      }

      // If the response doesn't look like a merchant but we got a success
      // we might need to handle it differently or return what we can
      return this.normalizeMerchant(merchantData, cluster);
    } catch (error) {
      console.error('Failed to create merchant:', error);
      throw error;
    }
  }

  async updateMerchant(id: string, payload: UpdateMerchantPayload, cluster?: string): Promise<Merchant> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}merchants/${id}`;

      const response = await this.api.put<any>(url, payload);

      // Handle case where API returns 200 OK with null data
      if (response.status === 200 && !response.data.data) {
        console.log('Update successful but no data returned, fetching merchant details...');
        // Fetch the updated merchant details
        const updatedMerchant = await this.getMerchantById(id, cluster);
        if (!updatedMerchant) {
          throw new Error('Failed to retrieve updated merchant');
        }
        return updatedMerchant;
      }

      const rawData = response.data;
      const merchantData = rawData?.data || rawData;

      if (!merchantData && response.status !== 200) {
        throw new Error('Failed to update merchant');
      }

      // If update was successful but no data returned, fetch it
      if (!merchantData) {
        const updatedMerchant = await this.getMerchantById(id, cluster);
        if (!updatedMerchant) {
          throw new Error('Failed to retrieve updated merchant details');
        }
        return updatedMerchant;
      }

      return this.normalizeMerchant(merchantData, cluster);
    } catch (error) {
      console.error(`Failed to update merchant ${id}:`, error);
      throw error;
    }
  }

  async updateMerchantAttributes(id: string, payload: UpdateMerchantAttributesPayload, cluster?: string): Promise<Merchant> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/updateMerchantAttributes?access_token=${this.getAccessToken()}`;

      console.log(`[updateMerchantAttributes] Request: ${url}`, payload);

      const response = await this.api.post<any>(url, payload);

      console.log(`[updateMerchantAttributes] API Response:`, response.data);

      const rawData = response.data;
      const merchantData = rawData?.data || rawData;

      if (!merchantData && response.status !== 200) {
        throw new Error('Failed to update merchant attributes');
      }

      // If successful but no data returned, fetch it
      if (!merchantData || typeof merchantData !== 'object') {
        const updatedMerchant = await this.getMerchantById(id, cluster);
        if (!updatedMerchant) {
          throw new Error('Failed to retrieve updated merchant details after attributes update');
        }
        return updatedMerchant;
      }

      return this.normalizeMerchant(merchantData, cluster);
    } catch (error) {
      console.error(`Failed to update merchant attributes for ${id}:`, error);
      throw error;
    }
  }

  async updateCustomConfig(id: string, customConfig: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/updateMerchantAttributes?access_token=${this.getAccessToken()}`;

      // We need to fetch the current merchant attributes first to preserve other fields
      // but if we are just updating customConfig, many APIs accept a partial or specific structure
      // For this project, we'll try sending customConfig as part of a common payload structure
      const payload = {
        id,
        customConfig
      };

      console.log(`[updateCustomConfig] Request: ${url}`, payload);
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error(`Failed to update custom config for ${id}:`, error);
      throw error;
    }
  }

  async publishAgenticAI(botName: string, groupName: string, merchantRef: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}jelloBuilder/storyDialog/publish?access_token=${this.getAccessToken()}`;

      const payload = {
        botName,
        groupName: groupName || "Enterprise",
        merchantRef,
        merchantId: merchantRef
      };

      console.log(`[publishAgenticAI] Request: ${url}`, payload);
      const response = await this.api.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'context': 'Chimes'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to publish Agentic AI for ${botName}:`, error);
      throw error;
    }
  }

  async deleteMerchant(id: string, cluster?: string): Promise<boolean> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/merchant/deleteMerchant`;
      const response = await this.api.delete<ApiResponse<{ id: string }>>(url, {
        params: { merchantId: id }
      });
      return response.data.success;
    } catch (error) {
      console.error(`Failed to delete merchant ${id}:`, error);
      throw error;
    }
  }

  async updateMerchantStatus(id: string, status: 'Active' | 'Inactive', cluster?: string): Promise<Partial<Merchant>> {
    try {
      const payload: UpdateStatusRequest = { status };
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}merchants/${id}/status`;

      const response = await this.api.patch<any>(url, payload);

      // Handle different response formats flexibly
      if (response.data && response.data.merchant) {
        // Full merchant object in response.data.merchant format
        const merchantData = response.data.merchant;
        return {
          id: merchantData.id || response.data.id || id,
          name: merchantData.merchantName || 'Unknown',
          email: merchantData.address?.email_addresses?.[0] || 'N/A',
          phone: merchantData.address?.phone_numbers?.[0] || 'N/A',
          cluster: merchantData.cluster || 'Unknown',
          status: (merchantData.status || status).toLowerCase() as 'active' | 'inactive' | 'suspended',
          createdAt: merchantData.createdDate || new Date().toISOString(),
          updatedAt: merchantData.lastModifiedDate || new Date().toISOString(),
          address: merchantData.address?.street || '',
          city: merchantData.address?.city || '',
          state: merchantData.address?.state || '',
          country: merchantData.address?.country || '',
          taxId: merchantData.taxId || '',
        };
      } else if (response.data && response.data.data) {
        // Response wrapped in data property
        return response.data.data;
      } else if (response.data) {
        // Direct response data
        return response.data;
      }

      // If no data returned but request was successful (200 OK),
      // return minimal update object with just id and status
      console.log('API returned 200 OK but no data, returning minimal object');
      return { id, status: status.toLowerCase() as 'active' | 'inactive' | 'suspended' };
    } catch (error) {
      console.error(`Failed to update merchant status ${id}:`, error);
      throw error;
    }
  }

  async searchMerchants(query: string, searchType?: 'merchantId' | 'email' | 'merchantStatus', cluster?: string): Promise<Merchant[]> {
    try {
      const params: any = {};

      // Determine search type if not specified
      if (!searchType) {
        if (/^\d+$/.test(query)) {
          searchType = 'merchantId';
        } else if (query.includes('@') || query.includes('.com')) {
          searchType = 'email';
        } else if (/^(Active|Inactive|Suspended)$/i.test(query)) {
          searchType = 'merchantStatus';
        }
      }

      // Set the appropriate parameter based on search type
      if (searchType === 'merchantId') {
        params.merchantId = query;
      } else if (searchType === 'email') {
        params.email = query;
      } else if (searchType === 'merchantStatus') {
        params.merchantStatus = query;
      } else {
        console.warn('Unable to determine search type for query:', query);
        return [];
      }

      const baseURL = this.getClusterBaseURL(cluster);

      let url = `${baseURL}merchants/search`;
      if (searchType === 'merchantId') {
        url = `${baseURL}curo/merchant/merchantId/${query}`;
        // No params needed for direct ID fetch
      }

      console.log(`[searchMerchants] Request URL: ${url}`);
      const response = await this.api.get<any>(url, { params: searchType === 'merchantId' ? {} : params });
      console.log(`[searchMerchants] API response for query=${query} cluster=${cluster}:`, response.data);

      let rawData = response.data;
      if (typeof rawData === 'string') {
        try {
          rawData = JSON.parse(rawData);
        } catch (e) {
          console.warn('[searchMerchants] Response is a string but not valid JSON');
        }
      }

      // Handle different response formats
      let merchantsData: any[] = [];
      if (Array.isArray(rawData)) {
        merchantsData = rawData;
      } else if (rawData && (rawData.merchantId || rawData.id) && !rawData.content) {
        // Handle single object response if it looks like a merchant
        merchantsData = [rawData];
      } else if (rawData && rawData.content && Array.isArray(rawData.content)) {
        merchantsData = rawData.content;
      } else if (rawData && Array.isArray(rawData.merchants)) {
        merchantsData = rawData.merchants;
      } else if (rawData && rawData.data && Array.isArray(rawData.data)) {
        merchantsData = rawData.data;
      } else if (rawData && rawData.data && (rawData.data.merchantId || rawData.data.id)) {
        // Handle single object wrapped in .data
        merchantsData = [rawData.data];
      }

      // Normalize the response
      return merchantsData.map(item => this.normalizeMerchant(item, cluster));
    } catch (error) {
      console.error('Failed to search merchants:', error);
      return [];
    }
  }

  async exportMerchants(cluster?: string): Promise<Blob> {
    try {
      const params = cluster ? { cluster } : {};
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}merchants/export`;

      const response = await this.api.get(url, {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export merchants:', error);
      throw error;
    }
  }

  async getPrompts(merchantId: string, page: number = 0, size: number = 20, cluster?: string): Promise<PageResponsePrompt> {
    try {
      // Use dynamic base URL based on cluster
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/promptlab/getPrompt`;

      const payload = { merchantId };

      console.log(`[getPrompts] POST ${url}`, payload);

      const response = await this.api.post<any>(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[getPrompts] API response:`, response.data);

      const rawData = response.data;
      const promptsArray = Array.isArray(rawData?.prompt) ? rawData.prompt : [];

      console.log(`[getPrompts] Found ${promptsArray.length} prompts`);

      // Map new structure to Prompt interface
      const mappedPrompts: Prompt[] = promptsArray.map((p: any) => ({
        id: String(p.promptId),
        merchantId: p.merchantId || merchantId,
        promptText: p.promptDescription || 'N/A',
        title: p.promptTitle || 'Untitled',
        type: p.promptType || 'N/A',
        modelId: p.modelId,
        createdAt: p.createdDate,
        updatedAt: p.modifiedDate,
        version: p.version,
        requestParams: p.requestParams,
        isDeleted: p.deleted || false,
        status: p.deleted ? 'Deleted' : 'Active',
      }));

      // Return as paginated response
      return {
        content: mappedPrompts,
        pageNumber: 0,
        pageSize: mappedPrompts.length || size,
        totalElements: mappedPrompts.length,
        totalPages: 1,
        last: true,
        first: true
      };
    } catch (error) {
      console.error(`Failed to fetch prompts for merchant ${merchantId}:`, error);
      return {
        content: [],
        pageNumber: page,
        pageSize: size,
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true
      };
    }
  }

  async getChatHistory(sessionId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}webchnl/conversation?sid=${sessionId}`;
      const response = await this.api.get<any>(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch chat history for sessionId ${sessionId}:`, error);
      return [];
    }
  }

  async getWebVisitors(merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      // Using the user-provided endpoint format from curl example
      // randId seems to be a high-entropy random number
      const randId = Math.floor(Math.random() * 10000000000000000);
      const url = `${baseURL}v6/webchnl/visitors?merchantId=${merchantId}&randId=${randId}`;

      const response = await this.api.get(url, {
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch web visitors:', error);
      return [];
    }
  }

  // Knowledge Bases
  async getKnowledgeBases(merchantId: string, page: number = 0, size: number = 20, cluster?: string): Promise<PageResponseKnowledgeBase> {
    try {
      // Use dynamic base URL based on cluster
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/knowledgeBase/getKnowledgeBaseDetails`;

      const payload = {
        merchantId,
        pageIndex: page,
        pageCount: size
      };

      console.log(`[getKnowledgeBases] POST ${url}`, payload);

      const response = await this.api.post<any>(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[getKnowledgeBases] API response:`, response.data);

      const rawData = response.data;
      // Extract content from response structure (likely inside 'data' or 'content' or 'knowledgeBase')
      let content: KnowledgeBase[] = [];
      const responseData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data) ? rawData.data : rawData;

      if (Array.isArray(responseData)) {
        content = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Check for common array properties
        if (Array.isArray(responseData.knowledgeBase)) content = responseData.knowledgeBase;
        else if (Array.isArray(responseData.content)) content = responseData.content;
        else if (Array.isArray(responseData.data)) content = responseData.data;
      }

      return {
        content: content,
        pageNumber: responseData?.pageIndex ?? page,
        pageSize: responseData?.pageCount ?? size,
        totalElements: responseData?.totalElements ?? content.length,
        totalPages: Math.ceil((responseData?.totalElements ?? content.length) / (responseData?.pageCount ?? size)) || 1,
        last: true, // simplified
        first: page === 0,
      };

    } catch (error) {
      console.error(`Failed to fetch knowledge bases for merchant ${merchantId}:`, error);
      return {
        content: [],
        pageNumber: page,
        pageSize: size,
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true
      };
    }
  }


  // Documents
  async getDocuments(merchantId: string, page: number = 0, size: number = 20, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/knowledgeBaseDocument/getDocuments`;

      const payload = {
        merchantId,
        pageIndex: page,
        pageCount: size,
        dataSource: 'Document'
      };

      console.log(`[getDocuments] POST ${url}`, payload);

      const response = await this.api.post<any>(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[getDocuments] API response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for merchant ${merchantId}:`, error);
      return {
        content: [],
        totalElements: 0
      };
    }
  }

  // Raw Visitors by Merchant (Legacy)
  async getRawVisitors(merchantId: string, page: number = 0, size: number = 20, cluster?: string, startDate?: string, endDate?: string): Promise<PageResponseRawVisitor> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);

      // Default date range: last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const formatApiDate = (date: Date) => date.toISOString().split('.')[0]; // YYYY-MM-DDTHH:MM:SS

      const params: any = {
        merchantID: merchantId,
        pageIndex: page,
        pageCount: size,
        startDate: startDate || formatApiDate(thirtyDaysAgo),
        endDate: endDate || formatApiDate(now),
        access_token: this.getAccessToken()
      };

      console.log(`[getRawVisitors] Calling API / chimes / visitorsList with params: `, params);
      const url = `${baseURL} chimes / visitorsList`;

      const response = await this.api.get<any>(url, { params });

      console.log(`[getRawVisitors] API response for merchantId = ${merchantId}: `, response.data);

      const rawData = response.data;
      // Handle various response formats including stringified JSON and nested structures
      let responseData = rawData;

      if (typeof rawData === 'string') {
        try {
          responseData = JSON.parse(rawData);
          console.log('[getRawVisitors] Parsed stringified JSON response');
        } catch (e) {
          console.warn('[getRawVisitors] Response is a string but not valid JSON');
        }
      }

      // Unwrap .data if present
      if (responseData && responseData.data) {
        responseData = responseData.data;
      }

      let content: RawVisitor[] = [];
      if (Array.isArray(responseData)) {
        content = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Look for common array properties in paginated responses
        const potentialArrays = ['content', 'items', 'list', 'rawVisitors', 'visitors'];
        for (const key of potentialArrays) {
          if (Array.isArray(responseData[key])) {
            content = responseData[key];
            break;
          }
        }
      }

      // Return the paginated response
      return {
        content: content,
        pageNumber: responseData?.pageNumber ?? responseData?.pageIndex ?? page,
        pageSize: responseData?.pageSize ?? responseData?.pageCount ?? size,
        totalElements: responseData?.totalElements ?? responseData?.total ?? content.length,
        totalPages: responseData?.totalPages ?? responseData?.pages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
      };
    } catch (error) {
      console.error(`Failed to fetch raw visitors for merchant ${merchantId}: `, error);
      return { content: [], pageNumber: 0, pageSize: size, totalElements: 0, totalPages: 0, last: true, first: true };
    }
  }

  // Cluster-wide Visitors
  async getClusterVisitors(page: number = 0, size: number = 50, cluster?: string, startDate?: string, endDate?: string): Promise<PageResponseRawVisitor> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);

      // Default date range: last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const formatApiDate = (date: Date) => date.toISOString().split('.')[0]; // YYYY-MM-DDTHH:MM:SS

      const params: any = {
        pageIndex: page,
        pageCount: size,
        startDate: startDate || formatApiDate(thirtyDaysAgo),
        endDate: endDate || formatApiDate(now),
        access_token: this.getAccessToken()
      };

      console.log(`[getClusterVisitors] Calling API / chimes / visitorsList with params: `, params);
      const url = `${baseURL} chimes / visitorsList`;

      const response = await this.api.get<any>(url, { params });
      const rawData = response.data;
      const responseData = rawData?.data || rawData;
      let content: RawVisitor[] = [];

      // Try all common nesting patterns
      if (Array.isArray(rawData)) {
        content = rawData;
      } else if (Array.isArray(rawData?.data)) {
        content = rawData.data;
      } else if (rawData?.data && Array.isArray(rawData.data.content)) {
        content = rawData.data.content;
      } else if (rawData?.data && Array.isArray(rawData.data.items)) {
        content = rawData.data.items;
      } else if (Array.isArray(rawData?.content)) {
        content = rawData.content;
      } else if (Array.isArray(rawData?.items)) {
        content = rawData.items;
      } else if (Array.isArray(rawData?.list)) {
        content = rawData.list;
      } else if (typeof rawData === 'object' && rawData !== null) {
        // Look for any array property if still empty
        for (const key in rawData) {
          if (Array.isArray(rawData[key])) {
            content = rawData[key];
            break;
          }
        }
      }

      // Return the paginated response
      return {
        content: content,
        pageNumber: responseData?.pageNumber ?? responseData?.pageIndex ?? page,
        pageSize: responseData?.pageSize ?? responseData?.pageCount ?? size,
        totalElements: responseData?.totalElements ?? responseData?.total ?? content.length,
        totalPages: responseData?.totalPages ?? responseData?.pages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
      };
    } catch (error) {
      console.error(`Failed to fetch cluster visitors for cluster ${cluster}: `, error);
      return { content: [], pageNumber: 0, pageSize: size, totalElements: 0, totalPages: 0, last: true, first: true };
    }
  }

  // Raw Visitors List (New)
  async getRawVisitorsList(merchantId: string, pageIndex: number = 0, pageCount: number = 50, cluster?: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL} chimes / rawVisitorsList`;

      const params: any = {
        merchantID: merchantId,
        pageIndex,
        pageCount,
        startDate: startDate ? new Date(startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : undefined,
        endDate: endDate ? new Date(endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-') : undefined,
        access_token: this.getAccessToken()
      };

      console.log(`[getRawVisitorsList] Params - Start: ${params.startDate}, End: ${params.endDate} `);
      console.log(`[getRawVisitorsList] Request: ${url} `, params);
      const response = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch raw visitors list:', error);
      return [];
    }
  }

  // Merchant Attributes (Legacy)
  async getMerchantAttributes(merchantId: string, page: number = 0, size: number = 20, cluster?: string): Promise<PageResponseMerchantAttribute> {
    try {
      console.log(`[getMerchantAttributes] Request: /chimes/getMerchantAttributes merchantId = ${merchantId} cluster = ${cluster} `);
      const baseURL = this.getClusterBaseURL(cluster);

      // Legacy API pattern: chimes/getMerchantAttributes?access_token=...&merchantId=...
      // Ensuring it uses the exact requested structure
      const url = `${baseURL} chimes / getMerchantAttributes ? access_token = ${this.getAccessToken()}& merchantId=${merchantId} `;

      const response = await this.api.get<any>(url);

      console.log(`[getMerchantAttributes] API response: `, response.data);

      const rawData = response.data;
      const responseData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data) ? rawData.data : rawData;

      let content: any[] = [];

      // Flexible extraction logic for legacy response
      if (responseData?.content && Array.isArray(responseData.content)) {
        content = responseData.content;
      } else if (Array.isArray(responseData)) {
        content = responseData;
      } else if (responseData && typeof responseData === 'object') {
        const potentialArrays = ['items', 'list', 'merchantAttributes', 'attributes', 'results', 'data'];
        for (const key of potentialArrays) {
          if (Array.isArray(responseData[key])) {
            content = responseData[key];
            break;
          }
        }

        // Fallback: sometimes single object returned
        if (content.length === 0 && !Array.isArray(responseData) && Object.keys(responseData).length > 0) {
          // If responseData itself looks like an attribute or map of attributes
          content = [responseData];
        }
      }

      console.log('[getMerchantAttributes] Final extracted content:', content);

      // Construct a compatible PageResponse
      return {
        content: content,
        pageNumber: 0, // Legacy API might not support pagination same way
        pageSize: content.length,
        totalElements: content.length,
        totalPages: 1,
        last: true,
        first: true,
      };
    } catch (error) {
      console.error(`Failed to fetch merchant attributes for merchant ${merchantId}: `, error);
      return { content: [], pageNumber: 0, pageSize: size, totalElements: 0, totalPages: 0, last: true, first: true };
    }
  }

  // Merchant Channels by Merchant
  async getMerchantChannels(merchantId: string, page: number = 0, size: number = 20, cluster?: string): Promise<any> {
    try {
      console.log(`[getMerchantChannels] Request: /channels/by - merchant / ${merchantId}/paginated cluster=${cluster}`);
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}channels/by-merchant/${merchantId}/paginated`;

      const response = await this.api.get<any>(url, {
        params: { page, size }
      });

      console.log(`[getMerchantChannels] API response:`, response.data);

      const rawData = response.data;
      const responseData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data) ? rawData.data : rawData;

      let content: any[] = [];
      if (Array.isArray(responseData)) {
        content = responseData;
      } else if (responseData && typeof responseData === 'object') {
        const potentialArrays = ['content', 'items', 'list', 'channels', 'results', 'data'];
        for (const key of potentialArrays) {
          if (Array.isArray(responseData[key])) {
            content = responseData[key];
            break;
          }
        }
      }

      return {
        content: content,
        pageNumber: responseData?.pageNumber ?? responseData?.number ?? page,
        pageSize: responseData?.pageSize ?? responseData?.size ?? size,
        totalElements: responseData?.totalElements ?? responseData?.total ?? content.length,
        totalPages: responseData?.totalPages ?? responseData?.pages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
      };
    } catch (error) {
      console.error(`Failed to fetch merchant channels for merchant ${merchantId}:`, error);
      return { content: [], pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0, last: true, first: true };
    }
  }

  // AI Artifacts by Merchant
  async getAIArtifacts(merchantId: string, page: number = 0, size: number = 10, cluster?: string): Promise<PageResponseAIArtifact> {
    try {
      console.log(`[getAIArtifacts] Request: /ai-artifacts/by-merchant/${merchantId}/paginated, page=${page}, size=${size} cluster=${cluster}`);
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}ai-artifacts/by-merchant/${merchantId}/paginated`;

      const response = await this.api.get<any>(url, {
        params: { page, size }
      });

      console.log(`[getAIArtifacts] API response:`, response.data);

      const rawData = response.data;
      const responseData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data) ? rawData.data : rawData;

      let content: AIArtifact[] = [];

      // Extract content from different response formats
      if (Array.isArray(responseData)) {
        content = responseData;
      } else if (responseData && typeof responseData === 'object') {
        const potentialArrays = ['content', 'items', 'list', 'aiArtifacts', 'artifacts', 'results', 'data'];
        for (const key of potentialArrays) {
          if (Array.isArray(responseData[key])) {
            content = responseData[key];
            break;
          }
        }
      }

      console.log('[getAIArtifacts] Final extracted content:', content);

      // Return the paginated response
      return {
        content: content,
        pageNumber: responseData?.pageNumber ?? responseData?.number ?? page,
        pageSize: responseData?.pageSize ?? responseData?.size ?? size,
        totalElements: responseData?.totalElements ?? responseData?.total ?? content.length,
        totalPages: responseData?.totalPages ?? responseData?.pages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
      };
    } catch (error) {
      console.error(`Failed to fetch AI artifacts for merchant ${merchantId}:`, error);
      return { content: [], pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0, last: true, first: true };
    }
  }

  // Engagements by Merchant
  async getEngagements(merchantId: string, page: number = 0, size: number = 20, cluster?: string): Promise<PageResponseEngagement> {
    try {
      console.log(`[getEngagements] Request: /engagements/by-merchant/${merchantId}/paginated, page=${page}, size=${size} cluster=${cluster}`);
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}engagements/by-merchant/${merchantId}/paginated`;

      const response = await this.api.get<any>(url, {
        params: { page, size }
      });

      console.log(`[getEngagements] API response:`, response.data);

      const rawData = response.data;
      const responseData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data) ? rawData.data : rawData;

      let content: Engagement[] = [];

      // Extract content from different response formats
      if (Array.isArray(responseData)) {
        content = responseData;
      } else if (responseData && typeof responseData === 'object') {
        const potentialArrays = ['content', 'items', 'list', 'engagements', 'results', 'data'];
        for (const key of potentialArrays) {
          if (Array.isArray(responseData[key])) {
            content = responseData[key];
            break;
          }
        }
      }

      console.log('[getEngagements] Final extracted content:', content);

      // Map the content to match our enhanced interface
      const mappedContent = content.map((item: any) => {
        // Extract Bot Template from botList if available
        let botTemplate = '';
        if (item.botList && Array.isArray(item.botList) && item.botList.length > 0) {
          botTemplate = item.botList[0].botTemplateName || '';
        }

        // Generate Preview URL
        // https://it-inferno.neocloud.ai/webchat.html?id=<<Engagement iD>>&mid=<<Merchant ID>>&name=<<Engagement Name>>
        const engagementIdParam = item.engagementId || item.id;
        const merchantIdParam = item.merchantId || merchantId;
        const nameParam = encodeURIComponent(item.name || item.engagementName || 'Untitled');

        const url = `https://it-inferno.neocloud.ai/webchat.html?id=${engagementIdParam}&mid=${merchantIdParam}&name=${nameParam}`;

        return {
          id: item.id,
          engagementId: item.engagementId,
          merchantId: item.merchantId || merchantId,
          engagementName: item.name || item.engagementName || 'Untitled',
          engagementType: item.type || item.engagementType,
          channelName: item.channel?.name,
          engagementUrl: url,
          botTemplateName: botTemplate,
          status: item.status,
          startDate: item.startDate,
          createdAt: item.createdDate || item.createdAt,
          updatedAt: item.lastModifiedDate || item.updatedAt,
          aiAgentName: item.aiAgent?.name,
          createdBy: item.createdBy,
          lastModifiedBy: item.lastModifiedBy,
          userEmail: item.user?.name,
          ...item // Spread original item in case we missed anything needed by UI
        };
      });

      // Return the paginated response
      return {
        content: mappedContent,
        pageNumber: responseData?.pageNumber ?? responseData?.number ?? page,
        pageSize: responseData?.pageSize ?? responseData?.size ?? size,
        totalElements: responseData?.totalElements ?? responseData?.total ?? mappedContent.length,
        totalPages: responseData?.totalPages ?? responseData?.pages ?? 1,
        last: responseData?.last ?? true,
        first: responseData?.first ?? true,
      };
    } catch (error) {
      console.error(`Failed to fetch engagements for merchant ${merchantId}:`, error);
      return { content: [], pageNumber: page, pageSize: size, totalElements: 0, totalPages: 0, last: true, first: true };
    }
  }
  // Helper to get access token
  private getAccessToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  // Departments
  async getDepartmentByMerchant(merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/departmentByMerchant/${merchantId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      return [];
    }
  }

  async createDepartment(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/merchantDepartment?access_token=${this.getAccessToken()}`;
      const response = await this.api.put(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create department:', error);
      throw error;
    }
  }

  async updateDepartment(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/updateDepartment?access_token=${this.getAccessToken()}`;
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update department:', error);
      throw error;
    }
  }

  // Bots
  async getMerchantBots(merchantId: string, botId?: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      let url = `${baseURL}chimes/getMerchantBot?access_token=${this.getAccessToken()}&merchantId=${merchantId}`;
      if (botId) {
        url += `&botId=${botId}`;
      }
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch merchant bots:', error);
      return [];
    }
  }

  async createMerchantBot(payload: any, merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/createMerchantBot?access_token=${this.getAccessToken()}`;
      const body = [{
        merchantId: merchantId,
        bot: payload
      }];
      const response = await this.api.put(url, body);
      return response.data;
    } catch (error) {
      console.error('Failed to create merchant bot:', error);
      throw error;
    }
  }

  async deleteMerchantBot(botId: string, merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/deleteMerchantBot?access_token=${this.getAccessToken()}&merchantId=${merchantId}&botId=${botId}`;
      const response = await this.api.put(url);
      return response.data;
    } catch (error) {
      console.error('Failed to delete merchant bot:', error);
      throw error;
    }
  }

  async getFlowBotExecution(merchantId: string, pageIndex: number = 0, pageCount: number = 100, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/getFlowBotExecution?merchantId=${merchantId}&access_token=${this.getAccessToken()}&pageIndex=${pageIndex}&pageCount=${pageCount}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch flow bot execution logs:', error);
      return [];
    }
  }

  async getChatBotExecution(merchantId: string, pageIndex: number = 0, pageCount: number = 100, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/getChatBotExecution?merchantId=${merchantId}&access_token=${this.getAccessToken()}&pageIndex=${pageIndex}&pageCount=${pageCount}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat bot execution logs:', error);
      return [];
    }
  }

  async getModelDetails(merchantId: string, aiList: string[], modelType?: string, pageIndex: number = 0, pageCount: number = 50, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/model/getModelDetails`;
      const payload: any = {
        merchantId: merchantId,
        ai: aiList.join(','),
        pageIndex,
        pageCount
      };
      if (modelType) {
        payload.modelType = modelType;
      }
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch model details:', error);
      throw error;
    }
  }

  async createAIModel(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/model/create?access_token=${this.getAccessToken()}`;
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create AI model:', error);
      throw error;
    }
  }

  async deleteAIModel(modelId: string, merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/model/delete?access_token=${this.getAccessToken()}&merchantId=${merchantId}&modelId=${modelId}`;
      const response = await this.api.post(url); // Using POST for delete as per common pattern in some parts of this legacy app
      return response.data;
    } catch (error) {
      console.error('Failed to delete AI model:', error);
      throw error;
    }
  }

  async addKnowledgeBase(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}knowledge-bases/create?access_token=${this.getAccessToken()}`;
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to add knowledge base:', error);
      throw error;
    }
  }

  async getKnowledgeBasesByModel(modelId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}knowledge-bases/by-model/${modelId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch KBs by model:', error);
      return [];
    }
  }

  async getDocumentsByKB(kbId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}documents/by-kb/${kbId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch documents by KB:', error);
      return [];
    }
  }

  async trainAIModel(merchantId: string, modelId: number, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/model/train`;
      const payload = { merchantId, modelId };
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to train AI model:', error);
      throw error;
    }
  }

  async getAIAgents(merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/aiAgents/${merchantId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.get(url);

      const rawData = response.data;

      if (Array.isArray(rawData)) {
        return rawData;
      }

      if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.data)) return rawData.data;
        if (Array.isArray(rawData.content)) return rawData.content;

        // Final fallback: look for any array property
        for (const key in rawData) {
          if (Array.isArray(rawData[key])) {
            return rawData[key];
          }
        }
      }

      return rawData;
    } catch (error) {
      console.error('Failed to fetch AI agents:', error);
      return [];
    }
  }

  async updateAIAgent(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/createAIAgent?access_token=${this.getAccessToken()}`;
      const response = await this.api.put(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update AI agent:', error);
      throw error;
    }
  }

  async deleteAIAgent(agentId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/removeAIAgent/${agentId}?access_token=${this.getAccessToken()}`;
      // Using POST with empty body as per user's curl example
      const response = await this.api.post(url, {});
      return response.data;
    } catch (error) {
      console.error('Failed to delete AI agent:', error);
      throw error;
    }
  }

  // Pages
  async getMerchantPages(merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/getMerchantPage?access_token=${this.getAccessToken()}&merchantID=${merchantId}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch merchant pages:', error);
      return [];
    }
  }

  async createMerchantPage(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/createMerchantPage?access_token=${this.getAccessToken()}`;
      const response = await this.api.put(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create merchant page:', error);
      throw error;
    }
  }

  async updateMerchantPage(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/modifyMrchntPages?access_token=${this.getAccessToken()}`;
      const response = await this.api.put(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update merchant page:', error);
      throw error;
    }
  }

  async deleteMerchantPage(pageId: string, pageTemplateId: string, merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/deleteMerchantPages?access_token=${this.getAccessToken()}&merchantID=${merchantId}&pageId=${pageId}&pageTemplateId=${pageTemplateId}`;
      const response = await this.api.put(url); // CommonUtils uses put for delete
      return response.data;
    } catch (error) {
      console.error('Failed to delete merchant page:', error);
      throw error;
    }
  }

  // Users
  async getAllUsers(merchantId: string, cluster?: string): Promise<MerchantUser[]> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/userDetails?merchantId=${merchantId}`;
      const response = await this.api.get<any>(url);

      const rawData = response.data;
      const responseData = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data) ? rawData.data : rawData;

      let users: any[] = [];
      if (Array.isArray(responseData)) {
        users = responseData;
      } else if (responseData && typeof responseData === 'object' && Array.isArray(responseData.content)) {
        users = responseData.content;
      } else if (responseData && typeof responseData === 'object') {
        for (const key in responseData) {
          if (Array.isArray(responseData[key])) {
            users = responseData[key];
            break;
          }
        }
      }

      return users.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error('Failed to fetch merchant users:', error);
      return [];
    }
  }

  // Cluster-wide Users
  async getClusterUsers(cluster?: string): Promise<MerchantUser[]> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/userDetails`;
      const response = await this.api.get<any>(url);

      const rawData = response.data;
      let users: any[] = [];

      // Try all common nesting patterns
      if (Array.isArray(rawData)) {
        users = rawData;
      } else if (Array.isArray(rawData?.data)) {
        users = rawData.data;
      } else if (rawData?.data && Array.isArray(rawData.data.content)) {
        users = rawData.data.content;
      } else if (Array.isArray(rawData?.content)) {
        users = rawData.content;
      } else if (typeof rawData === 'object' && rawData !== null) {
        // Look for any array property if still empty
        for (const key in rawData) {
          if (Array.isArray(rawData[key])) {
            users = rawData[key];
            break;
          }
        }
      }

      return users.map(user => this.normalizeUser(user));
    } catch (error) {
      console.error(`Failed to fetch cluster users for cluster ${cluster}:`, error);
      return [];
    }
  }

  async inviteUser(merchantId: string, email: string, role: string, authType: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/merchant/user/register/${merchantId}/${email}/${role}/${authType}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  }

  async updateUserAccount(user: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/updateUserAccount`;
      const response = await this.api.put(url, user);
      return response.data;
    } catch (error) {
      console.error('Failed to update user account:', error);
      throw error;
    }
  }

  async resetPassword(userName: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}curo/merchant/manageAccount/resetPassword?userName=${userName}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }

  // Contacts
  async getContactsByMerchant(merchantId: string, cluster?: string, pageIndex: number = 0, pageCount: number = 10): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/contactByMerchant/${merchantId}?access_token=${this.getAccessToken()}&pageIndex=${pageIndex}&pageCount=${pageCount}`;
      console.log(`[getContactsByMerchant] Request URL: ${url}`);
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      return [];
    }
  }

  async updatePrompt(merchantId: string, promptId: string | number, payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = cluster?.toLowerCase() === 'app6e' ? 'https://api6e.neocloud.ai/' : 'https://api6a.neocloud.ai/';
      const url = `${baseURL}model-service/promptlab/modify/${merchantId}/${promptId}`;
      const response = await this.api.put(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update prompt:', error);
      throw error;
    }
  }

  async runPrompt(merchantId: string, promptText: string, modelId?: string | number, cluster?: string): Promise<any> {
    try {
      const baseURL = cluster?.toLowerCase() === 'app6e' ? 'https://api6e.neocloud.ai/' : 'https://api6a.neocloud.ai/';
      const url = `${baseURL}aiservices/api/v1/genAI/generate`;
      const response = await this.api.post(url, {
        prompt: promptText,
        merchantId: merchantId,
        modelId: modelId || 391
      });
      return response.data;
    } catch (error) {
      console.error('Failed to run prompt:', error);
      throw error;
    }
  }

  async createPrompt(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/promptlab/create`;
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to create prompt:', error);
      throw error;
    }
  }

  async deletePrompt(merchantId: string, promptId: string | number, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/promptlab/remove/${merchantId}/${promptId}`;
      const response = await this.api.delete(url);
      return response.data;
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      throw error;
    }
  }

  async executePrompt(merchantId: string, promptId: string | number, promptTitle: string, requestParams: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}model-service/api/v1/promptlab/executePrompt`;
      const response = await this.api.post(url, {
        merchantId,
        promptId,
        promptTitle,
        requestParams
      });
      return response.data;
    } catch (error) {
      console.error('Failed to execute prompt:', error);
      throw error;
    }
  }

  async getAIArtifactsList(merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/api/aiArtifact/search/merchant/${merchantId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch AI artifacts:', error);
      return [];
    }
  }

  private sanitizeEngagementPayload(payload: any): any {
    const cleanPayload = { ...payload };

    // 1. Ensure merchantId is a number if it's numeric (API seems to expect number in some cases)
    if (cleanPayload.merchantId && !isNaN(Number(cleanPayload.merchantId))) {
      cleanPayload.merchantId = Number(cleanPayload.merchantId);
    }

    // 2. Remove problematic date fields that might fail server-side deserialization 
    // if they are in a format the backend doesn't expect as strings
    // We'll keep them if they are in ISO format, but strings like "Jul 25, 2025..." or "Feb 10, 2026, 12:00:00 AM" can be problematic
    const problematicDateFields = ['createdDate', 'lastModifiedDate', 'startDate', 'endDate'];
    problematicDateFields.forEach(field => {
      if (cleanPayload[field] && typeof cleanPayload[field] === 'string' && cleanPayload[field].includes(',')) {
        console.warn(`[sanitizeEngagementPayload] Removing potentially problematic date field: ${field}=${cleanPayload[field]}`);
        delete cleanPayload[field];
      }
    });

    return cleanPayload;
  }

  async getEngagementList(merchantId: string, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/engagementList?access_token=${this.getAccessToken()}&merchantId=${merchantId}`;
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch engagements:', error);
      return [];
    }
  }

  async updateEngagement(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/updateEngagement?access_token=${this.getAccessToken()}`;

      const cleanPayload = this.sanitizeEngagementPayload(payload);

      console.log(`[updateEngagement] Sending request to ${url}`, cleanPayload);
      const response = await this.api.post(url, cleanPayload);
      return response.data;
    } catch (error) {
      console.error('Failed to update engagement:', error);
      throw error;
    }
  }

  async deleteEngagement(payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/removeEngagement?access_token=${this.getAccessToken()}`;

      const cleanPayload = this.sanitizeEngagementPayload(payload);

      console.log(`[deleteEngagement] Sending request to ${url}`, cleanPayload);
      const response = await this.api.post(url, cleanPayload);
      return response.data;
    } catch (error) {
      console.error('Failed to delete engagement:', error);
      throw error;
    }
  }

  async updateAIArtifact(merchantId: string, artifactId: string | number, payload: any, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/api/aiArtifact/${artifactId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.put(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to update AI artifact:', error);
      throw error;
    }
  }

  async deleteAIArtifact(artifactId: string | number, cluster?: string): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/api/aiArtifact/${artifactId}?access_token=${this.getAccessToken()}`;
      const response = await this.api.delete(url);
      return response.data;
    } catch (error) {
      console.error('Failed to delete AI artifact:', error);
      throw error;
    }
  }


  /**
   * Get visitor analytics data
   * @param cluster - Cluster identifier
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param engagementName - Engagement name filter (default: "All")
   */
  async getVisitorAnalytics(
    cluster?: string,
    startDate?: string,
    endDate?: string,
    merchantId: string = 'All',
    engagementName: string = 'All'
  ): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}ecloudbl/analytics?access_token=${this.getAccessToken()}`;

      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        dashboard: 'IT_VISITOR',
        params: {
          startdate: start,
          enddate: end,
          merchantid: merchantId,
          engagementname: engagementName
        }
      };

      console.log(`[getVisitorAnalytics] Request for cluster ${cluster}, merchant ${merchantId}:`, { url, payload });
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch visitor analytics:', error);
      throw error;
    }
  }

  /**
   * Get engagement analytics data
   * @param cluster - Cluster identifier
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param engagementName - Engagement name filter (default: "All")
   */
  async getEngagementAnalytics(
    cluster?: string,
    startDate?: string,
    endDate?: string,
    merchantId: string = 'All',
    engagementName: string = 'All'
  ): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}ecloudbl/analytics?access_token=${this.getAccessToken()}`;

      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        dashboard: 'IT_ENGAGEMENT',
        params: {
          startdate: start,
          enddate: end,
          merchantid: merchantId,
          engagementname: engagementName
        }
      };

      console.log(`[getEngagementAnalytics] Request for cluster ${cluster}, merchant ${merchantId}:`, { url, payload });
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch engagement analytics:', error);
      throw error;
    }
  }

  /**
   * Get conversation analytics data
   * @param cluster - Cluster identifier
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param engagementName - Engagement name filter (default: "All")
   */
  async getConversationAnalytics(
    cluster?: string,
    startDate?: string,
    endDate?: string,
    merchantId: string = 'All',
    engagementName: string = 'All'
  ): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}ecloudbl/analytics?access_token=${this.getAccessToken()}`;

      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        dashboard: 'IT_CONVERSATION',
        params: {
          startdate: start,
          enddate: end,
          merchantid: merchantId,
          engagementname: engagementName
        }
      };

      console.log(`[getConversationAnalytics] Request for cluster ${cluster}, merchant ${merchantId}:`, { url, payload });
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversation analytics:', error);
      throw error;
    }
  }

  /**
   * Generic method to fetch analytics for a specific dashboard type
   */
  async getGenericAnalytics(
    dashboard: string,
    cluster?: string,
    startDate?: string,
    endDate?: string,
    merchantId: string = 'All',
    engagementName: string = 'All'
  ): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}ecloudbl/analytics?access_token=${this.getAccessToken()}`;

      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        dashboard,
        params: {
          startdate: start,
          enddate: end,
          merchantid: merchantId,
          engagementname: engagementName
        }
      };

      console.log(`[getGenericAnalytics] Request for ${dashboard} - cluster ${cluster}, merchant ${merchantId}:`, { url, payload });
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ${dashboard} analytics:`, error);
      throw error;
    }
  }

  // Products by Merchant
  async getProducts(merchantId: string, cluster?: string, includeNotAvailable: boolean = false, includeInactive: boolean = false): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/getProduct?access_token=${this.getAccessToken()}`;

      const payload = {
        merchantId,
        includeNotAvailable,
        includeInactive
      };

      const response = await this.api.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'context': 'Chimes'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch products for merchant ${merchantId}:`, error);
      return [];
    }
  }

  // Orders by Merchant
  async getOrders(
    merchantId: string,
    cluster?: string,
    startDate?: string,
    endDate?: string,
    pageIndex: number = 0,
    pageCount: number = 50
  ): Promise<any> {
    try {
      const baseURL = this.getClusterBaseURL(cluster);
      const url = `${baseURL}chimes/getOrderNew?access_token=${this.getAccessToken()}`;

      // Default date range: last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const payload = {
        merchantId,
        startDate: startDate || sevenDaysAgo.toISOString(),
        endDate: endDate || now.toISOString(),
        pageIndex,
        pageCount
      };

      const response = await this.api.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'context': 'Chimes'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch orders for merchant ${merchantId}:`, error);
      return [];
    }
  }
}

export default new MerchantApiService();
