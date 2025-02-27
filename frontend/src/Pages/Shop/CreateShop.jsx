import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Store, Globe, Upload, AlertCircle, Save } from "lucide-react";
import { createShop } from "../../apis/shop";

const validationSchema = Yup.object().shape({
  shopName: Yup.string()
    .min(2, "Shop name must be at least 2 characters")
    .max(50, "Shop name must be less than 50 characters")
    .required("Shop name is required"),
  shopURL: Yup.string()
    .url("Must be a valid URL")
    .required("Shop URL is required"),
  shopLogo: Yup.string().nullable(),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CreateShop = () => {
  const [previewLogo, setPreviewLogo] = useState(null);
  const [fileError, setFileError] = useState("");

  const initialValues = {
    shopName: "",
    shopURL: "",
    shopLogo: null,
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLogoChange = async (e, setFieldValue) => {
    const file = e.target.files[0];
    setFileError("");

    if (file) {
      // Check file type
      if (!file.type.match(/image\/(png|jpg|jpeg)/i)) {
        setFileError("Please upload a PNG or JPG file");
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError("File size must be less than 5MB");
        return;
      }

      try {
        const base64Image = await convertToBase64(file);
        setFieldValue("shopLogo", base64Image);
        setPreviewLogo(base64Image);
      } catch (error) {
        console.error("Error converting image:", error);
        setFileError("Error processing image. Please try again.");
      }
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const data = await createShop(values);
      if (data.success) {
        resetForm();
        setPreviewLogo(null);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[1140px] min-h-screen bg-gray-50/30 font-poppins p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Create New Shop
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your shop details below to create a new shop
            </p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, setFieldValue }) => (
              <Form className="space-y-6">
                {/* Shop Logo Upload */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-800">
                    <Store
                      className="w-4 h-4 mr-2 text-primary/90"
                      strokeWidth={2.5}
                    />
                    Shop Logo
                  </label>
                  <div
                    onClick={() => {
                      document.querySelector("#picker").click();
                    }}
                    className="mt-1 cursor-pointer  flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed hover:border-primary/50 rounded-xl transition-colors duration-200"
                  >
                    <div className="space-y-2 text-center">
                      {previewLogo ? (
                        <div className="mx-auto w-24 h-24 relative group">
                          <img
                            src={previewLogo}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <p className="text-white text-xs">Change Logo</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mx-auto h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none">
                          <span>Upload a logo</span>
                          <input
                            id="picker"
                            type="file"
                            name="shopLogo"
                            className="sr-only"
                            onChange={(e) => handleLogoChange(e, setFieldValue)}
                            accept="image/png,image/jpeg,image/jpg"
                          />
                        </label>
                      </div>
                      {fileError ? (
                        <p className="text-xs text-red-500 mt-1">{fileError}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shop Name Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="shopName"
                    className="flex items-center text-sm font-medium text-gray-800"
                  >
                    <Store
                      className="w-4 h-4 mr-2 text-primary/90"
                      strokeWidth={2.5}
                    />
                    Shop Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      type="text"
                      name="shopName"
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        errors.shopName && touched.shopName
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200`}
                      placeholder="Enter shop name"
                    />
                    {errors.shopName && touched.shopName && (
                      <div className="absolute right-3 top-2.5 text-red-500">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {errors.shopName && touched.shopName && (
                    <div className="flex items-center text-red-500 text-sm mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                      {errors.shopName}
                    </div>
                  )}
                </div>

                {/* Shop URL Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="shopURL"
                    className="flex items-center text-sm font-medium text-gray-800"
                  >
                    <Globe
                      className="w-4 h-4 mr-2 text-primary/90"
                      strokeWidth={2.5}
                    />
                    Shop URL
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      type="text"
                      name="shopURL"
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        errors.shopURL && touched.shopURL
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200`}
                      placeholder="https://example.com"
                    />
                    {errors.shopURL && touched.shopURL && (
                      <div className="absolute right-3 top-2.5 text-red-500">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {errors.shopURL && touched.shopURL && (
                    <div className="flex items-center text-red-500 text-sm mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                      {errors.shopURL}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-solid border-text hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-primary/10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Creating..." : "Create Shop"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default CreateShop;
