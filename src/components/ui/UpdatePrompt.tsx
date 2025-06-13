import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface UpdatePromptProps {
  className?: string;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ className = '' }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowPrompt(false);
  };

  if (!showPrompt && !offlineReady) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white dark:bg-darkContentBg border border-gray-200 dark:border-darkBorder rounded-lg shadow-lg p-4 max-w-sm">
        {offlineReady && (
          <div className="text-green-600 dark:text-green-400 mb-2">
            <i className="fas fa-check-circle mr-2"></i>
            應用程序已準備好離線使用
          </div>
        )}
        
        {needRefresh && (
          <div>
            <div className="text-blue-600 dark:text-blue-400 mb-3">
              <i className="fas fa-sync-alt mr-2"></i>
              有新版本可用！
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="bg-primary hover:bg-primaryDark text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                更新
              </button>
              <button
                onClick={close}
                className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                稍後
              </button>
            </div>
          </div>
        )}
        
        {offlineReady && !needRefresh && (
          <button
            onClick={close}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default UpdatePrompt;