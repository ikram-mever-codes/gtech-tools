import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
} from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b w-full border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="header-logo">
          <Link to="/" className="flex items-center">
            <img src="/gtech.png" alt="G Tech Logo" className="h-10 w-max" />
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 flex justify-center">
          <ul className="flex space-x-8">
            <li>
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/products"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                Products
              </Link>
            </li>
            <li>
              <Link
                to="/classifications"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Classificatitons
              </Link>
            </li>
            <li>
              <Link
                to="/category"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Categories
              </Link>
            </li>
            <li>
              <Link
                to="/shop"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Shops{" "}
              </Link>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <div>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
