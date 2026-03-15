import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      title: 'Spritesheet Extractor (Cocos2d)',
      description: 'Preparing sprites for Cocos2d creator from Spritesheet to .plist',
      extractor: {
        title: 'Sprite Extraction',
        description: 'Upload a PNG with transparent background to find sprites',
        minSize: 'Minimum sprite size (px):',
        upload: 'Upload image',
        processing: 'Processing...',
        found: 'Sprites found: {{count}} (selected {{selected}})',
        download: 'Download {{fileName}}.plist'
      },
      spriteExtractor: {
        minSize: 'Minimum sprite size (px):',
        upload: 'Select image and cut',
        processing: 'Processing...',
        error: 'Error processing image',
        errorAlert: 'An error occurred while cutting sprites.',
        notFound: 'No sprites found (or they are smaller than the minimum size).',
        loadError: 'Image load error',
        canvasError: 'Canvas context not supported'
      }
    }
  },
  ru: {
    translation: {
      title: 'Spritesheet Extractor (Cocos2d)',
      description: 'Подготовка спрайтов для Cocos2d creator из Spritesheet в .plist',
      extractor: {
        title: 'Извлечение спрайтов',
        description: 'Загрузите PNG с прозрачным фоном для поиска спрайтов',
        minSize: 'Минимальный размер спрайта (px):',
        upload: 'Загрузить картинку',
        processing: 'Обработка...',
        found: 'Найдено спрайтов: {{count}} (выбрано {{selected}})',
        download: 'Скачать {{fileName}}.plist'
      },
      spriteExtractor: {
        minSize: 'Минимальный размер спрайта (px):',
        upload: 'Выбрать картинку и нарезать',
        processing: 'Обработка...',
        error: 'Ошибка при обработке изображения:',
        errorAlert: 'Произошла ошибка при нарезке спрайтов.',
        notFound: 'Спрайты не найдены (или они меньше минимального размера).',
        loadError: 'Ошибка загрузки изображения',
        canvasError: 'Canvas context не поддерживается'
      }
    }
  },
  cn: {
    translation: {
      title: 'Spritesheet 提取器 (Cocos2d)',
      description: '将 Spritesheet 转换为 .plist 以供 Cocos2d creator 使用',
      extractor: {
        title: '提取精灵',
        description: '上传具有透明背景的 PNG 以查找精灵',
        minSize: '最小精灵尺寸 (px):',
        upload: '上传图片',
        processing: '处理中...',
        found: '发现精灵: {{count}} (已选 {{selected}})',
        download: '下载 {{fileName}}.plist'
      },
      spriteExtractor: {
        minSize: '最小精灵尺寸 (px):',
        upload: '选择图片并切割',
        processing: '处理中...',
        error: '处理图片时出错:',
        errorAlert: '切割精灵时发生错误。',
        notFound: '未发现精灵 (或它们小于最小尺寸)。',
        loadError: '图片加载错误',
        canvasError: '不支持 Canvas 内容'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
