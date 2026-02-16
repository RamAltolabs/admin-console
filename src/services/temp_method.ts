
import MerchantApiService from '../services/merchantService';

// Add new method to MerchantApiService
/*
  async getChannelConfig(merchantId: string, cluster?: string): Promise<any> {
    try {
        const baseURL = this.getClusterBaseURL(cluster);
        // /chimes/api/aiArtifact/search/merchant/{merchantId}
        const url = `${baseURL}chimes/api/aiArtifact/search/merchant/${merchantId}?access_token=${this.getAccessToken()}`;
        
        console.log(`[getChannelConfig] Request: ${url}`);
        const response = await this.api.get(url);
        
        console.log(`[getChannelConfig] Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch channel config for merchant ${merchantId}:`, error);
        return []; 
    }
  }
*/
