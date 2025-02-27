import { toast } from "react-toastify";
import api, { handleApiError } from "./api";
import { loadingStyles, successStyles } from "../libs/constants";

export const createCategory = async (categoryData) => {
  try {
    toast.loading("Creating Category...", loadingStyles);

    const res = await api.post("/category/create", categoryData);
    const data = res.data;
    toast.dismiss();
    toast.success(data.message, successStyles);
    return data;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const getAllCategories = async () => {
  try {
    const res = await api.get("/category/all");
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getCategoryById = async (id) => {
  try {
    const res = await api.get(`/category/${id}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    toast.loading("Updating Category...", loadingStyles);

    const res = await api.put(`/category/${id}`, categoryData);
    const data = res.data;
    toast.dismiss();
    toast.success(data.message, successStyles);
    return data;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const deleteCategory = async (id) => {
  try {
    toast.loading("Deleting Category...", loadingStyles);

    const res = await api.delete(`/category/${id}`);
    const data = res.data;
    toast.dismiss();
    toast.success(data.message, successStyles);
    return data;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const addUrlsToCategory = async (id, urls) => {
  try {
    toast.loading("Adding URLs to Category...", loadingStyles);

    const res = await api.post(`/category/${id}/urls`, { urls });
    const data = res.data;
    toast.dismiss();
    toast.success(data.message, successStyles);
    return data;
  } catch (error) {
    toast.dismiss();
    handleApiError(error);
  }
};

export const getCategoriesByShopId = async (shopId) => {
  try {
    const res = await api.get(`/category/all?shopId=${shopId}`);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};
