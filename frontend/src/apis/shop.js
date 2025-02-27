import { toast } from "react-toastify";
import api, { handleApiError } from "./api";

export const createShop = async (data) => {
  try {
    const res = await api.post("/shop/create", { ...data });
    toast.success(res.data.message);
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAllShops = async () => {
  try {
    const res = await api.get("/shop/all");
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};
