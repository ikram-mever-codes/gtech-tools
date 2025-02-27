import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  Package,
  Plus,
  Minus,
  Loader2,
  AlertTriangle,
  Layers,
  CheckCircle,
  Grid,
  ArrowRight,
  ArrowUpDown,
  Trash2,
  Info,
} from "lucide-react";
import {
  getProductsBySubClass,
  addProductsToSubClass,
  removeProductsFromSubClass,
  getSingleClassification,
  deleteClassification,
  getSingleSubClass,
} from "../../apis/classifications";
import { getAllProducts } from "../../apis/product";

const SubClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const [classification, setClassification] = useState(null);
  const [subClassDetails, setSubClassDetails] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [subClassProducts, setSubClassProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch subclass products
      const subClassResponse = await getProductsBySubClass(id);
      if (subClassResponse?.data) {
        setSubClassProducts(subClassResponse.data);
        setSelectedProducts(subClassResponse.data.map((product) => product.id));
      }

      // Fetch all products
      const productsResponse = await getAllProducts();
      if (productsResponse?.data) {
        setAllProducts(productsResponse.data);
        const uniqueCategories = [
          ...new Set(
            productsResponse.data
              .filter((product) => product.category)
              .map((product) => product.category)
          ),
        ];
        setCategories(uniqueCategories);
      }
      const subClassRespons = await getSingleSubClass(id);
      if (subClassRespons?.data) {
        setSubClassDetails(subClassRespons.data);

        const classificationResponse = await getSingleClassification(
          subClassRespons.data?.classificationId
        );
        if (classificationResponse?.data) {
          setClassification(classificationResponse.data);
        }
      }
    } catch (error) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleProductSelection = async (productId) => {
    try {
      setSaving(true);
      const isSelected = selectedProducts.includes(productId);

      if (isSelected) {
        await removeProductsFromSubClass(id, [productId]);
        setSelectedProducts((prev) => prev.filter((id) => id !== productId));
      } else {
        await addProductsToSubClass(id, { productIds: [productId] });
        setSelectedProducts((prev) => [...prev, productId]);
      }
    } catch (error) {
      setError(
        isSelected ? "Failed to remove product" : "Failed to add product"
      );
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading subclass details...</span>
        </div>
      </div>
    );
  }
  const handleDeleteSubClass = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this subclass? This action cannot be undone."
      )
    ) {
      try {
        setLoading(true);
        await deleteClassification(id);
        navigate(`/classifications/${classification?.id}`);
      } catch (error) {
        setError("Failed to delete subclass");
      }
    }
  };

  return (
    <div className="min-h-screen my-[3rem]">
      {/* Enhanced Info Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-4 flex items-center text-sm text-gray-500">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Link to="/classifications" className="hover:text-primary">
              Classifications
            </Link>
            <ArrowRight className="w-4 h-4 mx-2" />
            <Link
              to={`/classification/${classification?.id}`}
              className="hover:text-primary"
            >
              {classification?.name}
            </Link>
            <ArrowRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">
              {subClassDetails?.name}
            </span>
          </div>

          {/* Enhanced SubClass Details */}
          <div className="py-8">
            <div className="flex justify-between items-start">
              {/* Left side - Info */}
              <div className="flex-1 pr-8">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {subClassDetails?.name}
                  </h1>
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Subclass
                  </div>
                </div>

                <p className="text-gray-600 text-lg mb-6">
                  {subClassDetails?.description || "No description provided"}
                </p>

                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Total Products
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedProducts.length}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Layers className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Parent Classification
                      </span>
                    </div>
                    <p className="text-lg font-medium text-gray-900 truncate">
                      {classification?.name}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Info className="w-4 h-4" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedProducts.length > 0 ? "Active" : "Empty"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    onClick={() => {
                      return navigate(`/?subClassId=${subClassDetails.id}`);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
                  >
                    <ArrowUpDown className="w-5 h-5 mr-2" />
                    Compare Subclass
                  </button>

                  <button
                    onClick={() => handleDeleteSubClass()}
                    className="inline-flex items-center px-6 py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Subclass
                  </button>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Layers className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProductSelection(product.id)}
                  className={`relative bg-white rounded-xl overflow-hidden group cursor-pointer
                    transform transition-all duration-200 hover:-translate-y-1
                    ${
                      isSelected
                        ? "ring-2 ring-primary shadow-lg"
                        : "border border-gray-200 hover:border-primary hover:shadow-md"
                    }`}
                >
                  <div className="relative aspect-square">
                    <img
                      src={product.image || "/api/placeholder/400/400"}
                      alt={product.title}
                      className={`w-full h-full object-cover transition-all duration-200
                        ${
                          isSelected ? "opacity-90" : "group-hover:opacity-90"
                        }`}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-white p-2 rounded-full">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    {product.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 bg-white rounded-lg transition-all duration-200
                    ${
                      isSelected
                        ? "ring-2 ring-primary shadow-md"
                        : "border border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <div className="relative w-20 h-20">
                    <img
                      src={product.image || "/api/placeholder/400/400"}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-900">
                      {product.title}
                    </h3>
                    {product.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleProductSelection(product.id)}
                    disabled={saving}
                    className={`p-2 rounded-lg transition-all duration-200
                      ${
                        isSelected
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isSelected ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory
                ? "Try adjusting your search or filters"
                : "Get started by adding products to this subclass"}
            </p>
            {searchTerm || selectedCategory ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 flex justify-between items-center border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600">
              {selectedProducts.length} of {filteredProducts.length} products
              selected
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  navigate(`/classifications/${classification?.id}`)
                }
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                View Classification
              </button>
            </div>
          </div>
        )}

        {/* Success Toast - Can be shown when products are added/removed successfully */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Updating products...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubClass;
