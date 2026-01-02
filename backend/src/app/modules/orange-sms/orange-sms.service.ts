import axios from 'axios';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../errors/AppError';
import { OrangeSmsCredential } from './orange-sms.model';

interface UpdateOrangeSmsConfigPayload {
  clientId?: string;
  clientSecret?: string;
  senderAddress?: string;
  senderName?: string;
  countryCode?: string;
}

interface DisplayConfig {
  hasCredentials: boolean;
  clientId?: string;
  senderAddress?: string;
  senderName?: string;
  countryCode?: string;
  hasClientSecret?: boolean;
  lastUpdatedAt?: Date;
  lastUpdatedBy?: {
    id: string;
    name: string;
  };
}

interface SendSmsParams {
  phoneNumber: string;
  message: string;
  senderNameOverride?: string;
}

export interface SendSmsResult {
  status: 'sent' | 'failed';
  resourceId?: string;
  error?: string;
  metadata?: {
    usedOverride: boolean;
    clientIdPreview: string;
    authHeaderPreview: string;
  };
}

class OrangeSmsService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private cachedClientId: string | null = null;
  private cachedClientSecret: string | null = null;

  async getDisplayConfig(): Promise<DisplayConfig> {
    const credential = await OrangeSmsCredential.findOne().populate('lastUpdatedBy', 'firstName lastName');

    if (!credential) {
      return { hasCredentials: false };
    }

    return {
      hasCredentials: true,
      clientId: credential.clientId,
      senderAddress: credential.senderAddress,
      senderName: credential.senderName,
      countryCode: credential.countryCode || '224',
      hasClientSecret: Boolean(credential.clientSecret),
      lastUpdatedAt: credential.lastUpdatedAt,
      lastUpdatedBy: credential.lastUpdatedBy
        ? {
            id: (credential.lastUpdatedBy as any)?._id?.toString() ?? '',
            name: `${(credential.lastUpdatedBy as any)?.firstName ?? ''} ${(credential.lastUpdatedBy as any)?.lastName ?? ''}`.trim(),
          }
        : undefined,
    };
  }

  async updateConfig(
    payload: UpdateOrangeSmsConfigPayload,
    userId?: string
  ): Promise<DisplayConfig> {
    let credential = await OrangeSmsCredential.findOne().select('+clientSecret');

    if (!credential) {
      if (!payload.clientId || !payload.clientSecret) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Client ID and client secret are required for initial Orange SMS configuration'
        );
      }

      credential = new OrangeSmsCredential({
        clientId: payload.clientId,
        clientSecret: payload.clientSecret,
        senderAddress: payload.senderAddress,
        senderName: payload.senderName,
        countryCode: payload.countryCode || '224',
        lastUpdatedBy: userId ? new Types.ObjectId(userId) : undefined,
        lastUpdatedAt: new Date(),
      });
    } else {
      if (payload.clientId) credential.clientId = payload.clientId;
      if (payload.clientSecret) credential.clientSecret = payload.clientSecret;
      if (payload.senderAddress !== undefined) credential.senderAddress = payload.senderAddress;
      if (payload.senderName !== undefined) credential.senderName = payload.senderName;
      if (payload.countryCode) credential.countryCode = payload.countryCode;
      credential.lastUpdatedAt = new Date();
      if (userId) {
        credential.lastUpdatedBy = new Types.ObjectId(userId);
      }
      this.clearCachedToken();
    }

    if (!credential.countryCode) {
      credential.countryCode = '224';
    }

    await credential.save();
    return this.getDisplayConfig();
  }

  async sendSms(
    params: SendSmsParams,
    overrideCredentials?: { clientId: string; clientSecret: string }
  ): Promise<SendSmsResult> {
    const credential = await OrangeSmsCredential.findOne().select('+clientSecret');

    if (!credential && !overrideCredentials) {
      throw new AppError(
        httpStatus.PRECONDITION_FAILED,
        'Orange SMS credentials are not configured. Please ask a superadmin to configure them.'
      );
    }

    const clientIdToUse = overrideCredentials?.clientId || credential?.clientId;
    const clientSecretToUse = overrideCredentials?.clientSecret || credential?.clientSecret;

    if (!clientIdToUse || !clientSecretToUse) {
      throw new AppError(
        httpStatus.PRECONDITION_FAILED,
        'Orange SMS credentials are not configured. Please ask a superadmin to configure them.'
      );
    }

    const countryCode = credential?.countryCode || '224';
    const senderAddress = credential?.senderAddress;
    const senderName = credential?.senderName;

    const accessToken = await this.ensureAccessToken(
      clientIdToUse,
      clientSecretToUse,
      {
        skipCache: Boolean(overrideCredentials),
      }
    );
    const normalizedRecipient = this.normalizeRecipientNumber(params.phoneNumber, countryCode);

    if (!normalizedRecipient) {
      return {
        status: 'failed',
        error: 'Invalid recipient phone number',
      };
    }

    const senderMsisdn = senderAddress
      ? senderAddress.replace(/^\+/, '')
      : `${countryCode}0000`;

    const endpoint = `https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B${senderMsisdn}/requests`;

    const payload = {
      outboundSMSMessageRequest: {
        address: `tel:+${normalizedRecipient}`,
        senderAddress: `tel:+${senderMsisdn}`,
        outboundSMSTextMessage: {
          message: params.message,
        },
        senderName: params.senderNameOverride || senderName,
      },
    };

    if (!payload.outboundSMSMessageRequest.senderName) {
      delete payload.outboundSMSMessageRequest.senderName;
    }

    const basicPreview = buildBasicAuthPreview(clientIdToUse, clientSecretToUse);

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const resourceUrl =
        response.data?.outboundSMSMessageRequest?.resourceURL ?? '';
      const parts = resourceUrl.split('/');
      const resourceId = parts.length ? parts[parts.length - 1] : undefined;

      return {
        status: 'sent',
        resourceId,
        metadata: {
          usedOverride: Boolean(overrideCredentials),
          clientIdPreview: clientIdToUse.slice(0, 4) + '****',
          authHeaderPreview: basicPreview,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const errorMessage =
          typeof data === 'string'
            ? data
            : data?.error_description ||
              data?.error ||
              data?.message ||
              error.message;

        if (status === 401 || status === 403) {
          // Token likely expired or invalid, clear cache and retry once
          this.clearCachedToken();
        }

        return {
          status: 'failed',
          error: errorMessage,
          metadata: {
            usedOverride: Boolean(overrideCredentials),
            clientIdPreview: clientIdToUse.slice(0, 4) + '****',
            authHeaderPreview: basicPreview,
          },
        };
      }

      return {
        status: 'failed',
        error: (error as Error).message,
        metadata: {
          usedOverride: Boolean(overrideCredentials),
          clientIdPreview: clientIdToUse.slice(0, 4) + '****',
          authHeaderPreview: basicPreview,
        },
      };
    }
  }

  private async ensureAccessToken(
    clientId: string,
    clientSecret: string,
    options?: { skipCache?: boolean }
  ): Promise<string> {
    const now = Date.now();
    if (
      !options?.skipCache &&
      this.accessToken &&
      now < this.tokenExpiresAt - 30 * 1000 &&
      this.cachedClientId === clientId &&
      this.cachedClientSecret === clientSecret
    ) {
      return this.accessToken;
    }

    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
        {
          headers: {
            Authorization: `Basic ${encoded}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }
      );

      const token = response.data?.access_token;
      const expiresIn = response.data?.expires_in || 3600;

      if (!token) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Orange API did not return an access token'
        );
      }

      if (!options?.skipCache) {
        this.accessToken = token;
        this.tokenExpiresAt = Date.now() + expiresIn * 1000;
        this.cachedClientId = clientId;
        this.cachedClientSecret = clientSecret;
      }
      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        const message =
          typeof data === 'string'
            ? data
            : data?.error_description ||
              data?.error ||
              data?.message ||
              error.message;
        throw new AppError(
          error.response?.status || httpStatus.BAD_GATEWAY,
          `Failed to obtain Orange access token: ${message}`
        );
      }

      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to obtain Orange access token: ${(error as Error).message}`
      );
    }
  }

  private normalizeRecipientNumber(phoneNumber: string, countryCode: string): string | null {
    if (!phoneNumber) {
      return null;
    }

    const digits = phoneNumber.replace(/[^\d]/g, '');

    if (digits.startsWith(countryCode)) {
      return digits;
    }

    if (digits.startsWith('0')) {
      return `${countryCode}${digits.substring(1)}`;
    }

    if (digits.length === 9 && countryCode === '224') {
      return `${countryCode}${digits}`;
    }

    return digits.length > 0 ? digits : null;
  }

  private clearCachedToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.cachedClientId = null;
    this.cachedClientSecret = null;
  }
}

function buildBasicAuthPreview(clientId: string, clientSecret: string): string {
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  if (encoded.length <= 8) {
    return encoded;
  }
  return `${encoded.slice(0, 4)}…${encoded.slice(-4)}`;
}

export const orangeSmsService = new OrangeSmsService();
