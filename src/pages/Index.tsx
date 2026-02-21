// Update this page (the content is just a fallback if you fail to update the page)
import SEO from '@/components/SEO';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SEO 
        title="Торговая площадка Якутии"
        description="ЕРТТП — единая региональная B2B торговая площадка Якутии. Покупайте и продавайте товары и услуги, участвуйте в аукционах и тендерах."
        keywords="торговая площадка Якутия, B2B Якутск, тендеры Якутия, закупки Якутия, ЕРТТП"
        canonical="/"
      />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 color-black text-black">Добро пожаловать!</h1>
        <p className="text-xl text-gray-600">тут будет отображаться ваш проект</p>
      </div>
    </div>
  );
};

export default Index;