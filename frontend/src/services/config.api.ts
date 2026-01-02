import { api, ApiResponse } from "./api-base";

export interface PublicConfigResponse extends ApiResponse {
  data: {
    timezone: string;
  };
}

export const configApi = {
  getPublicConfig: () => api.get<PublicConfigResponse>("/config"),
};
