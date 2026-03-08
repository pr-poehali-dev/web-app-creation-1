export interface AutoMake {
  id: string;
  name: string;
  models: string[];
}

export const AUTO_MAKES: AutoMake[] = [
  { id: 'lada', name: 'LADA (ВАЗ)', models: ['Granta', 'Vesta', 'XRAY', 'Largus', 'Niva', 'Niva Travel', '2107', '2109', '2110', '2114', '2115', 'Kalina', 'Priora'] },
  { id: 'gaz', name: 'ГАЗ', models: ['Gazelle', 'Gazelle Next', 'Gazelle Business', 'Sobol', 'Volga', '3110', '31105'] },
  { id: 'uaz', name: 'УАЗ', models: ['Patriot', 'Hunter', 'Буханка', '3962', 'Pickup', 'Profi'] },
  { id: 'kamaz', name: 'КАМАЗ', models: ['5320', '65115', '6520', '43118', '5490'] },
  { id: 'toyota', name: 'Toyota', models: ['Camry', 'Corolla', 'Land Cruiser', 'Land Cruiser Prado', 'RAV4', 'Hilux', 'Fortuner', 'Avensis', 'Yaris', 'Auris', 'Vitz', 'Mark II', 'Crown', 'Alphard', 'Vellfire', 'Hiace', 'Highlander'] },
  { id: 'lexus', name: 'Lexus', models: ['LX 570', 'LX 600', 'GX 460', 'RX 350', 'RX 450h', 'NX 200', 'ES 350', 'IS 250', 'LS 460'] },
  { id: 'honda', name: 'Honda', models: ['Accord', 'Civic', 'CR-V', 'HR-V', 'Pilot', 'Jazz', 'Fit', 'Odyssey', 'Ridgeline'] },
  { id: 'hyundai', name: 'Hyundai', models: ['Solaris', 'Creta', 'Tucson', 'Santa Fe', 'Elantra', 'Sonata', 'i30', 'ix35', 'Accent', 'Getz'] },
  { id: 'kia', name: 'Kia', models: ['Rio', 'Sportage', 'Sorento', 'Optima', 'Cerato', 'Soul', 'Carnival', 'Stinger', 'Seltos', 'Picanto'] },
  { id: 'bmw', name: 'BMW', models: ['3 серия', '5 серия', '7 серия', 'X3', 'X5', 'X6', 'X7', '1 серия', '4 серия', 'M3', 'M5'] },
  { id: 'mercedes', name: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'B-Class', 'CLA', 'G-Class'] },
  { id: 'audi', name: 'Audi', models: ['A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'A3', 'A5', 'TT', 'RS6'] },
  { id: 'volkswagen', name: 'Volkswagen', models: ['Polo', 'Passat', 'Tiguan', 'Touareg', 'Golf', 'Jetta', 'Caddy', 'Transporter', 'Crafter'] },
  { id: 'nissan', name: 'Nissan', models: ['X-Trail', 'Qashqai', 'Juke', 'Murano', 'Patrol', 'Pathfinder', 'Almera', 'Navara', 'NP300'] },
  { id: 'mitsubishi', name: 'Mitsubishi', models: ['Outlander', 'Pajero', 'Pajero Sport', 'L200', 'ASX', 'Eclipse Cross', 'Galant'] },
  { id: 'subaru', name: 'Subaru', models: ['Forester', 'Outback', 'Impreza', 'Legacy', 'Tribeca', 'XV', 'WRX'] },
  { id: 'mazda', name: 'Mazda', models: ['CX-5', 'CX-9', 'Mazda3', 'Mazda6', 'CX-3', 'MX-5', 'CX-30'] },
  { id: 'ford', name: 'Ford', models: ['Focus', 'Mondeo', 'Kuga', 'Explorer', 'Edge', 'Ranger', 'Transit', 'F-150', 'Mustang'] },
  { id: 'chevrolet', name: 'Chevrolet', models: ['Niva', 'Cruze', 'Orlando', 'Captiva', 'Cobalt', 'Spark', 'Tahoe', 'Trailblazer'] },
  { id: 'renault', name: 'Renault', models: ['Logan', 'Sandero', 'Duster', 'Kaptur', 'Arkana', 'Koleos', 'Megane', 'Fluence'] },
  { id: 'peugeot', name: 'Peugeot', models: ['308', '508', '3008', '5008', '2008', '408', '301', 'Partner', 'Expert'] },
  { id: 'citroen', name: 'Citroën', models: ['C4', 'C5', 'C3', 'DS5', 'Berlingo', 'Jumpy', 'Jumper'] },
  { id: 'skoda', name: 'Škoda', models: ['Octavia', 'Superb', 'Kodiaq', 'Karoq', 'Fabia', 'Rapid', 'Yeti'] },
  { id: 'volvo', name: 'Volvo', models: ['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60', 'V90'] },
  { id: 'land-rover', name: 'Land Rover', models: ['Range Rover', 'Range Rover Sport', 'Discovery', 'Defender', 'Freelander', 'Discovery Sport'] },
  { id: 'jeep', name: 'Jeep', models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Commander'] },
  { id: 'porsche', name: 'Porsche', models: ['Cayenne', 'Macan', 'Panamera', '911', 'Boxster', 'Cayman'] },
  { id: 'infiniti', name: 'Infiniti', models: ['QX80', 'QX60', 'Q50', 'Q70', 'FX35', 'FX50', 'JX35'] },
  { id: 'acura', name: 'Acura', models: ['MDX', 'RDX', 'TLX', 'ILX', 'ZDX'] },
  { id: 'cadillac', name: 'Cadillac', models: ['Escalade', 'CTS', 'SRX', 'XT5', 'XT6'] },
  { id: 'chery', name: 'Chery', models: ['Tiggo 7 Pro', 'Tiggo 8 Pro', 'Arrizo 5', 'Tiggo 4', 'OMODA 5', 'OMODA C5'] },
  { id: 'geely', name: 'Geely', models: ['Atlas', 'Coolray', 'Tugella', 'Emgrand', 'Monjaro', 'Cityray'] },
  { id: 'haval', name: 'Haval', models: ['F7', 'F7x', 'Jolion', 'H6', 'Dargo', 'H9'] },
  { id: 'great-wall', name: 'Great Wall', models: ['Wingle', 'Poer', 'Cannon'] },
  { id: 'other-make', name: 'Другая марка', models: ['Другая модель'] },
];

export const AUTO_BODY_TYPES = [
  'Седан',
  'Хэтчбек',
  'Универсал',
  'Внедорожник (SUV)',
  'Кроссовер',
  'Минивэн',
  'Пикап',
  'Кабриолет',
  'Купе',
  'Лифтбек',
  'Фургон',
  'Микроавтобус',
  'Грузовик',
  'Спецтехника',
];

export const AUTO_COLORS = [
  'Белый',
  'Чёрный',
  'Серебристый',
  'Серый',
  'Красный',
  'Синий',
  'Зелёный',
  'Бежевый',
  'Коричневый',
  'Золотистый',
  'Оранжевый',
  'Жёлтый',
  'Фиолетовый',
  'Другой',
];

export const AUTO_FUEL_TYPES = [
  'Бензин',
  'Дизель',
  'Газ (LPG)',
  'Газ (CNG)',
  'Гибрид (бензин+электро)',
  'Электро',
  'Другое',
];

export const AUTO_TRANSMISSION_TYPES = [
  'Механика (МКПП)',
  'Автомат (АКПП)',
  'Вариатор (CVT)',
  'Робот (РКПП)',
];

export const AUTO_DRIVE_TYPES = [
  'Передний привод',
  'Задний привод',
  'Полный привод (4x4)',
  'Подключаемый полный привод',
];

export const AUTO_CONDITION_TYPES = [
  'Отличное',
  'Хорошее',
  'Удовлетворительное',
  'Требует ремонта',
  'На запчасти',
];

export const AUTO_PTS_RECORDS = [
  '1 запись',
  '2 записи',
  '3 записи',
  '4 записи',
  '5 записей',
  '6 и более записей',
];

export const YEAR_OPTIONS: string[] = (() => {
  const years: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1960; y--) {
    years.push(String(y));
  }
  return years;
})();
