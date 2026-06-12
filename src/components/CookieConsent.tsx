import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'dupido_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-[#0C0C0D] border border-[#1A1A1C] rounded-sm p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <Cookie className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-300 leading-relaxed">
                  We use cookies and automated payload telemetry to improve your experience, analyze usage patterns,
                  and ensure platform security. By continuing to use this service, you consent to our data practices
                  as described in our Privacy Policy.
                </p>
              </div>
              <button onClick={handleDecline} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-4 ml-9">
              <button onClick={handleDecline} className="px-4 py-2 text-xs font-medium text-slate-500 border border-[#1A1A1C] rounded-sm hover:border-slate-600 hover:text-slate-300 transition-all">
                Decline
              </button>
              <button onClick={handleAccept} className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-500 transition-colors">
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
