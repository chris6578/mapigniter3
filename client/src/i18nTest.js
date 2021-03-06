import i18n from 'i18next';
import { reactI18nextModule } from 'react-i18next';

i18n
  .use(reactI18nextModule)
  .init({
    //fallbackLng: 'cimode',
    fallbackLng: 'en',
    debug: false,
    saveMissing: false,

    ns: ['translations'],
    defaultNS: 'translations',

    interpolation: {
      escapeValue: false, // not needed for react!!
    },

    // react i18next special options (optional)
    react: {
      wait: false,
      nsMode: 'fallback', // set it to fallback to let passed namespaces to translated hoc act as fallbacks
    },
  });


export default i18n;
