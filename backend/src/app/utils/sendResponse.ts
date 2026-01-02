import { Response } from 'express';

type IApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  data: T;
};

const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
  const responseData: IApiResponse<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || undefined,
    data: data.data,
  };

  if (data.meta) {
    responseData.meta = data.meta;
  }

  res.status(data.statusCode).json(responseData);
};

export { sendResponse };