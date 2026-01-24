import {
  createIconErrorResponse,
  createIconResponse
} from "@/lib/icon-image";

export const size = {
  width: 192,
  height: 192,
}

export const GET = async () => {
  try {
    return createIconResponse(size);
  } catch (error) {
    return createIconErrorResponse(error);
  }
};