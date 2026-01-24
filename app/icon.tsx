import { createIconResponse } from "@/lib/icon-image";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

const Icon = () => {
  return createIconResponse(size);
};

export default Icon;
