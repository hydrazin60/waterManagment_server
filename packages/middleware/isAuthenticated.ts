import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  type: string;
  email: string;
  customerType?: string;
  roleInCompany?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: DecodedToken;
  }
}

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      const bearerToken =
        typeof authHeader === "string" ? authHeader.split(" ")[1] : undefined;
      if (!bearerToken) {
        return res.status(401).json({
          success: false,
          message: "Authentication token missing",
        });
      }
    }
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT_SECRET_KEY is not configured");
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    ) as DecodedToken;

    if (!decodedToken?.id || !decodedToken?.type) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    req.user = {
      id: decodedToken.id,
      type: decodedToken.type,
      email: decodedToken.email,
      ...(decodedToken.customerType && {
        customerType: decodedToken.customerType,
      }),
      ...(decodedToken.roleInCompany && {
        roleInCompany: decodedToken.roleInCompany,
      }),
    };

    return next();
  } catch (error: unknown) {
    console.error(
      "Authentication error:",
      error instanceof Error ? error.message : String(error)
    );

    const response = {
      success: false,
      message: "Authentication failed",
    };

    if (error instanceof jwt.TokenExpiredError) {
      response.message = "Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      response.message = "Invalid token format";
    }

    return res.status(401).json(response);
  }
};
