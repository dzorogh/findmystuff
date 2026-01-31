import {
  createIconErrorResponse,
  createIconResponse
} from "@/lib/shared/og/icon-image";

export const  size = {
  width: 512,
  height: 512,
};

export const GET = async () => {
  try {
    return createIconResponse(size);
  } catch (error) {
    return createIconErrorResponse(error);
  }
};