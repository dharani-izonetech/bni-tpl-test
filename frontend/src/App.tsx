import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

const App = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);

export default App;
