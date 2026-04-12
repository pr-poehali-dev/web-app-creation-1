import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { notifyContractUpdated } from '@/utils/dataSync';
import { generateContractHtml, printContractAsPdf } from '@/utils/contractGenerator';
import func2url from '../../backend/func2url.json';

export const CATEGORIES = [
  { value: 'dairy',        label: 'Молочная продукция' },
  { value: 'food',         label: 'Продукты питания' },
  { value: 'agriculture',  label: 'Сельхозпродукция (зерновые, овощи, фрукты)' },
  { value: 'construction', label: 'Стройматериалы' },
  { value: 'lumber',       label: 'Пиломатериалы' },
  { value: 'durable',      label: 'Товары длительного пользования' },
  { value: 'local',        label: 'Местная продукция' },
  { value: 'other',        label: 'Прочее' },
];

export const UNITS = ['т', 'кг', 'л', 'м³', 'м²', 'шт', 'упак', 'пал', 'услуга'];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  dairy:        ['молок', 'творог', 'кефир', 'сметан', 'сыр', 'масл', 'ряженк', 'йогурт', 'сливк', 'простоквашн'],
  food:         ['хлеб', 'мука', 'мясо', 'говядин', 'свинин', 'птиц', 'курин', 'рыб', 'яйц', 'сахар', 'соль', 'масло', 'овощ', 'фрукт', 'картоф', 'помидор', 'огурц', 'морков', 'свекл', 'лук', 'крупа', 'рис', 'гречк', 'макарон'],
  agriculture:  ['зерн', 'пшениц', 'ячмен', 'овес', 'кукуруз', 'подсолнечник', 'рапс', 'соя', 'сено', 'силос', 'комбикорм', 'семен'],
  construction: ['кирпич', 'цемент', 'бетон', 'песок', 'щебен', 'арматур', 'металл', 'труб', 'профил', 'плит', 'ламинат', 'паркет', 'обои', 'краск', 'стекл', 'пенобло', 'газобло'],
  lumber:       ['пиломатер', 'брус', 'доск', 'бревн', 'фанер', 'дсп', 'двп', 'осб', 'osb', 'вагонк', 'блок-хаус', 'террасн', 'половая', 'обрезн', 'необрезн', 'горбыл', 'рейк', 'штакетн'],
  durable:      ['техник', 'оборудован', 'станок', 'трактор', 'комбайн', 'автомобил', 'прицеп', 'насос', 'генератор', 'холодильник', 'морозильник', 'мебел'],
};

export function detectCategory(productName: string): string {
  const lower = productName.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return '';
}

export interface ContractFormData {
  contractType: string;
  category: string;
  title: string;
  description: string;
  productName: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  deliveryDate: string;
  contractStartDate: string;
  contractEndDate: string;
  deliveryAddress: string;
  deliveryMethod: string;
  deliveryTypes: string[];
  deliveryDistricts: string[];
  prepaymentPercent: string;
  termsConditions: string;
  productNameB: string;
  quantityB: string;
  unitB: string;
  categoryB: string;
  productImages: string[];
  productImagesB: string[];
  deliveryNotes: string;
}

const initialFormData: ContractFormData = {
  contractType: 'forward',
  category: '',
  title: '',
  description: '',
  productName: '',
  quantity: '',
  unit: 'т',
  pricePerUnit: '',
  deliveryDate: '',
  contractStartDate: new Date().toISOString().split('T')[0],
  contractEndDate: '',
  deliveryAddress: '',
  deliveryMethod: '',
  deliveryTypes: [],
  deliveryDistricts: [],
  prepaymentPercent: '0',
  termsConditions: '',
  productNameB: '',
  quantityB: '',
  unitB: 'т',
  categoryB: '',
  productImages: [],
  productImagesB: [],
  deliveryNotes: '',
};

export function useContractData(isAuthenticated: boolean) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedDocx, setGeneratedDocx] = useState<{ base64: string; url: string; filename: string } | null>(null);
  const [contractHtml, setContractHtml] = useState<string>('');
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [sellerProfile, setSellerProfile] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    checkVerification();
    loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(func2url['admin-users'] + `?id=${userId}`, { headers: { 'X-User-Id': userId } });
      if (res.ok) {
        const data = await res.json();
        const u = data.user || data;
        setSellerProfile({
          id: String(u.id || userId),
          firstName: u.firstName || u.first_name || '',
          lastName: u.lastName || u.last_name || '',
          middleName: u.middleName || u.middle_name || '',
          email: u.email || '',
          phone: u.phone || '',
          userType: u.userType || u.user_type || 'individual',
          companyName: u.companyName || u.company_name || '',
          inn: u.inn || '',
          ogrnip: u.ogrnip || '',
          ogrn: u.ogrn || '',
          legalAddress: u.legalAddress || u.legal_address || '',
          city: u.city || '',
          region: u.region || '',
          directorName: u.directorName || u.director_name || '',
        });
      }
    } catch (e) { console.error(e); }
  };

  const checkVerification = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) { setIsCheckingVerification(false); return; }
      const res = await fetch(func2url['verification-status'], { headers: { 'X-User-Id': userId } });
      if (res.ok) {
        const data = await res.json();
        const status = data.verificationStatus || data.verification_status;
        if (status === 'pending') {
          toast({ title: 'Верификация на рассмотрении', description: 'После одобрения вам будут доступны все возможности.', duration: 6000 });
          navigate('/trading');
          return;
        }
        if (status !== 'verified') {
          toast({ title: 'Требуется верификация', description: 'Для создания контрактов необходимо пройти верификацию.', variant: 'destructive' });
          navigate('/verification');
          return;
        }
        const userType = data.userType;
        if (userType && ['individual', 'self-employed'].includes(userType)) {
          toast({ title: 'Создание контрактов недоступно', description: 'Создавать форвардные и бартерные контракты могут только ИП и юридические лица.', duration: 8000 });
          navigate('/trading');
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsCheckingVerification(false);
  };

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const setArray = (field: 'deliveryTypes' | 'deliveryDistricts', values: string[]) =>
    setFormData(prev => ({ ...prev, [field]: values }));

  const setImages = (field: 'productImages' | 'productImagesB', urls: string[]) =>
    setFormData(prev => ({ ...prev, [field]: urls }));

  const handleProductNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      productName: value,
      category: prev.category || detectCategory(value),
      title: prev.title || (value ? (prev.contractType === 'forward-request' ? `Запрос: ${value}` : `Поставка: ${value}`) : ''),
    }));
  };

  const handleProductNameBChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      productNameB: value,
      categoryB: prev.categoryB || detectCategory(value),
    }));
  };

  const totalAmount = formData.quantity && formData.pricePerUnit
    ? parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)
    : 0;

  const prepaymentAmount = totalAmount * (parseFloat(formData.prepaymentPercent || '0') / 100);

  const validate = () => {
    if (!formData.productName) { toast({ title: 'Ошибка', description: 'Укажите название товара', variant: 'destructive' }); return false; }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) { toast({ title: 'Ошибка', description: 'Укажите количество товара', variant: 'destructive' }); return false; }
    if (formData.contractType === 'forward' && (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0)) {
      toast({ title: 'Ошибка', description: 'Укажите цену за единицу', variant: 'destructive' }); return false;
    }
    if (formData.contractType === 'barter' && !formData.productNameB) {
      toast({ title: 'Ошибка', description: 'Укажите товар для обмена (Товар Б)', variant: 'destructive' }); return false;
    }
    if (!formData.deliveryDate) { toast({ title: 'Ошибка', description: 'Укажите дату поставки', variant: 'destructive' }); return false; }
    if (!formData.category) { toast({ title: 'Ошибка', description: 'Выберите категорию товара', variant: 'destructive' }); return false; }
    return true;
  };

  const handleGenerate = () => {
    if (!validate()) return;
    setIsGenerating(true);

    const buyer = {
      firstName: '',
      lastName: '',
      companyName: '',
      inn: '',
      city: '',
      phone: '',
      email: '',
      userType: 'individual',
    };

    const html = generateContractHtml(
      { ...formData, totalAmount, prepaymentAmount, totalAmountB: totalAmount },
      sellerProfile,
      buyer,
    );
    setContractHtml(html);

    const backendUrl = (func2url as Record<string, string>)['generate-contract'];
    if (backendUrl) {
      const userId = localStorage.getItem('userId');
      fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId || '' },
        body: JSON.stringify({ data: { ...formData, totalAmount, prepaymentAmount, totalAmountB: totalAmount } }),
      })
        .then(r => r.json())
        .then(data => { if (data.success) setGeneratedDocx({ base64: data.docxBase64, url: data.docxUrl, filename: data.filename }); })
        .catch(() => {});
    }

    setStep('preview');
    setIsGenerating(false);
  };

  const downloadPdf = () => {
    if (contractHtml) printContractAsPdf(contractHtml);
  };

  const downloadDocx = () => {
    if (!generatedDocx) {
      toast({ title: 'DOCX недоступен', description: 'Скачайте PDF через кнопку «Скачать PDF (печать)»', duration: 4000 });
      return;
    }
    const blob = new Blob([Uint8Array.from(atob(generatedDocx.base64), c => c.charCodeAt(0))], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedDocx.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveContract = async (publish: boolean) => {
    if (!validate()) return;
    const setLoading = publish ? setIsPublishing : setIsSubmitting;
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const url = (func2url as Record<string, string>)['save-contract'];
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId || '' },
        body: JSON.stringify({
          ...formData,
          totalAmount,
          prepaymentAmount,
          documentUrl: generatedDocx?.url || null,
          publish,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notifyContractUpdated(data.contractId);
        if (publish) {
          toast({ title: 'Контракт опубликован', description: 'Контракт виден другим участникам платформы' });
        } else {
          toast({ title: 'Черновик сохранён', description: 'Контракт добавлен в раздел «Мои контракты»' });
        }
        navigate('/trading');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сохранить контракт', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Ошибка', description: 'Не удалось сохранить контракт', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToContracts = () => saveContract(false);
  const handlePublishContract = () => saveContract(true);

  return {
    formData,
    set,
    setArray,
    handleProductNameChange,
    handleProductNameBChange,
    totalAmount,
    prepaymentAmount,
    step,
    setStep,
    isCheckingVerification,
    isGenerating,
    isSubmitting,
    isPublishing,
    generatedDocx,
    contractHtml,
    handleGenerate,
    downloadPdf,
    downloadDocx,
    handleSaveToContracts,
    handlePublishContract,
    setImages,
  };
}