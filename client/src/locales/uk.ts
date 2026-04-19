const uk = {
  // Navigation
  nav: {
    components: "Складові",
    products: "Продукти",
    settings: "Налаштування",
  },

  // Auth
  auth: {
    login: "Увійти",
    register: "Реєстрація",
    email: "Email",
    password: "Пароль",
    loginBtn: "Увійти",
    registerBtn: "Зареєструватись",
    noAccount: "Немає акаунту?",
    hasAccount: "Вже є акаунт?",
    logout: "Вийти",
  },

  // Components
  components: {
    title: "Складові",
    add: "Додати складову",
    edit: "Редагувати складову",
    empty: "Складові відсутні. Додайте першу!",
    name: "Назва",
    category: "Категорія",
    supplier: "Постачальник",
    photo: "Фотографія",
    batchQuantity: "Кількість у партії",
    batchTotalCost: "Загальна вартість (грн)",
    deliveryCost: "Вартість доставки (грн)",
    unitCost: "Розрахункова вартість одиниці",
    unitCostHint: "(вартість + доставка) ÷ кількість",
    usedQuantity: "Використано",
    availableQuantity: "Залишок",
    pcs: "шт",
    stockTitle: "Залишок на складі",
    tabAvailable: "В наявності",
    tabOutOfStock: "Закінчились",
    willBeOutOfStock: "Після додавання ця складова перейде до розділу «Закінчились»",
    addCategory: "Створити категорію",
    addSupplier: "Додати постачальника",
    search: "Пошук...",
    deleteConfirm: "Видалити цю складову?",
  },

  // Products
  products: {
    title: "Продукти",
    add: "Створити продукт",
    edit: "Редагувати продукт",
    empty: "Продукти відсутні. Створіть перший!",
    name: "Назва продукту",
    photo: "Фотографія продукту",
    totalCost: "Собівартість",
    recommendedPrice: "Рекомендована ціна",
    components: "Складові",
    addComponent: "Додати складову",
    pickComponents: "Оберіть компоненти",
    quantity: "Кількість",
    enterQuantity: "Вкажіть кількість",
    categoryBreakdown: "Розбивка по категоріям",
    save: "Зберегти продукт",
    shareProduct: "Поділитись",
    exportPdf: "Експорт PDF",
    linkCopied: "Посилання скопійовано!",
    deleteConfirm: "Видалити цей продукт?",
    pieces: "шт.",
  },

  // Settings
  settings: {
    title: "Налаштування",
    markupCoefficient: "Коефіцієнт націнки",
    markupHint: "Рекомендована ціна = собівартість × коефіцієнт",
    save: "Зберегти",
    saved: "Збережено",
  },

  // Public share page
  share: {
    price: "Ціна",
    composition: "Склад",
  },

  // Common
  common: {
    save: "Зберегти",
    cancel: "Скасувати",
    delete: "Видалити",
    edit: "Редагувати",
    back: "Назад",
    loading: "Завантаження...",
    error: "Помилка",
    required: "Обов'язкове поле",
    uploadPhoto: "Завантажити фото",
    changePhoto: "Змінити фото",
    takePhoto: "Зробити фото",
    currency: "грн",
    pieces: "шт.",
    next: "Далі",
    done: "Завершити",
    autoPrice: "Авто",
  },
} as const;

export default uk;
