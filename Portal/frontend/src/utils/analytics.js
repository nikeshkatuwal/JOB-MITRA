import mixpanel from 'mixpanel-browser';

export const initAnalytics = () => {
  mixpanel.init(process.env.MIXPANEL_TOKEN);
};

export const trackEvent = (eventName, properties) => {
  mixpanel.track(eventName, properties);
};
