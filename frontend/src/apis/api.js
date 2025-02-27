import axios from "axios";
import { toast } from "react-toastify";
import { errorStyles } from "../libs/constants";

// Create an Axios instance
const api = axios.create({
  baseURL: "https://api.gtech-tools.com/api/v1",
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const handleApiError = (error) => {
  let errorMessage = "Something went wrong. Please try again later.";

  if (error.response) {
    if (error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.response.status) {
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
    }
  } else if (error.request) {
    errorMessage = "No response from the server. Please check your network.";
  } else {
    errorMessage = error.message;
  }

  toast.error(errorMessage, errorStyles);

  return errorMessage;
};

export default api;
