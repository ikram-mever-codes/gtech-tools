import api, { handleApiError } from "./api";

export const getAllProducts = async () => {
  try {
    const res = await api.get(`/product/all`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getSingleProduct = async (productId) => {
  try {
    const res = await api.get(`/product/single/${productId}`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteProduct = async (productId) => {
  try {
    const res = await api.delete(`/product/${productId}`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};
