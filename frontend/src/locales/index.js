import { createI18n } from 'vue-i18n'
import tr from './tr.json'
import en from './en.json'
import it from './it.json'

const savedLocale = localStorage.getItem('locale') || 'tr'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'tr',
  messages: {
    tr,
    en,
    it
  }
})

export default i18n