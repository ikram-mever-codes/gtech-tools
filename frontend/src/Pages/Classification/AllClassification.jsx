import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Package,
  Layers,
  Filter,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  Grid,
  List,
} from "lucide-react";
import {
  getAllClassifications,
  deleteClassification,
  getProductsBySubClass,
} from "../../apis/classifications";

const SubClassCard = ({ subClass, classificationName }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/classifications/subclass/${subClass.id}`)}
      className="group cursor-pointer bg-white rounded-xl p-4 border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
          <span className="text-xs font-medium text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">
            Sub-class
          </span>
        </div>
        <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
        {subClass.name}
      </h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {subClass.description || "No description provided"}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {subClass.productCount} Products
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">
            {subClass.numberOfAttributes || 0} Attributes
          </span>
          <span className="text-xs text-gray-400">{classificationName}</span>
        </div>
      </div>
    </div>
  );
};

const ClassificationCard = ({
  classification,
  onDelete,
  onEdit,
  expanded,
  onToggle,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {classification.name}
              </h2>
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                Classification
              </span>
            </div>
            <p className="text-gray-600 line-clamp-2">
              {classification.description || "No description provided"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Sub-classes</div>
            <div className="text-2xl font-bold text-gray-900">
              {classification.subClasses.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Total Products</div>
            <div className="text-2xl font-bold text-gray-900">
              {classification.totalProducts}
            </div>
          </div>
          <div className="hidden sm:block bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Status</div>
            <div className="text-lg font-semibold text-primary">
              {classification.subClasses.length > 0 ? "Active" : "Empty"}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-full flex items-center justify-center px-4 py-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
        >
          {expanded ? "Hide" : "View"} Sub-classes
          <ChevronRight
            className={`w-4 h-4 ml-1 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {expanded && (
        <div className="p-6 border-t border-gray-100">
          {classification.subClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classification.subClasses.map((subClass) => (
                <SubClassCard
                  key={subClass.id}
                  subClass={subClass}
                  classificationName={classification.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No sub-classes found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AllClassifications = () => {
  const navigate = useNavigate();
  const [classifications, setClassifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [viewMode, setViewMode] = useState("grid");
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [filters, setFilters] = useState({
    minSubClasses: "",
    maxSubClasses: "",
    minProducts: "",
    maxProducts: "",
  });

  useEffect(() => {
    fetchClassifications();
  }, []);

  const fetchClassifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllClassifications();

      if (response?.data) {
        const classificationsWithProducts = await Promise.all(
          response.data.map(async (classification) => {
            try {
              const subClassesWithProducts = await Promise.all(
                classification.subClasses.map(async (subClass) => {
                  try {
                    const products = await getProductsBySubClass(subClass.id);
                    return {
                      ...subClass,
                      productCount: products?.data?.length || 0,
                    };
                  } catch (error) {
                    console.error(
                      `Error fetching products for subclass ${subClass.id}:`,
                      error
                    );
                    return { ...subClass, productCount: 0 };
                  }
                })
              );

              return {
                ...classification,
                subClasses: subClassesWithProducts,
                totalProducts: subClassesWithProducts.reduce(
                  (sum, subClass) => sum + (subClass.productCount || 0),
                  0
                ),
              };
            } catch (error) {
              console.error(
                `Error processing classification ${classification.id}:`,
                error
              );
              return classification;
            }
          })
        );

        setClassifications(classificationsWithProducts);
      }
    } catch (error) {
      setError("Failed to fetch classifications");
      console.error("Error fetching classifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this classification?")
    ) {
      try {
        setDeleteLoading(id);
        setError(null);
        await deleteClassification(id);
        setClassifications((prevClassifications) =>
          prevClassifications.filter(
            (classification) => classification._id !== id
          )
        );
      } catch (error) {
        setError("Failed to delete classification");
        console.error("Error deleting classification:", error);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minSubClasses: "",
      maxSubClasses: "",
      minProducts: "",
      maxProducts: "",
    });
    setSearchTerm("");
  };

  const filteredClassifications = classifications.filter((classification) => {
    const matchesSearch = classification.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilters =
      (!filters.minSubClasses ||
        classification.subClasses.length >= Number(filters.minSubClasses)) &&
      (!filters.maxSubClasses ||
        classification.subClasses.length <= Number(filters.maxSubClasses)) &&
      (!filters.minProducts ||
        classification.totalProducts >= Number(filters.minProducts)) &&
      (!filters.maxProducts ||
        classification.totalProducts <= Number(filters.maxProducts));

    return matchesSearch && matchesFilters;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading classifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[1400px] min-h-screen py-8 px-4 max-w-[1400px] mx-auto">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm mb-8 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product Classifications
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate("/classifications/create")}
              className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              New Classification
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search classifications..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-primary"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Filter Classifications
              </h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Sub-Classes
                </label>
                <input
                  type="number"
                  name="minSubClasses"
                  value={filters.minSubClasses}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Sub-Classes
                </label>
                <input
                  type="number"
                  name="maxSubClasses"
                  value={filters.maxSubClasses}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Products
                </label>
                <input
                  type="number"
                  name="minProducts"
                  value={filters.minProducts}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Products
                </label>
                <input
                  type="number"
                  name="maxProducts"
                  value={filters.maxProducts}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Classifications Display */}
      <div className={viewMode === "grid" ? "space-y-6" : "space-y-4"}>
        {filteredClassifications.length === 0 ? (
          <div className="text-center bg-white rounded-xl shadow-sm p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6">
              <Layers className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No classifications found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || Object.values(filters).some(Boolean)
                ? "Try adjusting your search or filters"
                : "Get started by creating your first classification"}
            </p>
            <button
              onClick={() => navigate("/classifications/create")}
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Classification
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 gap-6" : "space-y-4"
            }
          >
            {filteredClassifications.map((classification) => (
              <ClassificationCard
                key={classification._id}
                classification={classification}
                onDelete={() => handleDelete(classification._id)}
                onEdit={() =>
                  navigate(
                    `/classifications/create?classificationId=${classification.id}`
                  )
                }
                expanded={expandedCards.has(classification._id)}
                onToggle={() => {
                  const newExpanded = new Set(expandedCards);
                  if (newExpanded.has(classification._id)) {
                    newExpanded.delete(classification._id);
                  } else {
                    newExpanded.add(classification._id);
                  }
                  setExpandedCards(newExpanded);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Success Toast - Optional */}
      {deleteLoading && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Deleting classification...</span>
        </div>
      )}
    </div>
  );
};

export default AllClassifications;
