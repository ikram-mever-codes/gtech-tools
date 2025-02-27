import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MoreVertical,
  Tag,
  Pencil,
  Trash2,
  ExternalLink,
  Store,
  Plus,
  ArrowLeft,
  Link as LinkIcon,
  Boxes,
  Clock,
} from "lucide-react";
import { deleteCategory, getAllCategories } from "../../apis/category";
import Loading from "../../Components/Loading";

const CategoryCard = ({ category }) => {
  const [showOptions, setShowOptions] = React.useState(false);

  const handleDelete = async (id) => {
    const cfs = confirm("Do you want to delete this category ?");
    if (!cfs) return;
    const data = await deleteCategory(id);
  };

  const handleUpdate = (id) => {
    console.log("Update category:", id);
  };

  const handleViewProducts = (id) => {
    console.log("View products:", id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              <a
                href={category.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-primary truncate max-w-[200px] block"
              >
                {category.link}
              </a>
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                <button
                  onClick={() => handleUpdate(category.id)}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Category
                </button>
                <button
                  onClick={() => handleViewProducts(category.id)}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Boxes className="w-4 h-4 mr-2" />
                  View Products
                </button>
                <button
                  onClick={() => window.open(category.link, "_blank")}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Category
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Category
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500">Products</p>
            </div>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {category?.products?.length || 0}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500">URLs</p>
            </div>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {JSON.parse(category.urls).length || 0}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500">Last Scan</p>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {new Date(category.last_scrapped).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AllCategories = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");
  const [categories, setCatgories] = useState([]);
  const [loading, setLoading] = useState(true);
  // Sample data - replace with your actual data
  const shopData = {
    id: shopId,
    name: "Fashion Store",
    totalCategories: 12,
  };

  useEffect(() => {
    // if (!shopId) {
    //   navigate("/");
    //   return;
    // }
    const fetch = async () => {
      try {
        const data = await getAllCategories();
        if (data.success) {
          setCatgories(data.data);
        }
      } catch (error) {
        console.log(error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shopId, navigate]);

  // if (!shopId) return null;
  if (loading) return <Loading />;

  return (
    <div className="w-[1140px] min-h-screen  my-[3rem] font-poppins p-8">
      {/* Header Section with Shop Context */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/shops")}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back to Shops</span>
        </button>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Categories for LinkCnc
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Managing {categories.length} categories
              </p>
            </div>
          </div>

          <Link
            to={"/category/create"}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors duration-200 shadow-sm shadow-primary/10"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Category
          </Link>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No categories yet
          </h3>
          <p className="text-gray-500">
            Create your first category to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default AllCategories;
