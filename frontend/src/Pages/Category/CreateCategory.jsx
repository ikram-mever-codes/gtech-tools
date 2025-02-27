import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Tag,
  Link as LinkIcon,
  Store,
  Save,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { createCategory } from "../../apis/category";
import { useNavigate } from "react-router-dom";
import { getAllShops } from "../../apis/shop";
import Loading from "../../Components/Loading";

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Name is required"),
  link: Yup.string().url("Must be a valid URL").nullable(),
  shopId: Yup.number()
    .required("Shop selection is required")
    .positive("Shop selection is required"),
  urls: Yup.array().of(Yup.string().url("Must be a valid URL")).nullable(),
});

// Fixed ShopSelect Component
const ShopSelect = ({ field, form, shops, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setFieldValue } = form;
  const selectedShop = shops.find((shop) => shop.id === Number(field.value));

  const handleSelect = (shop) => {
    setFieldValue(field.name, shop.id);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".shop-select-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative shop-select-container">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl border text-left flex items-center justify-between ${
          form.errors.shopId && form.touched.shopId
            ? "border-red-300 bg-red-50"
            : "border-gray-200 hover:border-gray-300"
        } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200`}
      >
        <div className="flex items-center">
          {selectedShop ? (
            <>
              <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center mr-2">
                <Store className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-gray-900">{selectedShop.shopName}</span>
            </>
          ) : (
            <span className="text-gray-500">Select a shop</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-100 shadow-lg py-1 max-h-60 overflow-auto">
          {shops.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => handleSelect(shop)}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center ${
                field.value === shop.id ? "bg-gray-50" : ""
              }`}
            >
              <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center mr-2">
                <Store className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {shop.shopName}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {shop.shopURL}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateCategory = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const initialValues = {
    name: "",
    link: "",
    shopId: "",
    urls: [],
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const data = await createCategory(values);
      if (data.success) {
        navigate("/category");
        resetForm();
      }
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await getAllShops();
        if (data.success) {
          setShops(data.data);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="w-[1000px] min-h-screen bg-gray-50/30 font-poppins p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Create New Category
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Fill in the details below to create a new category
            </p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="flex items-center text-sm font-medium text-gray-800"
                  >
                    <Tag
                      className="w-4 h-4 mr-2 text-primary/90"
                      strokeWidth={2.5}
                    />
                    Category Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      type="text"
                      name="name"
                      className={`w-full px-4 py-2.5 rounded-xl border ${
                        errors.name && touched.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200`}
                      placeholder="Enter category name"
                    />
                    {errors.name && touched.name && (
                      <div className="absolute right-3 top-2.5 text-red-500">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {errors.name && touched.name && (
                    <div className="flex items-center text-red-500 text-sm mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                      {errors.name}
                    </div>
                  )}
                </div>

                {/* Link Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="link"
                    className="flex items-center text-sm font-medium text-gray-800"
                  >
                    <LinkIcon
                      className="w-4 h-4 mr-2 text-primary/90"
                      strokeWidth={2.5}
                    />
                    Category Link
                  </label>
                  <div className="relative">
                    <Field
                      type="text"
                      name="link"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="https://example.com/category"
                    />
                    {errors.link && touched.link && (
                      <div className="absolute right-3 top-2.5 text-red-500">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {errors.link && touched.link && (
                    <div className="flex items-center text-red-500 text-sm mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                      {errors.link}
                    </div>
                  )}
                </div>

                {/* Shop Select Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="shopId"
                    className="flex items-center text-sm font-medium text-gray-800"
                  >
                    <Store
                      className="w-4 h-4 mr-2 text-primary/90"
                      strokeWidth={2.5}
                    />
                    Select Shop
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Field name="shopId" component={ShopSelect} shops={shops} />
                  {errors.shopId && touched.shopId && (
                    <div className="flex items-center text-red-500 text-sm mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                      {errors.shopId}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-primary/10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Creating..." : "Create Category"}
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

export default CreateCategory;
