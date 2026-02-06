import { Toaster } from 'react-hot-toast';

export const CustomToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      success: {
        style: {
          background: '#10B981',
          color: 'white',
        },
      },
      error: {
        style: {
          background: '#EF4444',
          color: 'white',
        },
      },
      loading: {
        style: {
          background: '#3B82F6',
          color: 'white',
        },
      },
    }}
  />
);