import { TErrorSources, TGenericErrorResponse } from '../interface/error';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  // Extract value within double quotes using regex
  const match = err.message.match(/"([^"]*)"/)[1];

  const errorSources: TErrorSources = [
    {
      path: '',
      message: `${match} is already exists`,
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: 'Duplicate Entry',
    errorSources,
  };
};

export { handleDuplicateError };