import { Outlet } from "react-router-dom";
import Navbar from "../components/Main/Navbar.jsx";
import Footer from "../components/Main/Footer.jsx";

const MainLayout = () => {
  return (
    <main className="bg-amber-50 ">
      <Navbar />
      <Outlet />
      <Footer />
    </main>
  );
};

export default MainLayout;
