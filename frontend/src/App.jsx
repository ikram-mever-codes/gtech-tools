import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./Components/Footer/Footer";
import Header from "./Components/Header/Header";
import Home from "./Pages/Home/Home";
import WrongCredentials from "./Pages/WrongCredentials/WrongCredentials";
import ProtectedRoute, { getAuthWithExpiry } from "./ProtectedRoute";
import CreateCategory from "./Pages/Category/CreateCategory";
import CreateShop from "./Pages/Shop/CreateShop";
import AllShops from "./Pages/Shop/AllShops";
import AllCategories from "./Pages/Category/AllCategories";
import ProductsPage from "./Pages/Products/ProductsPage";
import ProductDetails from "./Pages/Products/ProductDetails";
import CreateClassification from "./Pages/Classification/CreateClassification";
import AllClassifications from "./Pages/Classification/AllClassification";
import SubClass from "./Pages/Classification/SubClass";

const App = () => {
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const storedAuth = getAuthWithExpiry();
    if (storedAuth === null) {
      setAuth(false);
    } else {
      setAuth(storedAuth);
    }
  }, []);

  return (
    <div className="main">
      <Router>
        {auth && <Header />}
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/wrong-credentials" element={<WrongCredentials />} />
          {/* Category Routes */}
          <Route path="/category/create" element={<CreateCategory />} />
          <Route path="/category" element={<AllCategories />} />
          {/* Shop Routes */}
          <Route path="/shop/create" element={<CreateShop />} />{" "}
          <Route path="/shop" element={<AllShops />} />
          {/* Product Pages  */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          {/* Classification Pages */}
          <Route
            path="/classifications/create"
            element={<CreateClassification />}
          />
          <Route path="/classifications" element={<AllClassifications />} />
          <Route path="/classifications/subclass/:id" element={<SubClass />} />
        </Routes>
        {auth && <Footer />}
      </Router>
    </div>
  );
};

export default App;
