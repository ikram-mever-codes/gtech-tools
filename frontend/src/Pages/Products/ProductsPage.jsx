import React, { useEffect, useState } from "react";
import { getAllProducts } from "../../apis/product";
import Loading from "../../Components/Loading";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Filter, ChevronDown } from "lucide-react";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        if (data.success) {
          setProducts(data.data);
          setFilteredProducts(data.data);
          // Extract unique categories from products
          const uniqueCategories = [
            ...new Set(
              data.data
                .filter((product) => product.category)
                .map((product) => product.category)
            ),
          ];
          setCategories(uniqueCategories);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category?.id === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const getFirstPrice = (combinations) => {
    try {
      if (!combinations) return "N/A";
      const combinationsArray = Array.isArray(combinations)
        ? combinations
        : JSON.parse(combinations);
      if (!combinationsArray.length) return "N/A";
      return combinationsArray[0].price || "N/A";
    } catch (error) {
      console.error("Error parsing combinations:", error);
      return "N/A";
    }
  };

  const getFirstCombinationAttributes = (combinations) => {
    try {
      if (!combinations) return [];
      const combinationsArray = Array.isArray(combinations)
        ? combinations
        : JSON.parse(combinations);
      if (!combinationsArray.length) return [];
      const firstComb = combinationsArray[0];
      const attributes = [];
      if (firstComb.attribute1) attributes.push(firstComb.attribute1);
      if (firstComb.attribute2) attributes.push(firstComb.attribute2);
      if (firstComb.attribute3) attributes.push(firstComb.attribute3);
      if (firstComb.attribute4) attributes.push(firstComb.attribute4);
      if (firstComb.attribute5) attributes.push(firstComb.attribute5);
      return attributes;
    } catch (error) {
      console.error("Error parsing combination attributes:", error);
      return [];
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  const getNumberOfAttributes = (combinations) => {
    try {
      if (!combinations) return 0;
      const combinationsArray = Array.isArray(combinations)
        ? combinations
        : JSON.parse(combinations);
      if (!combinationsArray.length) return 0;
      const firstComb = combinationsArray[0];
      let count = 0;
      if (firstComb.attribute1) count++;
      if (firstComb.attribute2) count++;
      if (firstComb.attribute3) count++;
      if (firstComb.attribute4) count++;
      if (firstComb.attribute5) count++;
      return count;
    } catch (error) {
      console.error("Error parsing combination attributes:", error);
      return 0;
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8 font-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Header with Search Bar */}
        <div className="mb-8 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter - Desktop */}
            <div className="hidden lg:flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
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
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden space-y-4 p-4 bg-white rounded-lg shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600">
            Showing {filteredProducts.length} products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white cursor-pointer rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
            >
              <div className="relative aspect-square">
                <img
                  src={product.image || "/api/placeholder/400/400"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.isAssociated && (
                  <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                    Associated
                  </span>
                )}
                <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-bold font-medium bg-primary text-white">
                  {getNumberOfAttributes(product.combinations)} Attributes
                </span>
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14">
                  {product.title}
                </h2>
                <div className="mb-4">
                  <p className="text-xl font-bold text-primary">
                    ¥{getFirstPrice(product.combinations)}
                  </p>
                  <p className="text-xs text-gray-500">
                    First combination price
                  </p>
                </div>
                {getFirstCombinationAttributes(product.combinations).length >
                  0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {getFirstCombinationAttributes(product.combinations).map(
                      (attr, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {attr}
                        </span>
                      )
                    )}
                  </div>
                )}
                {product.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category.name}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a
                    href={`/products/${product.id}`}
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors duration-200"
                  >
                    View
                  </a>
                  <button
                    onClick={() => navigate(`/?productId=${product.id}`)}
                    className="inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-primary border border-primary hover:bg-primary/10 rounded-lg transition-colors duration-200"
                  >
                    Compare
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No products found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters to find what you're looking
              for
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
