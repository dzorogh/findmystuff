import {
  createIconErrorResponse,
  createIconResponse,
  iconSizes,
} from "@/lib/icon-image";

export const size = iconSizes.sm;

export const GET = async () => {
  try {
    return createIconResponse(size);
  } catch (error) {
    return createIconErrorResponse(error);
  }
};