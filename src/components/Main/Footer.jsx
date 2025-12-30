const Footer = () => {
  return (
    <footer className="bg-white shadow-md text-center p-4 mt-8">
      <p className="text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} ZohoOCR. All rights reserved.
      </p>
    </footer>
  );
};
export default Footer;
