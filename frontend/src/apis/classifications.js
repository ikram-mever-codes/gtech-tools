import api, { handleApiError } from "./api";

// Get all classifications
export const getAllClassifications = async () => {
  try {
    const res = await api.get(`/classifications/all`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getSingleClassification = async (classificationId) => {
  try {
    const res = await api.get(`/classifications/single/${classificationId}`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getSingleSubClass = async (id) => {
  try {
    const res = await api.get(`/classifications/single/subclass/${id}`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createClassification = async (classificationData) => {
  try {
    const res = await api.post("/classifications", classificationData);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateClassification = async (classificationId, updateData) => {
  try {
    const res = await api.put(
      `/classifications/${classificationId}`,
      updateData
    );
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Delete classification
export const deleteClassification = async (classificationId) => {
  try {
    const res = await api.delete(`/classifications/${classificationId}`);
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Add products to subclass
export const addProductsToSubClass = async (subClassId, productsData) => {
  try {
    const res = await api.post(
      `/classifications/subclass/${subClassId}/products`,
      productsData
    );
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Remove products from subclass
export const removeProductsFromSubClass = async (subClassId, productIds) => {
  try {
    const res = await api.delete(
      `/classifications/subclass/${subClassId}/products`,
      {
        data: { productIds },
      }
    );
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getProductsBySubClass = async (subClassId) => {
  try {
    const res = await api.get(
      `/classifications/subclass/${subClassId}/products`
    );
    const data = res.data;
    return data;
  } catch (error) {
    handleApiError(error);
  }
};
