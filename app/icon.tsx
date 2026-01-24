import { createIconResponse, iconSizes } from "@/lib/icon-image";

export const size = iconSizes.lg;

export const contentType = "image/png";

const Icon = () => {
  return createIconResponse(size);
};

export default Icon;
