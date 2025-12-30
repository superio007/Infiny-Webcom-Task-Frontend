import React from "react";
import { Link } from "react-router-dom";
const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="text-xl font-bold text-amber-600">OCR</div>
        {/* <div>
          <Link to="/" className="text-gray-700 hover:text-amber-600 mx-2">
            Home
          </Link>
          <Link
            to="/upload"
            className="text-gray-700 hover:text-amber-600 mx-2"
          >
            Upload
          </Link>
        </div> */}
      </div>
    </nav>
  );
};

export default Navbar;
