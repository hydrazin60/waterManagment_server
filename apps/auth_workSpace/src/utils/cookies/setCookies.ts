import { Response } from "express";
export const setCookies = (res: Response, token: string, value: string) => {
  res.cookie(token, value, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 1 * 24 * 60 * 60 * 1000,
  });
};
