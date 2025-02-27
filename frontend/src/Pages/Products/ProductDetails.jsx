import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Link,
  Eye,
  Clock,
  RefreshCw,
  Loader2,
  ArrowRight,
  Trash2,
  Edit,
} from "lucide-react";
import { getSingleProduct, deleteProduct } from "../../apis/product";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const navigate = useNavigate();

  // Group attributes function
  const groupAttributes = (combinations) => {
    try {
      const parsedCombinations =
        typeof combinations === "string"
          ? JSON.parse(combinations)
          : combinations;

      const attributeTypes = {
        attribute1: new Set(),
        attribute2: new Set(),
        attribute3: new Set(),
        attribute4: new Set(),
        attribute5: new Set(),
      };

      parsedCombinations.forEach((combination) => {
        // Only add attributes that exist
        if (combination.attribute1)
          attributeTypes.attribute1.add(combination.attribute1);
        if (combination.attribute2)
          attributeTypes.attribute2.add(combination.attribute2);
        if (combination.attribute3)
          attributeTypes.attribute3.add(combination.attribute3);
        if (combination.attribute4)
          attributeTypes.attribute4.add(combination.attribute4);
        if (combination.attribute5)
          attributeTypes.attribute5.add(combination.attribute5);
      });

      // Only return attribute types that have values
      const filteredTypes = {};
      Object.entries(attributeTypes).forEach(([key, values]) => {
        if (values.size > 0) {
          filteredTypes[key] = Array.from(values).sort();
        }
      });

      return filteredTypes;
    } catch (error) {
      console.error("Error parsing combinations:", error);
      return {};
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getSingleProduct(id);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        navigate("/products");
        setError(err.message || "Failed to fetch product details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const formatPrice = (price) => {
    try {
      return parseFloat(price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (error) {
      return price;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-20 h-20 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || "No product found"}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const parsedCombinations = Array.isArray(product.combinations)
    ? product.combinations
    : JSON.parse(product.combinations);

  const attributeTypes = groupAttributes(parsedCombinations);
  const lowestPrice = parsedCombinations
    .reduce((min, combo) => Math.min(min, parseFloat(combo.price)), Infinity)
    .toFixed(2);
  return (
    <div className="max-w-7xl mx-auto p-8 font-poppins">
      {/* Admin Actions Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Product ID: #{id}
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              product.isAssociated
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {product.isAssociated ? "Associated" : "Not Associated"}
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/?productId=${product.id}`)}
            className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Compare Now
          </button>
          <button
            onClick={async () => {
              const cfs = confirm("Do you want to delete this products ?");
              if (!cfs) return;
              const data = await deleteProduct(product.id);
              if (data.success) {
                navigate("/products");
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full rounded-lg shadow-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
              >
                <Link className="w-5 h-5 text-gray-600" />
              </a>
            </div>
          </div>

          {/* Scraping Info */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Scraping Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Source URL</p>
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate max-w-[200px] inline-block"
                  >
                    View Source
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">
              {product.title}
            </h1>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  ¥{formatPrice(parsedCombinations[0].price)}
                </h2>
                <p className="text-sm text-gray-500">Starting from</p>
              </div>
            </div>
          </div>

          {/* Enhanced Attribute Selection */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Product Variants
              </h3>
              <span className="text-sm text-gray-500">
                {parsedCombinations.length} combinations
              </span>
            </div>

            {Object.entries(attributeTypes).map(([type, values]) => (
              <div key={type} className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </p>
                  <span className="text-xs text-gray-500">
                    {values.length} options
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {values.map((value) => (
                    <button
                      key={value}
                      onClick={() =>
                        setSelectedAttributes((prev) => ({
                          ...prev,
                          [type]: value,
                        }))
                      }
                      className={`px-4 py-3 text-gray-700 rounded-lg text-sm font-medium transition-all ${
                        selectedAttributes[type] === value
                          ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Price Matrix */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Price Matrix
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(attributeTypes).map((type) => (
                        <th
                          key={type}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedCombinations.map((combo, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.keys(attributeTypes).map((type) => (
                          <td
                            key={type}
                            className="px-4 py-3 text-sm text-gray-700"
                          >
                            {combo[type] || "-"}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          ¥{formatPrice(combo.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
