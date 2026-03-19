import React from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Outlet } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.log("📍 Layout Mounting | Path:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen transition-colors duration-500 font-['Plus_Jakarta_Sans'] overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 px-8 py-12 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;
