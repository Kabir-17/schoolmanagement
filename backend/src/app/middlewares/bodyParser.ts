import { catchAsync } from "../utils/catchAsync";

// Middleware to parse FormData (FoundX pattern + flat FormData support)
export const parseBody = catchAsync(async (req, res, next) => {

  // Handle FoundX pattern: data field with JSON string
  if (req.body && req.body.data) {
    try {
      req.body = JSON.parse(req.body.data);
    } catch (error) {
    }
  } else if (req.body) {
    // Handle flat FormData: convert parentInfo[name] to parentInfo.name
    const body = req.body;
    const parsedBody: any = {};

    for (const [key, value] of Object.entries(body)) {
      if (key.includes("[") && key.includes("]")) {
        // Handle nested keys like parentInfo[name]
        const match = key.match(/^([^[]+)\[([^\]]+)\]$/);
        if (match) {
          const [, parentKey, childKey] = match;
          if (!parsedBody[parentKey]) {
            parsedBody[parentKey] = {};
          }
          parsedBody[parentKey][childKey] = value;
        }
      } else {
        // Handle flat keys
        parsedBody[key] = value;
      }
    }

    // Merge flat keys and nested structures
    req.body = { ...body, ...parsedBody };
  }

  next();
});
