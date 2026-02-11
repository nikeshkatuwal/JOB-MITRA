import mixpanel from 'mixpanel-browser';

export const initAnalytics = () => {
  mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN);
};

export const trackEvent = (eventName, properties) => {
  mixpanel.track(eventName, properties);
};
