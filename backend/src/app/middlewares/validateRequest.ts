import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";
import { catchAsync } from "../utils/catchAsync";

const validateRequest = (schema: AnyZodObject | ZodEffects<AnyZodObject>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsedData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });

    // Update request with parsed data only when present.
    // Some schemas validate only body and do not include params/query/cookies.
    if (parsedData.body !== undefined) req.body = parsedData.body;
    if (parsedData.query !== undefined) req.query = parsedData.query;
    if (parsedData.params !== undefined) req.params = parsedData.params;
    if (parsedData.cookies !== undefined) req.cookies = parsedData.cookies;

    // console.log("Validated and parsed request data:", {
    //   body: req.body,
    //   query: req.query,
    //   params: req.params,
    // });

    next();
  });
};

export { validateRequest };
