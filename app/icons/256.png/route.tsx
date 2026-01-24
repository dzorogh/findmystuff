import {
  createIconErrorResponse,
  createIconResponse
} from "@/lib/icon-image";

export const size = {
  width: 256,
  height: 256,
};

export const GET = async () => {
  try {
    return createIconResponse(size);
  } catch (error) {
    return createIconErrorResponse(error);
  }
};