import axios from "axios";

const backendUrl = import.meta.env.VITE_APP_API_URL;

const API_URL = `${backendUrl}/ai/generate`;

interface ModelListResponse {
  models: string[];
}

export class ChatService {
  async sendMessage(payload): Promise<any> {
    try {
      const response = await axios.post(API_URL, { ...payload });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // list gemini models
  async listModels(payload: {
    platform: string;
    apiKey: string;
    onlyNames?: boolean;
  }): Promise<ModelListResponse> {
    try {
      const API_URL = `${backendUrl}/ai/list-models`;
      const response = await axios.post(API_URL, { ...payload });
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
}
