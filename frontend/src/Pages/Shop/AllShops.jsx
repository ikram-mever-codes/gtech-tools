import React, { useEffect, useState } from "react";
import {
  MoreVertical,
  Store,
  Pencil,
  Trash2,
  ExternalLink,
  Info,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAllShops } from "../../apis/shop";

// Sample data - replace with your actual data

const ShopCard = ({ shop }) => {
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();
  const handleDelete = (id) => {
    console.log("Delete shop:", id);
  };

  const handleUpdate = (id) => {
    console.log("Update shop:", id);
  };

  const handleDetails = (id) => {
    console.log("View details:", id);
  };

  const handleRedirect = (url) => {
    window.open(url, "_blank");
  };
  const handleViewCat = (id) => {
    navigator(`/category?shopId=${id}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {shop.f ? (
              <img
                src={shop.shopLogo}
                alt={shop.shopName}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{shop.shopName}</h3>
              <a
                href={shop.shopURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-primary truncate max-w-[200px] block"
              >
                {shop.shopURL}
              </a>
            </div>
          </div>

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
                  onClick={() => handleUpdate(shop.id)}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Shop
                </button>
                <button
                  onClick={() => handleDetails(shop.id)}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Info className="w-4 h-4 mr-2" />
                  View Details
                </button>{" "}
                <Link
                  to={`/category?shopId=${shop.id}`}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Info className="w-4 h-4 mr-2" />
                  View Categories
                </Link>
                <button
                  onClick={() => handleRedirect(shop.shopURL)}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Shop
                </button>
                <button
                  onClick={() => handleDelete(shop.id)}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Shop
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats or Additional Info */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-lg font-medium text-gray-900">12</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500">Products</p>
            <p className="text-lg font-medium text-gray-900">234</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AllShops = () => {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await getAllShops();
      if (data.success) {
        setShops(data.data);
      }
    };
    fetch();
  }, []);
  return (
    <div className="w-[1140px] min-h-screen bg-gray-50/30 my-[3rem] font-poppins p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            All Shops
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and monitor all your shops
          </p>
        </div>

        <Link
          to={"/shop/create"}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors duration-200 shadow-sm shadow-primary/10"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Shop
        </Link>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-2 gap-6">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>

      {/* Empty State */}
      {shops.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No shops yet
          </h3>
          <p className="text-gray-500">
            Get started by creating your first shop
          </p>
        </div>
      )}
    </div>
  );
};

export default AllShops;
