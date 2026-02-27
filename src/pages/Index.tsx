// Update this page (the content is just a fallback if you fail to update the page)
import SEO from '@/components/SEO';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SEO 
        title="Единая торговая площадка"
        description="ЕРТТП — торговая площадка для бизнеса и частных лиц. Покупайте и продавайте товары и услуги, участвуйте в аукционах."
        keywords="торговая площадка, купить товары, продать товары, аукционы онлайн, ЕРТТП"
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